'use client';

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

export function ReimaginePanel({ note, preferences, selectedCount, generating, progress, recommendation, onNote, onPreferences, onGenerate }: {
 note: string; preferences: string[]; selectedCount: number; generating: boolean; progress: number; recommendation: LayoutId;
 onNote: (value: string) => void; onPreferences: (value: string[]) => void; onGenerate: () => void;
}) {
 const reduced = useReducedMotion();
 const current = Math.min(2, Math.floor(progress * 3));
 const layout = studioLayouts.find(item => item.id === recommendation)!;
 return <div className={styles.panel}>
  <div className={styles.identity}><span><Sparkles size={14}/> RENEST DESIGN ASSISTANT</span><small>DEMO PREVIEW</small></div>
  <motion.div key={generating ? 'composing' : 'brief'} initial={{opacity:0,y:reduced?0:12}} animate={{opacity:1,y:0}} transition={{duration:.45}}>
   <h2>{generating ? <>A little thought.<br/>A lot of possibility.</> : <>Tell us about the life<br/>you want to make room for.</>}</h2>
   <p className={styles.intro}>{generating ? 'Your everyday, your familiar pieces, a new way to bring them together.' : 'Big dinners. Quiet mornings. A space that does both. Start with a thought — we’ll help you picture it.'}</p>
  </motion.div>
  <div className={styles.context}><span><LayoutTemplate size={13}/> Your new home <b>45 m²</b></span><span><Feather size={13}/> Furniture to bring <b>{selectedCount} pieces</b></span></div>
  {generating ? <div className={styles.composing}>
   <div className={styles.yourBrief}><span>YOUR BRIEF</span><p>{note.trim() || 'Make a new home around my furniture and the things that matter to me.'}</p></div>
   <div className={styles.process} role="status" aria-live="polite" aria-atomic="true">
    {steps.map((step,index)=><div key={step} data-state={index<current?'done':index===current?'active':'waiting'}><span>{index<current?<Check size={13}/>:index+1}</span><section><b>{step}</b><p>{index===0?'Bringing your priorities together and packing your selected pieces.':index===1?`${selectedCount} familiar pieces on their way to your next home.`:`Exploring ${layout.name.toLowerCase()} and two alternatives.`}</p></section>{index===current&&<i/>}</div>)}
   </div>
   <div className={styles.progress} role="progressbar" aria-label="Design preview progress" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(progress*100)}><i style={{width:`${progress*100}%`}}/></div>
   <div className={styles.progressCaption}><span>Composing your preview</span><span>{Math.round(progress*100)}%</span></div>
  </div> : <>
   <div className={styles.composer}>
    <label htmlFor="living-habits"><Sparkles size={15}/> What would make this home yours?</label>
    <textarea id="living-habits" value={note} onChange={event=>onNote(event.target.value)} maxLength={360} placeholder="I work from home, love slow evenings, and want to keep my favourite sofa…" rows={4} onKeyDown={event=>{if(event.key==='Enter'&&(event.metaKey||event.ctrlKey)&&!event.nativeEvent.isComposing&&selectedCount>0){event.preventDefault();onGenerate();}}}/>
    <div className={styles.composerFooter}><span>A little detail goes a long way.</span><span>{note.length} / 360</span></div>
   </div>
   <div className={styles.promptHeading}><span>NEED A LITTLE INSPIRATION?</span><small>Choose a starting point</small></div>
   <div className={styles.prompts}>{prompts.map(prompt=><button key={prompt.label} aria-pressed={note===prompt.text} onClick={()=>{onNote(prompt.text);onPreferences(prompt.habits);}}><prompt.icon size={17} strokeWidth={1.4}/><span><small>{prompt.label}</small><b>{prompt.title}</b></span>{note===prompt.text?<Check size={15}/>:<ArrowUpRight size={15}/>}</button>)}</div>
   <div className={styles.priorities}><span>Make these a priority</span><div>{habits.map(habit=><button key={habit.id} aria-pressed={preferences.includes(habit.id)} onClick={()=>onPreferences(preferences.includes(habit.id)?preferences.filter(id=>id!==habit.id):[...preferences,habit.id])}>{preferences.includes(habit.id)&&<Check size={12}/>} {habit.title}</button>)}</div></div>
  </>}
  <p className={styles.disclosure}>Simulated AI experience · explores three curated layouts with your selected furniture.</p>
 </div>;
}
