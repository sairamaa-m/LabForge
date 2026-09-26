import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, CheckCircle2, Keyboard, MousePointerClick, Sparkles } from "lucide-react";
import { useNavigate } from "react-router-dom";
import type { ExperimentDefinition, ExperimentNode } from "../types/experiment";
import { ExperimentRuntime, MemoryTrialStore } from "./runtimeEngine";
import type { RuntimeHost, RuntimeObject, TrialRecord } from "./runtimeTypes";
import Button from "../components/ui/Button";

function Stimulus({node}:{node:ExperimentNode}){
  const c=node.config;
  const pos=(c.position??{}) as Record<string,unknown>, size=(c.size??{}) as Record<string,unknown>;
  if(node.type==="shape"){
    return <div style={{width:Number(size.width??160),height:Number(size.height??160),background:String(c.fill??"#ef4444"),border:`${Number(c.borderWidth??0)}px solid ${String(c.borderColor??"#111827")}`,borderRadius:c.shape==="circle"?"9999px":"8px",opacity:Number(c.opacity??1),transform:`rotate(${Number(c.rotation??0)}deg)`}} />;
  }
  if(node.type==="fixation") return <div className="text-6xl font-light">+</div>;
  if(node.type==="stimulus-image" && c.src) return <img src={String(c.src)} alt="Experiment stimulus" className="max-h-72 max-w-full rounded-lg object-contain" />;
  if(node.type==="stimulus-video" && c.src) return <video src={String(c.src)} autoPlay className="max-h-72 max-w-full" />;
  if(node.type==="stimulus-audio" && c.src) return <audio src={String(c.src)} autoPlay controls />;
  return <div className="text-5xl font-semibold tracking-tight">{String(c.content??"Stimulus")}</div>;
}

export default function PreviewRunner({experiment}:{experiment:ExperimentDefinition}){
  const navigate=useNavigate();
  const store=useMemo(()=>new MemoryTrialStore(),[]);
  const [visibleNode,setVisibleNode]=useState<ExperimentNode|null>(null);
  const [runtimeObject,setRuntimeObject]=useState<RuntimeObject|null>(null);
  const [responseNode,setResponseNode]=useState<ExperimentNode|null>(null);
  const [done,setDone]=useState(false);
  const [trials,setTrials]=useState<TrialRecord[]>([]);
  const [error,setError]=useState<string|null>(null);
  const [text,setText]=useState("");
  const [slider,setSlider]=useState(50);

  useEffect(()=>{
    let timeoutId:number|undefined;
    const host:RuntimeHost={
      showNode:(node,obj)=>{setVisibleNode(node);setRuntimeObject(obj??null);setResponseNode(null);setText("");},
      clearScreen:()=>{setVisibleNode(null);setRuntimeObject(null);},
      waitForResponse:(node,_context,onResponse,onTimeout)=>{
        setResponseNode(node);
        if(node.type!=="keyboard-response" && node.type!=="mouse-response")setVisibleNode(null);
        const timeout=Number(node.config.timeoutMs??0);
        if(timeout>0)timeoutId=window.setTimeout(onTimeout,timeout);
        (window as Window & {__xlabRespond?: (value:unknown)=>void}).__xlabRespond=onResponse;
      },
      finish:()=>{setVisibleNode(null);setRuntimeObject(null);setResponseNode(null);setDone(true);setTrials(store.getTrials() as TrialRecord[]);}
    };
    const runtime=new ExperimentRuntime({experiment,store},host);
    runtime.start();
    if(runtime.getState().error)setError(runtime.getState().error??null);
    return()=>{if(timeoutId)window.clearTimeout(timeoutId);delete (window as Window & {__xlabRespond?: (value:unknown)=>void}).__xlabRespond;};
  },[experiment,store]);

  useEffect(()=>{
    const onKey=(event:KeyboardEvent)=>{
      if(!responseNode||responseNode.type!=="keyboard-response")return;
      const allowed=Array.isArray(responseNode.config.allowedKeys)?responseNode.config.allowedKeys.map(String):[];
      const valid=allowed.length===0||allowed.some(k=>k.toLowerCase()===event.key.toLowerCase());
      (window as Window & {__xlabRespond?: (value:unknown)=>void}).__xlabRespond?.({key:event.key,valid});
    };
    window.addEventListener("keydown",onKey); return()=>window.removeEventListener("keydown",onKey);
  },[responseNode]);

  const respond=(value:unknown)=>(window as Window & {__xlabRespond?: (value:unknown)=>void}).__xlabRespond?.(value);

  return <div className="min-h-screen bg-paper">
    <header className="flex h-14 items-center justify-between border-b border-line bg-white px-5">
      <button onClick={()=>navigate("/builder")} className="flex items-center gap-2 text-sm text-ink-soft hover:text-ink"><ArrowLeft className="h-4 w-4"/> Back to builder</button>
      <div className="flex items-center gap-2 text-sm font-medium"><Sparkles className="h-4 w-4 text-signal"/> Participant Preview</div><div className="w-24"/>
    </header>
    <main className="mx-auto flex min-h-[calc(100vh-3.5rem)] max-w-3xl items-center justify-center px-6 py-12">
      <section className="relative flex min-h-[500px] w-full flex-col items-center justify-center rounded-xl border border-line bg-white p-10 shadow-panel">
        <p className="absolute left-5 top-4 text-xs font-medium uppercase tracking-widest text-ink-soft">{experiment.name}</p>
        {error&&<div className="mt-6 rounded-md bg-red-50 p-4 text-sm text-red-700">{error}</div>}
        {!error&&!done&&visibleNode&&<div className="mt-8 flex items-center justify-center"><Stimulus node={visibleNode}/></div>}
        {!error&&!done&&responseNode&&<div className="mt-8 w-full text-center">
          {responseNode.type==="keyboard-response"&&<><Keyboard className="mx-auto h-8 w-8 text-orange-600"/><p className="mt-3 text-sm text-ink-soft">Press {Array.isArray(responseNode.config.allowedKeys)?responseNode.config.allowedKeys.join(" / "):"a key"}</p></>}
          {responseNode.type==="mouse-response"&&<div className="flex flex-col items-center gap-3"><MousePointerClick className="h-7 w-7 text-orange-600"/><p className="text-sm text-ink-soft">Click the target</p></div>}
          {responseNode.type==="multiple-choice"&&<div className="mx-auto mt-5 grid max-w-sm gap-2">{(Array.isArray(responseNode.config.options)?responseNode.config.options:[]).map(o=><Button key={String(o)} variant="secondary" onClick={()=>respond({selectedOption:o})}>{String(o)}</Button>)}</div>}
          {responseNode.type==="text-input"&&<div className="mx-auto mt-5 max-w-md"><p className="mb-3 text-sm">{String(responseNode.config.prompt??"Enter your response")}</p><input autoFocus maxLength={Number(responseNode.config.maxLength??200)} placeholder={String(responseNode.config.placeholder??"")} value={text} onChange={e=>setText(e.target.value)} onKeyDown={e=>{if(e.key==="Enter")respond({text});}} className="w-full rounded-md border border-line px-3 py-2"/><Button className="mt-3" onClick={()=>respond({text})}>Submit</Button></div>}
          {responseNode.type==="slider-response"&&<div className="mx-auto mt-5 max-w-md"><input type="range" className="w-full" min={Number(responseNode.config.min??0)} max={Number(responseNode.config.max??100)} step={Number(responseNode.config.step??1)} value={slider} onChange={e=>setSlider(Number(e.target.value))}/><div className="text-sm">{slider}</div><Button className="mt-3" onClick={()=>respond({value:slider})}>Continue</Button></div>}
        </div>}
        {responseNode?.type==="mouse-response"&&runtimeObject&&<button aria-label="experiment target" onClick={e=>respond({targetId:runtimeObject.id,x:e.clientX,y:e.clientY,button:e.button})} style={{position:"absolute",left:`${Number(runtimeObject.position?.x??50)}%`,top:`${Number(runtimeObject.position?.y??50)}%`,transform:"translate(-50%,-50%)",width:runtimeObject.dimensions?.width,height:runtimeObject.dimensions?.height}}><Stimulus node={visibleNode??({} as ExperimentNode)}/></button>}
        {done&&<div className="py-10 text-center"><CheckCircle2 className="mx-auto h-10 w-10 text-emerald-600"/><h1 className="mt-4 font-display text-2xl font-semibold">Experiment complete</h1><p className="mt-2 text-sm text-ink-soft">Trial data was recorded locally for this preview.</p><div className="mt-5 text-sm font-medium">{trials.length} trial record{trials.length===1?"":"s"}{trials[0]?.reactionTimeMs!==undefined?` · ${Math.round(trials[0].reactionTimeMs)} ms RT`:""}</div></div>}
      </section>
    </main>
  </div>;
}
