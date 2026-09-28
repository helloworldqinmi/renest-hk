'use client';
import { LocalText, useLocale } from '@/components/locale-provider';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useCallback, useEffect, useRef, useState } from 'react';
import { ArrowRight, ArrowDown, Pause, Play } from 'lucide-react';
import { useReducedMotion } from 'framer-motion';
import type { HomeSceneProps } from '@/components/studio/home-scene';
import styles from './cinematic-hero.module.css';
const Scene=dynamic<HomeSceneProps>(()=>import('@/components/studio/home-scene').then(m=>m.HomeScene),{ssr:false,loading:()=> <div className={styles.sceneLoading}><LocalText>{"A familiar corner, coming into view…"}</LocalText></div>});
export function CinematicHero(){
 const {locale,tr}=useLocale();
 const reduced=useReducedMotion();
 const [playing,setPlaying]=useState(true),[visible,setVisible]=useState(true);
 const host=useRef<HTMLElement>(null);
 const pause=useCallback(()=>setPlaying(false),[]);
 useEffect(()=>{const observer=new IntersectionObserver(([entry])=>setVisible(entry.isIntersecting),{threshold:.06});if(host.current)observer.observe(host.current);return()=>observer.disconnect();},[]);
 return <section className={styles.hero} ref={host} data-locale={locale} aria-label={tr('The things that make a home','把熟悉的生活带去新家','把熟悉的生活帶去新居')}>
  <div className={styles.scene}><Scene mode="vignette" lighting="evening" cinematic showcase={playing&&!reduced} paused={!visible} onInteract={pause}/></div>
  <div className={styles.fade}/>
  <div className={styles.copy}><span className={styles.openingLine}><LocalText>{"A HOME IS MORE THAN AN ADDRESS."}</LocalText></span>{locale==='en'?<><h1><LocalText>{"Some things"}</LocalText><br/><LocalText>{"are worth"}</LocalText><br/><em><LocalText>{"bringing along."}</LocalText></em></h1><p><LocalText>{"The sofa you sink into. The table with stories."}</LocalText><br/><LocalText>{"What if they could feel at home somewhere new?"}</LocalText></p></>:<><h1 className={styles.chineseTitle}><span>{tr('','换个家，','搬個新居，')}</span><span>{tr('','把喜欢的生活','把喜歡的生活')}</span><em>{tr('','一起带上。','一起帶上。')}</em></h1><p>{tr('','那张坐惯的沙发，那张一起吃饭的餐桌。','坐慣的梳化，一家人吃飯的餐枱。')}<br/>{tr('','换一个地址，熟悉的日常也能继续。','換個新地址，把家的感覺留下。')}</p></>}<div className={styles.actions}><Link href="/demo?step=old"><LocalText>{"Start your move "}</LocalText><ArrowRight size={17}/></Link><a href="#the-next-chapter"><LocalText>{"Discover ReNest "}</LocalText><ArrowDown size={15}/></a></div><span className={styles.note}><LocalText>{"Your familiar pieces. Their next chapter."}</LocalText></span></div>
  <div className={styles.sceneCaption}><span><LocalText>{"THE THINGS WE KEEP"}</LocalText></span><p><LocalText>{"A familiar corner."}</LocalText><br/><LocalText>{"A story still unfolding."}</LocalText></p><button onClick={()=>setPlaying(value=>!value)} disabled={!!reduced} aria-label={playing&&!reduced?'Pause gentle camera movement':'Play gentle camera movement'} aria-pressed={playing&&!reduced}>{playing&&!reduced?<Pause size={13}/>:<Play size={13}/>}</button></div>
  <div className={styles.bottomLine}><span><LocalText>{"DESIGNED FOR A NEW CHAPTER IN HONG KONG"}</LocalText></span><a href="#the-next-chapter"><LocalText>{"There’s more to come "}</LocalText><ArrowDown size={13}/></a></div>
 </section>;
}
