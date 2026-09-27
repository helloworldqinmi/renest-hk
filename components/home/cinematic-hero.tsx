'use client';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { ArrowRight, ArrowDown, Pause, Play, Sun, Moon } from 'lucide-react';
import { useReducedMotion } from 'framer-motion';
import type { HomeSceneProps, SceneMode } from '@/components/studio/home-scene';
import { allExistingIds } from '@/lib/studio-data';
import styles from './cinematic-hero.module.css';
const Scene=dynamic<HomeSceneProps>(()=>import('@/components/studio/home-scene').then(m=>m.HomeScene),{ssr:false,loading:()=> <div className={styles.sceneLoading}>A new chapter is taking shape…</div>});
const chapters=[{name:'The home you know',caption:'A life already well furnished.',mode:'old' as SceneMode},{name:'The things you bring',caption:'Move what matters.',mode:'move' as SceneMode},{name:'A new way to live',caption:'Familiar pieces. Fresh possibilities.',mode:'layout' as SceneMode}];
export function CinematicHero(){
 const reduced=useReducedMotion();const [chapter,setChapter]=useState(2),[playing,setPlaying]=useState(true),[progress,setProgress]=useState(0),[visible,setVisible]=useState(true),[loaded,setLoaded]=useState(false),[evening,setEvening]=useState(true);const host=useRef<HTMLElement>(null);const progressRef=useRef(0);
 useEffect(()=>{const o=new IntersectionObserver(([entry])=>setVisible(entry.isIntersecting),{threshold:.06});if(host.current)o.observe(host.current);return()=>o.disconnect();},[]);
 useEffect(()=>{setLoaded(false);const start=chapter===1&&!playing?.48:0;progressRef.current=start;setProgress(start);},[chapter]);
 useEffect(()=>{if(!playing||!visible||!loaded||reduced)return;const duration=chapter===1?13500:chapter===2?14000:9000;const start=performance.now()-progressRef.current*duration;const timer=setInterval(()=>{const p=Math.min(1,(performance.now()-start)/duration);progressRef.current=p;setProgress(p);if(p>=1){setChapter(c=>(c+1)%3);}},80);return()=>clearInterval(timer);},[playing,visible,loaded,chapter,reduced]);
 const choose=(n:number)=>{setPlaying(false);setChapter(n);setProgress(n===1?.48:0);};
 return <section className={styles.hero} ref={host}>
  <div className={styles.scene}><Scene mode={chapters[chapter].mode} migrationProgress={chapter===1?progress:undefined} layout="a" selectedIds={allExistingIds} lighting={evening?'evening':'day'} cinematic paused={!visible} autoFold={chapter===2&&playing} onReady={()=>setLoaded(true)} onInteract={()=>setPlaying(false)}/></div><div className={styles.fade}/>
  <div className={styles.copy}><span className={styles.openingLine}>A HOME IS MORE THAN AN ADDRESS.</span><h1>Same furniture.<br/>A whole<br/><em>new life.</em></h1><p>Your favourite sofa. The table with stories.<br/>Bring them into a home that feels like you.</p><div className={styles.actions}><Link href="/demo">Start your move <ArrowRight size={17}/></Link><a href="#the-next-chapter">See the story <ArrowDown size={15}/></a></div><span className={styles.note}>Two homes. Eighteen familiar pieces. A new beginning.</span></div>
  <div className={styles.environment}><button onClick={()=>setEvening(v=>!v)} aria-label={evening?'Switch hero to daylight':'Switch hero to evening light'}>{evening?<Moon size={13}/>:<Sun size={13}/>}<span>{evening?'THE GOLDEN HOUR':'SOFT DAYLIGHT'}</span></button><span>REAL 3D · DRAG TO EXPLORE</span></div>
  <div className={styles.storyboard}><div className={styles.chapterButtons}>{chapters.map((c,i)=><button key={c.name} className={chapter===i?styles.active:''} onClick={()=>choose(i)} aria-pressed={chapter===i}><span>0{i+1}</span><b>{c.name}</b><i><span style={{width:`${chapter===i?playing?progress*100:100:0}%`}}/></i></button>)}</div><div className={styles.playback}><span>{chapters[chapter].caption}</span><button onClick={()=>setPlaying(v=>!v)} disabled={!!reduced} aria-label={playing?'Pause home story':'Play home story'}>{playing?<Pause size={14}/>:<Play size={14}/>}</button></div></div>
 </section>;
}
