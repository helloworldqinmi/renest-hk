'use client';
import {useEffect,useRef} from 'react';
import type {StudioPhase} from '@/lib/studio-data';
const phases:StudioPhase[]=['old-ready','old-scan','inventory','new-ready','new-scan','new-convert','empty','preferences','generating','results','summary'];
const animated=new Set<StudioPhase>(['old-scan','new-scan','new-convert','generating']);

export function useStudioHistory(phase:StudioPhase,enabled:boolean,navigate:(phase:StudioPhase)=>void){
 const last=useRef<StudioPhase|null>(null),fromPop=useRef(false),replaceNext=useRef(false),journey=useRef(''),live=useRef(navigate);live.current=navigate;
 useEffect(()=>{
  if(!enabled)return;
  if(!journey.current)journey.current=crypto.randomUUID();
  const pop=(event:PopStateEvent)=>{const state=event.state?.renestStep;if(state?.journey===journey.current&&phases.includes(state.phase)){fromPop.current=true;live.current(state.phase);}};
  window.addEventListener('popstate',pop);return()=>window.removeEventListener('popstate',pop);
 },[enabled]);
 useEffect(()=>{
  if(!enabled)return;
  if(fromPop.current){fromPop.current=false;last.current=phase;return;}
  if(last.current===phase)return;
  const replace=last.current===null||replaceNext.current||(animated.has(last.current)&&!animated.has(phase));
  const previous=window.history.state?.renestStep;
  const depth=previous?.journey===journey.current?previous.depth:0;
  const state={...window.history.state,renestStep:{journey:journey.current,phase,depth:replace?depth:depth+1}};
  if(replace)window.history.replaceState(state,'');else window.history.pushState(state,'');
  replaceNext.current=false;last.current=phase;
 },[phase,enabled]);
 return (fallback:StudioPhase)=>{
  const step=window.history.state?.renestStep;
  if(step?.journey===journey.current&&step.depth>0){window.history.back();return;}
  replaceNext.current=true;live.current(fallback);
 };
}
