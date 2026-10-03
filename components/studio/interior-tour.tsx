'use client';

import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import dynamic from 'next/dynamic';
import { ArrowLeft, ArrowRight, Check, House, Leaf, Moon, Pause, Play, RotateCcw, Sun, X } from 'lucide-react';
import { useLocale } from '@/components/locale-provider';
import { useReducedMotion } from '@/lib/use-reduced-motion';
import { buildInteriorTour, ROOM_DURATION, tourFrame } from '@/lib/interior-tour';
import type { Placement } from '@/lib/studio-data';
import { BrandLogo } from '@/components/common/brand-logo';
import styles from './interior-tour.module.css';

const Scene = dynamic(() => import('./interior-scene').then(m => m.InteriorScene), { ssr: false });
const ENDING_DURATION = 5;
export type TourImpact = { reused: number; selected: number; newCount: number; newCost: number; availableForResale: number; layout: string };

export function InteriorTour({ placements, impact, onClose }: { placements: Placement[]; impact: TourImpact; onClose: () => void }) {
  const { tr } = useLocale(), reduced = useReducedMotion();
  // Freeze this viewing session to the exact arrangement the user opened.
  const [plan] = useState(() => placements.map(p => ({ ...p })));
  const shots = useMemo(() => buildInteriorTour(plan), [plan]);
  const clock = useRef(0), lastAnnounced = useRef(-1);
  const [time, setTime] = useState(0), [playing, setPlaying] = useState(false), [ready, setReady] = useState(false), [failed, setFailed] = useState(false), [attempt, setAttempt] = useState(0);
  const [lighting, setLighting] = useState<'day' | 'evening'>('day');
  const filmLength = shots.length * ROOM_DURATION, duration = filmLength + ENDING_DURATION;
  const ending = time >= filmLength, ended = time >= duration;
  const { index, progress } = tourFrame(time, shots.length);
  const shot = shots[index];
  const onReady = useCallback(() => { setReady(true); setPlaying(!reduced); }, [reduced]);
  const onPause = useCallback(() => setPlaying(false), []);
  const onError = useCallback(() => { setFailed(true); setPlaying(false); }, []);
  useEffect(() => { if (reduced) setPlaying(false); }, [reduced]);
  useEffect(() => {
    if (!playing || !ready) return;
    let frame = 0, previous = performance.now();
    const tick = (now: number) => {
      const delta = Math.min(.1, (now - previous) / 1000); previous = now;
      if (!document.hidden) clock.current = Math.min(duration, clock.current + delta);
      const rounded = Math.floor(clock.current * 10);
      if (rounded !== lastAnnounced.current || clock.current === duration) { lastAnnounced.current = rounded; setTime(clock.current); }
      if (clock.current >= duration) { setPlaying(false); return; }
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [playing, ready, duration]);
  function seek(value: number) { clock.current = Math.max(0, Math.min(duration, value)); setTime(clock.current); }
  function toggle() { if (ended) seek(0); setPlaying(value => !value); }
  function jump(room: number) { seek(Math.max(0, Math.min(shots.length, room)) * ROOM_DURATION + (room < shots.length ? .4 : 0)); }
  const fade = reduced || !playing || ending ? 0 : progress < .045 ? 1 - progress / .045 : progress > .955 ? (progress - .955) / .045 : 0;
  const reusedPercent = Math.round(impact.reused / Math.max(1, impact.selected) * 100);
  const stories = [
    { eyebrow: tr('WHAT CAME WITH YOU', '把喜欢的留下', '把喜歡的留下'), title: tr('Familiar things. A fresh start.', '熟悉的家具，新的开始。', '熟悉的傢俬，新的開始。'), value: String(impact.reused), unit: tr('existing pieces in your moving plan', '件旧家具纳入搬家方案', '件舊傢俬納入搬屋方案'), detail: tr(`${reusedPercent}% of your selected furniture is retained in this plan.`, `你选中的家具，有 ${reusedPercent}% 保留在当前方案中。`, `你選中的傢俬，有 ${reusedPercent}% 保留在目前方案中。`) },
    { eyebrow: tr('JUST ENOUGH, JUST RIGHT', '添置刚刚好的', '添置剛剛好的'), title: tr('Make room. Add thoughtfully.', '添一点，让生活更合适。', '添一點，讓生活更合適。'), value: String(impact.newCount), unit: tr('new additions in this arrangement', '件添置家具纳入当前方案', '件添置傢俬納入目前方案'), detail: tr('Chosen alongside the pieces you already own.', '围绕已有家具，补齐生活所需。', '圍繞已有傢俬，補齊生活所需。') },
    { eyebrow: tr('A CLEARER PICTURE', '花费，心里有数', '花費，心裡有數'), title: tr('Your next chapter, considered.', '为新生活，做好打算。', '為新生活，做好打算。'), value: impact.newCost.toLocaleString('en-HK'), unit: tr('HKD · estimated furniture purchases', '港币 · 预计家具采购金额', '港幣 · 預計傢俬採購金額'), detail: tr('Demo catalogue prices; delivery and assembly are excluded.', '按示例目录价格计算，不含运输和安装。', '按範例目錄價格計算，不含運輸和安裝。') },
    { eyebrow: tr('THE NEXT CHAPTER', '让好物继续', '讓好物繼續'), title: impact.availableForResale ? tr('A new home for every story.', '这段故事，也可以继续。', '這段故事，也可以繼續。') : tr('Nothing familiar left behind.', '熟悉的，都一起带来了。', '熟悉的，都一起帶來了。'), value: String(impact.availableForResale || impact.reused), unit: impact.availableForResale ? tr('pieces to consider passing on', '件未搬入家具，可考虑转让', '件未搬入傢俬，可考慮轉讓') : tr('existing pieces kept in use', '件旧家具继续使用', '件舊傢俬繼續使用'), detail: impact.availableForResale ? tr('Review the resale list when you return to your plan.', '返回方案后，可查看待转让家具清单。', '返回方案後，可查看待轉讓傢俬清單。') : tr('The things you love are part of what comes next.', '下一段生活里，仍然有你喜欢的它们。', '下一段生活裡，仍然有你喜歡的它們。') },
  ];
  const story = stories[index % stories.length];
  const timestamp = (n: number) => `0:${Math.floor(n).toString().padStart(2, '0')}`;

  return <Dialog.Root open onOpenChange={open => { if (!open) onClose(); }}>
    <Dialog.Portal>
      <Dialog.Overlay className={styles.backdrop} />
      <Dialog.Content className={styles.player} aria-describedby="interior-tour-description" data-testid="interior-tour" data-playing={playing} data-ending={ending}>
        <header className={styles.header}>
          <div className={styles.wordmark}><BrandLogo compact /></div>
          <div className={styles.filmTitle}><span>{tr('YOUR NEXT CHAPTER', '你的下一段生活', '你的下一段生活')}</span><Dialog.Title>{tr('A home, from the inside.', '走进你的新家。', '走進你的新居。')}</Dialog.Title></div>
          <Dialog.Close className={styles.close} aria-label={tr('Return to my impact', '返回搬家成果', '返回搬屋成果')}><X size={20} /></Dialog.Close>
        </header>
        <div className={styles.experience}>
          <div className={styles.screen}>
            {!failed && shots.length > 0 && <Scene key={attempt} placements={plan} shots={shots} clock={clock} lighting={lighting} reduced={reduced} onReady={onReady} onPause={onPause} onError={onError} label={tr('First-person tour of your current arrangement. Drag to look around.', '当前布局的第一人称看房画面，拖动可以环顾。', '目前佈局的第一人稱睇樓畫面，拖動可以環顧。')} />}
            <div className={styles.vignette} />
            {!ready && !failed && shots.length > 0 && <div className={styles.loading} role="status"><House size={30} strokeWidth={1} /><span>{tr('Opening the door…', '正在为你打开新家的门……', '正在為你打開新居的門……')}</span></div>}
            {(failed || !shots.length) && <div className={styles.loading} role="alert"><House size={30} strokeWidth={1} /><span>{shots.length ? tr('This room could not load.', '房间暂时未能加载。', '房間暫時未能載入。') : tr('Leave some clear floor space to begin a room tour.', '请先在房间里留出可站立的空间，再开始看房。', '請先在房間裡留出可站立的空間，再開始睇樓。')}</span>{shots.length > 0 && <button onClick={() => { setFailed(false); setReady(false); setAttempt(value => value + 1); }}>{tr('Try again', '重新加载', '重新載入')}</button>}<button onClick={onClose}>{tr('Back to my plan', '返回方案', '返回方案')}</button></div>}
            {ready && !ending && <div className={styles.roomCaption} key={shot.id}><span>{String(index + 1).padStart(2, '0')} / {String(shots.length).padStart(2, '0')}</span><h2>{tr(...shot.title)}</h2><p>{tr(...shot.detail)}</p></div>}
            <div className={styles.cut} style={{ opacity: fade }} />
            {ready && ending && <div className={styles.ending}><Leaf size={31} strokeWidth={1} /><span>{tr('A LITTLE LESS STARTING OVER', '熟悉的生活，继续发生', '熟悉的生活，繼續發生')}</span><h2>{tr('Thank you for', '感谢使用', '感謝使用')}<br /><em>{tr('choosing ReNest.', 'ReNest。', 'ReNest。')}</em></h2><p>{tr('May the things you love feel at home again.', '愿你喜欢的人和物，都能在新家自在安放。', '願你喜歡的人和物，都能在新居自在安放。')}</p><div><button onClick={() => { seek(0); setPlaying(true); }}><RotateCcw size={15} />{tr('Watch again', '再看一次', '再看一次')}</button><button onClick={onClose}>{tr('Back to my impact', '返回搬家成果', '返回搬屋成果')}<ArrowRight size={15} /></button></div></div>}
          </div>
          <aside className={styles.impact} aria-label={tr('Your moving impact', '你的搬家成果', '你的搬屋成果')}>
            <div className={styles.impactLabel}><Leaf size={15} /><span>{tr('YOUR MOVE, WITH MEANING', '这次搬家，留下了什么', '這次搬屋，留下了甚麼')}</span></div>
            {ending ? <div className={styles.finalImpact}><span>{tr('YOUR NEXT HOME', '新家的这一页', '新居的這一頁')}</span><h2>{tr('Move what matters.', '把重要的，带去下一站。', '把重要的，帶去下一站。')}</h2><dl><div><dt>{tr('Existing pieces reused', '旧家具复用', '舊傢俬重用')}</dt><dd>{impact.reused}</dd></div><div><dt>{tr('New additions', '家具添置', '傢俬添置')}</dt><dd>{impact.newCount}</dd></div><div><dt>{tr('Estimated purchases', '预计采购', '預計採購')}</dt><dd>HK${impact.newCost.toLocaleString('en-HK')}</dd></div></dl><p><Check size={15} />{tr('Your arrangement is ready to return to.', '返回后，还能继续调整你的方案。', '返回後，還能繼續調整你的方案。')}</p></div> : <div className={styles.story} key={index}><span>{story.eyebrow}</span><h2>{story.title}</h2><div className={styles.number}>{story.value}</div><strong>{story.unit}</strong><p>{story.detail}</p><div className={styles.pieces} aria-hidden>{Array.from({ length: 18 }, (_, i) => <i key={i} data-kept={i < impact.reused} />)}</div></div>}
            <div className={styles.impactFoot}><span>{tr('YOUR ARRANGEMENT', '当前布局', '目前佈局')} {impact.layout}</span><span>ReNest</span></div>
          </aside>
        </div>
        <footer className={styles.controls}>
          <nav className={styles.chapters} aria-label={tr('Tour chapters', '看房章节', '睇樓章節')}>{shots.map((room, i) => <button key={room.id} disabled={!ready || failed} aria-current={!ending && index === i ? 'step' : undefined} onClick={() => jump(i)} style={{ '--chapter-progress': `${Math.max(0, Math.min(1, (time - i * ROOM_DURATION) / ROOM_DURATION)) * 100}%` } as CSSProperties}><span>{String(i + 1).padStart(2, '0')}</span><b>{tr(...room.title)}</b></button>)}<button disabled={!ready || failed} onClick={() => jump(shots.length)} aria-current={ending ? 'step' : undefined} style={{ '--chapter-progress': `${ending ? 100 : 0}%` } as CSSProperties}><span><Leaf size={12} /></span><b>{tr('Thank you', '感谢相伴', '感謝相伴')}</b></button></nav>
          <div className={styles.transport}><button onClick={() => jump(ending ? shots.length - 1 : index - 1)} disabled={!ready || failed || index === 0} aria-label={tr('Previous room', '上一个房间', '上一個房間')}><ArrowLeft size={17} /></button><button className={styles.play} onClick={toggle} disabled={!ready || failed} aria-label={ended ? tr('Replay tour', '重播看房', '重播睇樓') : playing ? tr('Pause film', '暂停播放', '暫停播放') : tr('Play film', '开始播放', '開始播放')}>{ended ? <RotateCcw size={18} /> : playing ? <Pause size={18} /> : <Play size={18} />}</button><button onClick={() => jump(index + 1)} disabled={!ready || failed || ending} aria-label={tr('Next room', '下一个房间', '下一個房間')}><ArrowRight size={17} /></button><span className={styles.time}>{timestamp(time)} / {timestamp(duration)}</span><input className={styles.timeline} type="range" min={0} max={duration} step={.1} value={time} disabled={!ready || failed} aria-label={tr('Film progress', '播放进度', '播放進度')} onChange={event => seek(Number(event.target.value))} /><button className={styles.light} onClick={() => setLighting(value => value === 'day' ? 'evening' : 'day')} aria-label={lighting === 'day' ? tr('Switch tour to evening', '切换夜晚光线', '切換夜晚光線') : tr('Switch tour to daylight', '切换日间光线', '切換日間光線')}>{lighting === 'day' ? <Sun size={16} /> : <Moon size={16} />}<span>{lighting === 'day' ? tr('Daylight', '日光', '日光') : tr('Evening', '夜晚', '夜晚')}</span></button></div>
          <p id="interior-tour-description" className={styles.hint}>{tr('Your current arrangement · drag the view to pause and look around.', '当前布置的室内视角 · 拖动画面可暂停并环顾房间。', '目前佈置的室內視角 · 拖動畫面可暫停並環顧房間。')}</p>
        </footer>
      </Dialog.Content>
    </Dialog.Portal>
  </Dialog.Root>;
}
