'use client';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useCallback, useEffect, useRef, useState } from 'react';
import { ArrowRight, ArrowDown, Pause, Play } from 'lucide-react';
import { useReducedMotion } from 'framer-motion';
import type { HomeSceneProps } from '@/components/studio/home-scene';
import styles from './cinematic-hero.module.css';
const Scene=dynamic<HomeSceneProps>(()=>import('@/components/studio/home-scene').then(m=>m.HomeScene),{ssr:false,loading:()=> <div className={styles.sceneLoading}>A familiar corner, coming into view…</div>});
export function CinematicHero(){
 const reduced=useReducedMotion();
 const [playing,setPlaying]=useState(true),[visible,setVisible]=useState(true);
 const host=useRef<HTMLElement>(null);
 const pause=useCallback(()=>setPlaying(false),[]);
 useEffect(()=>{const observer=new IntersectionObserver(([entry])=>setVisible(entry.isIntersecting),{threshold:.06});if(host.current)observer.observe(host.current);return()=>observer.disconnect();},[]);
 return <section className={styles.hero} ref={host} aria-label="The things that make a home">
  <div className={styles.scene}><Scene mode="vignette" lighting="evening" cinematic showcase={playing&&!reduced} paused={!visible} onInteract={pause}/></div>
  <div className={styles.fade}/>
  <div className={styles.copy}><span className={styles.openingLine}>A HOME IS MORE THAN AN ADDRESS.</span><h1>Some things<br/>are worth<br/><em>bringing along.</em></h1><p>The sofa you sink into. The table with stories.<br/>What if they could feel at home somewhere new?</p><div className={styles.actions}><Link href="/demo?step=old">Start your move <ArrowRight size={17}/></Link><a href="#the-next-chapter">Discover ReNest <ArrowDown size={15}/></a></div><span className={styles.note}>Your familiar pieces. Their next chapter.</span></div>
  <div className={styles.sceneCaption}><span>THE THINGS WE KEEP</span><p>A familiar corner.<br/>A story still unfolding.</p><button onClick={()=>setPlaying(value=>!value)} disabled={!!reduced} aria-label={playing&&!reduced?'Pause gentle camera movement':'Play gentle camera movement'} aria-pressed={playing&&!reduced}>{playing&&!reduced?<Pause size={13}/>:<Play size={13}/>}</button></div>
  <div className={styles.bottomLine}><span>DESIGNED FOR A NEW CHAPTER IN HONG KONG</span><a href="#the-next-chapter">There’s more to come <ArrowDown size={13}/></a></div>
 </section>;
}
