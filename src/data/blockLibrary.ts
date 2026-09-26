import type { BlockCategory, BlockDefinition } from "../types/experiment";

export const categoryOrder: BlockCategory[] = ["flow","stimulus","timing","response","data","randomization","functions"];
export const categoryLabels: Record<BlockCategory, string> = {
  flow:"Flow", stimulus:"Stimulus", timing:"Timing", response:"Response",
  data:"Data", randomization:"Randomization", functions:"Functions",
};

const flow = (blockType: any,label:string,description:string,defaultConfig:any, extra:any={}) =>
  ({blockType,category:"flow",label,description,defaultConfig,execution:{kind:"control",description},errorBehavior:"error",...extra});
const stimulus = (blockType:any,label:string,description:string,defaultConfig:any, extra:any={}) =>
  ({blockType,category:"stimulus",label,description,defaultConfig,participantVisible:true,execution:{kind:"stimulus",description},timing:"duration",errorBehavior:"error",...extra});
const timing = (blockType:any,label:string,description:string,defaultConfig:any, extra:any={}) =>
  ({blockType,category:"timing",label,description,defaultConfig,execution:{kind:"timing",description},errorBehavior:"error",...extra});
const response = (blockType:any,label:string,description:string,defaultConfig:any, extra:any={}) =>
  ({blockType,category:"response",label,description,defaultConfig,producesData:true,timing:"response",execution:{kind:"response",description},timeoutBehavior:"record-timeout",errorBehavior:"error",...extra});
const data = (blockType:any,label:string,description:string,defaultConfig:any, extra:any={}) =>
  ({blockType,category:"data",label,description,defaultConfig,producesData:true,execution:{kind:"data",description},errorBehavior:"error",...extra});

export const blockDefinitions: BlockDefinition[] = [
  flow("start","Start","Entry point of the experiment",{}, {outputs:[{name:"next",label:"Next",kind:"control"}]}),
  flow("end","End","Exit point of the experiment",{}, {inputs:[{name:"in",label:"In",kind:"control",required:true}]}),
  flow("if-else","If / Else","Branch using a safe expression",{condition:{op:"literal",value:false}}, {inputs:[{name:"in",label:"In",kind:"control"}],outputs:[{name:"true",label:"True",kind:"control"},{name:"false",label:"False",kind:"control"}]}),
  flow("loop","Loop","Repeat downstream body a bounded number of times",{iterations:1,maxIterations:1000}, {inputs:[{name:"in",label:"In",kind:"control"}],outputs:[{name:"body",label:"Body",kind:"control"},{name:"exit",label:"Exit",kind:"control"}]}),
  stimulus("stimulus-text","Text","Display text",{stimulusType:"text",content:"Sample text",duration:0,position:{x:50,y:50},opacity:1}),
  stimulus("stimulus-image","Image","Display an image",{stimulusType:"image",src:"",duration:0,position:{x:50,y:50},opacity:1}),
  stimulus("stimulus-audio","Audio","Play an audio stimulus",{stimulusType:"audio",src:"",duration:1000}),
  stimulus("stimulus-video","Video","Play a video stimulus",{stimulusType:"video",src:"",duration:2000}),
  stimulus("shape","Shape","Display a configurable geometric object",{shape:"circle",position:{x:50,y:50},size:{width:160,height:160},fill:"#ef4444",borderColor:"#111827",borderWidth:0,opacity:1,rotation:0,duration:0,objectId:"shape1"}),
  stimulus("fixation","Fixation","Display a fixation cross",{duration:500,position:{x:50,y:50}}),
  stimulus("clear-screen","Clear Screen","Remove participant-visible objects",{duration:0}),
  timing("wait","Wait","Delay execution",{duration:500}),
  timing("timer","Timer","Start or stop a named timer",{timerName:"timer1",duration:1000,action:"start"}),
  response("keyboard-response","Keyboard Response","Wait for a keyboard response",{allowedKeys:["F","J"],timeoutMs:3000,measureRT:true,correctKey:null}),
  response("mouse-response","Mouse Response","Wait for a targeted mouse click",{targetId:"",allowedButton:"left",timeoutMs:3000,measureRT:true}),
  response("multiple-choice","Multiple Choice","Present selectable answer options",{options:["Option A","Option B"],timeoutMs:0,measureRT:true,correctAnswer:null}),
  response("text-input","Text Input","Collect free text",{prompt:"",placeholder:"",maxLength:200,timeoutMs:0,measureRT:false}),
  response("slider-response","Slider","Collect a numeric rating",{min:0,max:100,step:1,initialValue:50,labels:{min:"Low",max:"High"},timeoutMs:0,measureRT:true}),
  data("record-data","Record Data","Record variables or expressions",{fieldName:"response",value:{op:"variable",name:"lastResponse"}}),
  data("variable","Variable","Set a variable value",{variableName:"var1",initialValue:""}),
  data("set-variable","Set Variable","Set, copy, increment, decrement, or calculate a variable",{variableName:"var1",operation:"set",value:{op:"literal",value:""}}),
  data("randomize","Randomize","Shuffle or randomize values",{mode:"shuffle",items:[],seed:""}),
  {blockType:"custom-function",category:"functions",label:"Custom Block",description:"Reference a reusable no-code block group",defaultConfig:{definitionId:""},execution:{kind:"control",description:"Reusable definition placeholder"},errorBehavior:"error"},
];

export function getBlockDefinition(blockType: string): BlockDefinition | undefined {
  return blockDefinitions.find((b) => b.blockType === blockType);
}
