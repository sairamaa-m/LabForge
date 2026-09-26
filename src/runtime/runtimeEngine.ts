import type { ExperimentDefinition, ExperimentNode } from "../types/experiment";
import { validateExperiment } from "../utils/experimentValidation";
import { evaluateConfigValue, evaluateExpression } from "./expressions";
import type { RuntimeDefinition, RuntimeHost, RuntimeObject, RuntimeState, TrialRecord, TrialStore } from "./runtimeTypes";

const makeId=(prefix:string)=>`${prefix}-${Date.now()}-${Math.random().toString(36).slice(2,8)}`;

export class MemoryTrialStore implements TrialStore {
  private trials: TrialRecord[]=[];
  saveTrial(trial:TrialRecord){ this.trials.push(trial); }
  getTrials(){ return [...this.trials]; }
}

export class ExperimentRuntime {
  private readonly experiment:ExperimentDefinition;
  private readonly store:TrialStore;
  private readonly host:RuntimeHost;
  private readonly sessionId=makeId("session");
  private currentNodeId:string|null=null;
  private activeTrial:TrialRecord|null=null;
  private trialIndex=0;
  private variables:Record<string,unknown>={};
  private objects=new Map<string,RuntimeObject>();
  private loopCounts=new Map<string,number>();
  private timers=new Map<string,number>();
  private state:RuntimeState={status:"idle",currentNodeId:null,trial:null};
  private responseTimeout:number|undefined;

  constructor({experiment,store}:RuntimeDefinition,host:RuntimeHost){
    this.experiment=experiment; this.store=store; this.host=host;
    for(const v of experiment.variables) this.variables[v.name]=v.value;
  }
  getState(){return this.state;}
  getVariables(){return {...this.variables};}
  getRuntimeObjects(){return [...this.objects.values()];}

  start(){
    const validation=validateExperiment(this.experiment);
    if(!validation.valid){this.fail(validation.errors.join(" "));return;}
    const start=this.experiment.nodes.find(n=>n.type==="start");
    if(!start){this.fail("Experiment has no START node.");return;}
    this.currentNodeId=start.id;
    this.state={status:"running",currentNodeId:start.id,trial:null};
    this.advance();
  }

  private outgoing(node:ExperimentNode,handle?:string){
    const edges=this.experiment.edges.filter(e=>e.source===node.id);
    const chosen=handle ? edges.find(e=>(e.sourceHandle??"")===handle) : edges[0];
    return chosen ? this.experiment.nodes.find(n=>n.id===chosen.target)??null : null;
  }
  private goto(node:ExperimentNode,handle?:string){
    const next=this.outgoing(node,handle);
    if(!next){this.fail(`${node.label} has no valid next connection${handle?` for "${handle}"`:""}.`);return;}
    this.currentNodeId=next.id; this.advance();
  }
  private context(){return {variables:this.variables};}

  private advance(){
    if(!this.currentNodeId)return;
    const node=this.experiment.nodes.find(n=>n.id===this.currentNodeId);
    if(!node){this.fail(`Runtime could not find node ${this.currentNodeId}.`);return;}
    this.state={...this.state,status:"running",currentNodeId:node.id};

    try{
      switch(node.type){
        case "start": this.goto(node); break;
        case "end":
          if(this.activeTrial) this.finishTrial();
          this.state={status:"complete",currentNodeId:node.id,trial:null}; this.host.finish(); break;
        case "variable":
        case "set-variable": {
          const name=String(node.config.variableName??"");
          if(!name) throw new Error(`${node.label} requires a variable name.`);
          if(node.type==="variable") this.variables[name]=evaluateConfigValue(node.config.initialValue,this.context());
          else {
            const op=String(node.config.operation??"set");
            const value=evaluateConfigValue(node.config.value,this.context());
            const current=Number(this.variables[name]??0);
            if(op==="increment") this.variables[name]=current+(Number(value)||1);
            else if(op==="decrement") this.variables[name]=current-(Number(value)||1);
            else if(op==="copy") this.variables[name]=this.variables[String(node.config.sourceVariable??"")];
            else if(op==="calculate") this.variables[name]=value;
            else this.variables[name]=value;
          }
          this.goto(node); break;
        }
        case "record-data": {
          if(!this.activeTrial) this.beginTrial();
          const field=String(node.config.fieldName??"value");
          const value=evaluateConfigValue(node.config.value ?? {op:"variable",name:"lastResponse"},this.context());
          this.activeTrial!.data={...(this.activeTrial!.data??{}),[field]:value};
          this.goto(node); break;
        }
        case "if-else": {
          const result=Boolean(evaluateExpression(node.config.condition ?? {op:"literal",value:false},this.context()));
          this.goto(node,result?"true":"false"); break;
        }
        case "loop": {
          const max=Math.max(1,Math.min(10000,Number(evaluateConfigValue(node.config.maxIterations??1000,this.context()))||1000));
          const requested=Math.max(0,Math.floor(Number(evaluateConfigValue(node.config.iterations??1,this.context()))||0));
          const count=this.loopCounts.get(node.id)??0;
          if(count<Math.min(requested,max)){this.loopCounts.set(node.id,count+1);this.goto(node,"body");}
          else {this.loopCounts.delete(node.id);this.goto(node,"exit");}
          break;
        }
        case "wait":
          window.setTimeout(()=>this.goto(node),Math.max(0,Number(evaluateConfigValue(node.config.duration??0,this.context()))||0)); break;
        case "timer": {
          const name=String(node.config.timerName??"timer1"), action=String(node.config.action??"start");
          if(action==="start")this.timers.set(name,performance.now());
          if(action==="stop" && this.timers.has(name))this.variables[name]=performance.now()-(this.timers.get(name)??performance.now());
          const duration=Number(evaluateConfigValue(node.config.duration??0,this.context()))||0;
          if(duration>0)window.setTimeout(()=>this.goto(node),duration); else this.goto(node);
          break;
        }
        case "randomize": {
          if(node.config.mode==="shuffle" && Array.isArray(node.config.items)){
            const a=[...node.config.items] as unknown[];
            for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}
            if(node.config.outputVariable)this.variables[String(node.config.outputVariable)]=a;
          }
          if(node.config.outputVariable && node.config.mode==="choice"){
            const a=Array.isArray(node.config.items)?node.config.items:[]; this.variables[String(node.config.outputVariable)]=a[Math.floor(Math.random()*a.length)];
          }
          this.goto(node); break;
        }
        case "custom-function":
          throw new Error(`Custom block "${String(node.config.definitionId??"")}" is not executable until a reusable definition is supplied.`);
        case "clear-screen":
          this.objects.clear(); this.host.clearScreen?.(); this.goto(node); break;
        case "stimulus-text":
        case "stimulus-image":
        case "stimulus-audio":
        case "stimulus-video":
        case "shape":
        case "fixation":
          this.showStimulus(node); break;
        case "keyboard-response":
        case "mouse-response":
        case "multiple-choice":
        case "text-input":
        case "slider-response":
          this.waitResponse(node); break;
        default: this.fail(`Unsupported runtime node ${node.type}.`);
      }
    }catch(error){this.fail(`${node.label}: ${error instanceof Error?error.message:String(error)}`);}
  }

  private beginTrial(){
    if(this.activeTrial)return;
    this.trialIndex++;
    this.variables.trialNumber=this.trialIndex;
    this.variables.sessionId=this.sessionId;
    this.activeTrial={id:makeId("trial"),experimentId:this.experiment.id,sessionId:this.sessionId,trialIndex:this.trialIndex,startTime:performance.now(),completedAt:new Date().toISOString(),variables:{...this.variables},responses:[],data:{}};
    this.state={...this.state,trial:this.activeTrial};
  }

  private resolveValue(value: unknown): unknown {
    if(value && typeof value==="object" && "op" in (value as object)) return evaluateConfigValue(value,this.context());
    if(Array.isArray(value)) return value.map(v=>this.resolveValue(v));
    if(value && typeof value==="object") return Object.fromEntries(Object.entries(value as Record<string,unknown>).map(([k,v])=>[k,this.resolveValue(v)]));
    return evaluateConfigValue(value,this.context());
  }

  private showStimulus(node:ExperimentNode){
    if(this.activeTrial?.responseNodeId) this.finishTrial();
    this.beginTrial();
    const cfg=this.resolveValue(node.config) as Record<string,unknown>;
    const resolvedNode={...node,config:cfg};
    const objectId=String(cfg.objectId??node.id);
    const pos=(cfg.position??{}) as Record<string,unknown>;
    const size=(cfg.size??{}) as Record<string,unknown>;
    const object:RuntimeObject={id:objectId,type:node.type,bounds:{x:Number(pos.x??50),y:Number(pos.y??50),width:Number(size.width??160),height:Number(size.height??160)},position:{x:Number(pos.x??50),y:Number(pos.y??50)},dimensions:{width:Number(size.width??160),height:Number(size.height??160)},visible:true,properties:{...cfg}};
    this.objects.set(objectId,object);
    this.activeTrial!.stimulusNodeId=node.id;
    if(cfg.trialType==="practice" || cfg.trialType==="main") this.activeTrial!.trialType=cfg.trialType;
    if(cfg.condition!==undefined) this.activeTrial!.condition=String(cfg.condition);
    this.host.showNode(resolvedNode,object);
    requestAnimationFrame(()=>{
      if(!this.activeTrial)return;
      this.activeTrial.stimulusShownAt=performance.now();
      const duration=Number(evaluateConfigValue(cfg.duration??0,this.context()))||0;
      if(duration>0)window.setTimeout(()=>this.advanceAfterStimulus(node),duration);
      else this.advanceAfterStimulus(node);
    });
  }

  private advanceAfterStimulus(node:ExperimentNode){this.goto(node);}

  private waitResponse(node:ExperimentNode){
    this.beginTrial();
    const resolvedNode={...node,config:this.resolveValue(node.config) as Record<string,unknown>};
    this.state={...this.state,status:"waiting-response",currentNodeId:node.id,trial:this.activeTrial};
    const timeout=Math.max(0,Number(evaluateConfigValue(node.config.timeoutMs??0,this.context()))||0);
    if(this.responseTimeout)window.clearTimeout(this.responseTimeout);
    if(timeout>0)this.responseTimeout=window.setTimeout(()=>this.completeResponse(node,{timedOut:true}),timeout);
    this.host.waitForResponse(resolvedNode,{objects:this.getRuntimeObjects(),onset:this.activeTrial?.stimulusShownAt},r=>this.completeResponse(node,r),()=>this.completeResponse(node,{timedOut:true}));
  }

  private completeResponse(node:ExperimentNode,response:unknown){
    if(this.responseTimeout)window.clearTimeout(this.responseTimeout);
    if(!this.activeTrial){this.fail("Response received without an active trial.");return;}
    const responseAt=performance.now();
    const result=response && typeof response==="object" ? response as Record<string,unknown> : {value:response};
    const timedOut=Boolean(result.timedOut);
    const rt=this.activeTrial.stimulusShownAt!==undefined ? Math.max(0,responseAt-this.activeTrial.stimulusShownAt) : undefined;
    const responseValue=result.value ?? result.key ?? result.selectedOption ?? result.text ?? result.targetId ?? response;
    this.variables.lastResponse=responseValue;
    this.variables.lastResponseObject=response;
    this.activeTrial.responseNodeId=node.id; this.activeTrial.responseAt=responseAt; this.activeTrial.response=responseValue;
    this.activeTrial.responseType=node.type; this.activeTrial.reactionTimeMs=rt; this.activeTrial.timedOut=timedOut;
    this.activeTrial.responses=[...(this.activeTrial.responses??[]),response];
    const expected=evaluateConfigValue(node.config.correctAnswer,this.context());
    if(expected!==undefined && !timedOut)this.activeTrial.correct=responseValue===expected;
    this.state={...this.state,status:"running",trial:this.activeTrial};
    this.goto(node);
  }

  private finishTrial(){
    if(!this.activeTrial)return;
    this.activeTrial.endTime=performance.now();
    this.activeTrial.completedAt=new Date().toISOString();
    this.activeTrial.variables={...this.variables};
    this.store.saveTrial({...this.activeTrial});
    this.activeTrial=null;
  }

  private fail(error:string){this.state={status:"error",currentNodeId:this.currentNodeId,trial:this.activeTrial,error};}
}
