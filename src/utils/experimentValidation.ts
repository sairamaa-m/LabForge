import type { BlockType, ExperimentDefinition } from "../types/experiment";
import { getBlockDefinition } from "../data/blockLibrary";
import { validateExpression } from "../runtime/expressions";

const validTypes = new Set<BlockType>([
  "start","end","if-else","loop","stimulus-text","stimulus-image","stimulus-audio","stimulus-video",
  "shape","fixation","clear-screen","wait","timer","keyboard-response","mouse-response","multiple-choice",
  "text-input","slider-response","record-data","variable","set-variable","randomize","custom-function",
]);

export interface ValidationResult { valid:boolean; errors:string[]; }

export function validateExperiment(experiment: ExperimentDefinition): ValidationResult {
  const errors:string[]=[];
  if(!experiment || experiment.schemaVersion!=="1.0") errors.push("Unsupported or missing schemaVersion.");
  if(!experiment?.id) errors.push("Experiment id is required.");
  if(!experiment?.name?.trim()) errors.push("Experiment name is required.");
  const nodes=experiment?.nodes??[], edges=experiment?.edges??[];
  const ids=new Set<string>();
  for(const n of nodes){
    if(!n.id) errors.push("Every node must have an id.");
    if(ids.has(n.id)) errors.push(`Duplicate node id: ${n.id}.`); ids.add(n.id);
    if(!validTypes.has(n.type)) errors.push(`Unsupported node type: ${n.type}.`);
    if(!getBlockDefinition(n.type)) errors.push(`Block type "${n.type}" is not registered.`);
    if(!n.config || typeof n.config!=="object") errors.push(`Node "${n.label}" has invalid configuration.`);
  }
  const edgeIds=new Set<string>();
  for(const e of edges){
    if(edgeIds.has(e.id)) errors.push(`Duplicate edge id: ${e.id}.`); edgeIds.add(e.id);
    if(!ids.has(e.source)) errors.push(`Edge ${e.id} references missing source ${e.source}.`);
    if(!ids.has(e.target)) errors.push(`Edge ${e.id} references missing target ${e.target}.`);
  }
  for(const e of edges){
    if(e.sourceHandle && !["true","false","body","exit"].includes(e.sourceHandle)) errors.push(`Edge ${e.id} uses unsupported source handle "${e.sourceHandle}".`);
    const source=nodes.find(n=>n.id===e.source);
    if(source && e.sourceHandle && !["if-else","loop"].includes(source.type)) errors.push(`Edge ${e.id} has a branch handle but source "${source.label}" is not a branch block.`);
  }
  const starts=nodes.filter(n=>n.type==="start"), ends=nodes.filter(n=>n.type==="end");
  if(starts.length!==1) errors.push("An experiment must contain exactly one START node.");
  if(!ends.length) errors.push("An experiment must contain at least one END node.");

  const vars=new Set(["lastResponse","lastResponseObject","trialNumber","sessionId"]);
  for(const v of (experiment.variables??[])) vars.add(v.name);
  for(const n of nodes){
    if(n.type==="variable"||n.type==="set-variable"){
      const name=String(n.config.variableName??""); if(!name) errors.push(`Node "${n.label}" requires a variable name.`);
      else vars.add(name);
    }
  }
  const scanConfig=(value:unknown,path:string)=>{
    if(typeof value==="string"){
      const m=value.match(/^\\$\\{([^}]+)\\}$/);
      if(m && !vars.has(m[1])) errors.push(`${path} references missing variable "${m[1]}".`);
      return;
    }
    if(Array.isArray(value)){value.forEach((v,i)=>scanConfig(v,`${path}[${i}]`));return;}
    if(value && typeof value==="object") for(const [k,v] of Object.entries(value as Record<string,unknown>)) scanConfig(v,`${path}.${k}`);
  };
  for(const n of nodes){
    scanConfig(n.config,`Node "${n.label}" configuration`);
    if(["if-else","record-data","set-variable","stimulus-text","stimulus-image","shape","keyboard-response","mouse-response","multiple-choice","text-input","slider-response"].includes(n.type)){
      if(n.config.condition) validateExpression(n.config.condition,vars,errors,`Node "${n.label}" condition`);
      if(n.config.value) validateExpression(n.config.value,vars,errors,`Node "${n.label}" value`);
      if(n.config.correctAnswer) validateExpression(n.config.correctAnswer,vars,errors,`Node "${n.label}" correctAnswer`);
    }
    if(n.type==="if-else"){
      const outs=edges.filter(e=>e.source===n.id);
      if(!outs.some(e=>e.sourceHandle==="true")) errors.push(`If/Else "${n.label}" is missing a TRUE branch.`);
      if(!outs.some(e=>e.sourceHandle==="false")) errors.push(`If/Else "${n.label}" is missing a FALSE branch.`);
    }
    if(n.type==="loop"){
      const outs=edges.filter(e=>e.source===n.id);
      if(!outs.some(e=>e.sourceHandle==="body")) errors.push(`Loop "${n.label}" is missing a BODY branch.`);
      if(!outs.some(e=>e.sourceHandle==="exit")) errors.push(`Loop "${n.label}" is missing an EXIT branch.`);
      const count=Number(n.config.iterations); if(!Number.isFinite(count)||count<0) errors.push(`Loop "${n.label}" has invalid iterations.`);
    }
    if(n.type==="mouse-response" && n.config.targetId){
      if(!nodes.some(x=>String(x.config.objectId??x.id)===String(n.config.targetId))) errors.push(`Mouse Response references stimulus "${String(n.config.targetId)}", but that stimulus does not exist.`);
    }
    if(["keyboard-response","mouse-response","multiple-choice"].includes(n.type)){
      if(n.config.timeoutMs!==undefined && Number(n.config.timeoutMs)<0) errors.push(`Response "${n.label}" has an invalid timeout.`);
    }
  }

  if(starts.length===1){
    const adjacency=new Map<string,string[]>();
    for(const e of edges) adjacency.set(e.source,[...(adjacency.get(e.source)??[]),e.target]);
    const visited=new Set<string>(), q=[starts[0].id];
    while(q.length){const id=q.shift()!;if(visited.has(id))continue;visited.add(id);for(const x of adjacency.get(id)??[])if(!visited.has(x))q.push(x);}
    if(!ends.some(e=>visited.has(e.id))) errors.push("At least one END node must be reachable from START.");
    for(const n of nodes) if(!visited.has(n.id)) errors.push(`Node "${n.label}" is unreachable from START.`);
  }
  return {valid:errors.length===0,errors};
}
