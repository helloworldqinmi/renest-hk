'use client';

import { useLocale } from '@/components/locale-provider';
import { LivingQuestionnaire } from './living-questionnaire';
import type { LivingBrief } from '@/lib/living-brief';
import { ArrowUpRight, Check, Feather, LayoutTemplate, MessageSquare, Sparkles } from 'lucide-react';
import { motion, useReducedMotion } from 'framer-motion';
import { habits, studioLayouts, type LayoutId } from '@/lib/studio-data';
import styles from './reimagine.module.css';

const prompts = [
 { title: 'A home that works with me', label: 'WORK & UNWIND', text: 'We both work from home. Create two workspaces, but keep a comfortable place to switch off.', habits: ['reuse', 'work'], icon: MessageSquare },
 { title: 'Make room for good company', label: 'GATHER & CONNECT', text: 'I love having friends over for dinner. Make room for four, with furniture that folds away afterwards.', habits: ['host', 'open'], icon: LayoutTemplate },
 { title: 'A fresh start, with familiar things', label: 'KEEP & REIMAGINE', text: 'Keep the furniture I love and give it a new home. Add only what makes everyday life easier.', habits: ['reuse'], icon: Feather },
];
const steps = ['Your brief, your familiar pieces', 'Moving what matters', 'Composing your space'];

export function ReimaginePanel({ brief, onBrief, note, preferences, selectedCount, generating, progress, recommendation, onNote, onPreferences, onGenerate }: {
 brief: LivingBrief; onBrief:(v:LivingBrief)=>void; note: string; preferences: string[]; selectedCount: number; generating: boolean; progress: number; recommendation: LayoutId;
 onNote: (value: string) => void; onPreferences: (value: string[]) => void; onGenerate: () => void;
}) {
 const {t,tr}=useLocale();
 const reduced = useReducedMotion();
 const current = Math.min(2, Math.floor(progress * 3));
 const layout = studioLayouts.find(item => item.id === recommendation)!;
 return <div className={styles.panel}>
  <div className={styles.identity}><span><Sparkles size={14}/>{t("RENEST DESIGN ASSISTANT")}</span><small>{t("DEMO PREVIEW")}</small></div>
  <motion.div key={generating ? 'composing' : 'brief'} initial={{opacity:0,y:reduced?0:12}} animate={{opacity:1,y:0}} transition={{duration:.45}}>
   <h2>{generating ? <>{t("A little thought.")}<br/>{t("A lot of possibility.")}</> : <>{t("Tell us about the life")}<br/>{t("you want to make room for.")}</>}</h2>
   <p className={styles.intro}>{t(generating ? 'Your everyday, your familiar pieces, a new way to bring them together.' : 'Big dinners. Quiet mornings. A space that does both. Start with a thought — we’ll help you picture it.')}</p>
  </motion.div>
  <div className={styles.context}><span><LayoutTemplate size={13}/>{t("Your new home")}<b>{t("45 m² / 484 ft²")}</b></span><span><Feather size={13}/>{t("Furniture to bring")}<b>{selectedCount} {t("pieces")}</b></span></div>
  {generating ? <div className={styles.composing}>
   <div className={styles.yourBrief}><span>{t("YOUR BRIEF")}</span><p>{note.trim() || t('Make a new home around my furniture and the things that matter to me.')}</p></div>
   <div className={styles.process} role="status" aria-live="polite" aria-atomic="true">
    {steps.map((step,index)=><div key={step} data-state={index<current?'done':index===current?'active':'waiting'}><span>{index<current?<Check size={13}/>:index+1}</span><section><b>{t(step)}</b><p>{index===0?t('Bringing your priorities together and packing your selected pieces.'):index===1?`${selectedCount} ${tr('familiar pieces on their way to your next home.','件熟悉的家具正在前往新家。','件熟悉的傢俬正在前往新居。')}`:tr('Exploring ','正在探索','正在探索')+t(layout.name)+tr(' and two alternatives.','及两个备选方案。','及兩個備選方案。')}</p></section>{index===current&&<i/>}</div>)}
   </div>
   <div className={styles.progress} role="progressbar" aria-label={t("Design preview progress")} aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(progress*100)}><i style={{width:`${progress*100}%`}}/></div>
   <div className={styles.progressCaption}><span>{t("Composing your preview")}</span><span>{Math.round(progress*100)}{t("%")}</span></div>
  </div> : <>
   <LivingQuestionnaire value={brief} onChange={onBrief}/><div className={styles.composer}>
    <label htmlFor="living-habits"><Sparkles size={15}/>{t("What would make this home yours?")}</label>
    <textarea id="living-habits" value={note} onChange={event=>onNote(event.target.value)} maxLength={360} placeholder={t("I work from home, love slow evenings, and want to keep my favourite sofa…")} rows={4} onKeyDown={event=>{if(event.key==='Enter'&&(event.metaKey||event.ctrlKey)&&!event.nativeEvent.isComposing&&selectedCount>0){event.preventDefault();onGenerate();}}}/>
    <div className={styles.composerFooter}><span>{t("A little detail goes a long way.")}</span><span>{note.length}{t("/ 360")}</span></div>
   </div>
   <div className={styles.promptHeading}><span>{t("NEED A LITTLE INSPIRATION?")}</span><small>{t("Choose a starting point")}</small></div>
   <div className={styles.prompts}>{prompts.map(prompt=><button key={t(prompt.label)} aria-pressed={note===t(prompt.text)} onClick={()=>{onNote(t(prompt.text));onPreferences(prompt.habits);}}><prompt.icon size={17} strokeWidth={1.4}/><span><small>{t(prompt.label)}</small><b>{t(prompt.title)}</b></span>{note===prompt.text?<Check size={15}/>:<ArrowUpRight size={15}/>}</button>)}</div>
   <div className={styles.priorities}><span>{t("Make these a priority")}</span><div>{habits.map(habit=><button key={habit.id} aria-pressed={preferences.includes(habit.id)} onClick={()=>onPreferences(preferences.includes(habit.id)?preferences.filter(id=>id!==habit.id):[...preferences,habit.id])}>{preferences.includes(habit.id)&&<Check size={12}/>} {t(habit.title)}</button>)}</div></div>
  </>}
  <p className={styles.disclosure}>{t("Simulated AI experience · explores three curated layouts with your selected furniture.")}</p>
 </div>;
}
