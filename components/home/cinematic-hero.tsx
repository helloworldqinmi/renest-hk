'use client';
import { LocalText, useLocale } from '@/components/locale-provider';
import dynamic from 'next/dynamic';
import Link from '@/components/common/motion-link';
import { useCallback, useEffect, useRef, useState } from 'react';
import { ArrowRight, ArrowDown, Pause, Play } from 'lucide-react';
import { useReducedMotion } from '@/lib/use-reduced-motion';
import type { HomeSceneProps } from '@/components/studio/home-scene';
import styles from './cinematic-hero.module.css';
import {readPlanHistory,STUDIO_SESSION_KEY,type SavedStudioPlan} from '@/lib/studio-data';
const Scene=dynamic<HomeSceneProps>(()=>import('@/components/studio/home-scene').then(m=>m.HomeScene),{ssr:false,loading:()=> <div className={styles.sceneLoading}><LocalText>{"A familiar corner, coming into view…"}</LocalText></div>});
export function CinematicHero(){
 const {locale,tr}=useLocale();
 const reduced=useReducedMotion();
 const [playing,setPlaying]=useState(true),[visible,setVisible]=useState(true);
 const [lastPlan,setLastPlan]=useState<SavedStudioPlan|null>(null);
 useEffect(()=>{setLastPlan(readPlanHistory()[0]??null);},[]);
 const host=useRef<HTMLElement>(null);
 const pause=useCallback(()=>setPlaying(false),[]);
 useEffect(()=>{const observer=new IntersectionObserver(([entry])=>setVisible(entry.isIntersecting),{threshold:.06});if(host.current)observer.observe(host.current);return()=>observer.disconnect();},[]);
 return <section className={styles.hero} ref={host} data-locale={locale} aria-label={tr('The things that make a home','把熟悉的生活带去新家','把熟悉的生活帶去新居')}>
  <div className={styles.scene}><Scene mode="vignette" lighting="evening" cinematic showcase={playing&&!reduced} paused={!visible} onInteract={pause}/></div>
  <div className={styles.fade}/>
  <div className={styles.copy}><span className={styles.openingLine}><LocalText>{"A HOME IS MORE THAN AN ADDRESS."}</LocalText></span>{locale==='en'?<><h1><LocalText>{"Some things"}</LocalText><br/><LocalText>{"are worth"}</LocalText><br/><em><LocalText>{"bringing along."}</LocalText></em></h1><p>Before you move, see what fits, where it goes,<br/>and what you still need to buy.</p></>:<><h1 className={styles.chineseTitle}><span>{tr('','换个家，','搬個新居，')}</span><span>{tr('','把喜欢的生活','把喜歡的生活')}</span><em>{tr('','一起带上。','一起帶上。')}</em></h1><p>{tr('','搬家前，知道旧家具放不放得下、怎么摆，','搬屋前，知道舊傢俬放不放得下、怎樣擺，')}<br/>{tr('','还需要买什么、花多少钱。','還需要買甚麼、花多少錢。')}</p></>}<div className={styles.actions}><Link href="/demo?step=old">{tr("Start my move","开始我的搬家","開始我的搬屋")}<ArrowRight size={17}/></Link><a href="#the-next-chapter"><LocalText>{"Discover ReNest "}</LocalText><ArrowDown size={15}/></a></div><div className={styles.benefits}><span>{tr('Reuse your furniture','旧家具复用','舊傢俬重用')}</span><span>{tr('Compare layouts','新家布局比较','新居佈局比較')}</span><span>{tr('Plan purchases','采购预算','採購預算')}</span></div>{lastPlan&&<Link className={styles.resume} href="/demo" onClick={()=>{try{sessionStorage.setItem(STUDIO_SESSION_KEY,JSON.stringify({...lastPlan,phase:'results'}));}catch{}}}>{tr('Continue my saved arrangement','继续已保存的方案','繼續已儲存的方案')}<ArrowRight size={14}/></Link>}<span className={styles.note}>{tr('An interactive example. No sign-up or room scan needed.','互动示例，无需注册或扫描房间。','互動示範，無需註冊或掃描房間。')}</span></div>
  <div className={styles.sceneCaption}><span><LocalText>{"THE THINGS WE KEEP"}</LocalText></span><p><LocalText>{"A familiar corner."}</LocalText><br/><LocalText>{"A story still unfolding."}</LocalText></p><button onClick={()=>setPlaying(value=>!value)} disabled={!!reduced} aria-label={playing&&!reduced?'Pause gentle camera movement':'Play gentle camera movement'} aria-pressed={playing&&!reduced}>{playing&&!reduced?<Pause size={13}/>:<Play size={13}/>}</button></div>
  <div className={styles.bottomLine}><span><LocalText>{"DESIGNED FOR A NEW CHAPTER IN HONG KONG"}</LocalText></span><a href="#the-next-chapter"><LocalText>{"There’s more to come "}</LocalText><ArrowDown size={13}/></a></div>
 </section>;
}
