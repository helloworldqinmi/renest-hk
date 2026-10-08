'use client';

import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import dynamic from 'next/dynamic';
import { ArrowLeft, ArrowRight, Box, Check, House, Image as ImageIcon, Moon, Pause, Play, RotateCcw, Sun, X } from 'lucide-react';
import { useLocale } from '@/components/locale-provider';
import { useReducedMotion } from '@/lib/use-reduced-motion';
import { buildInteriorTour, ROOM_DURATION, tourFrame } from '@/lib/interior-tour';
import { ENTRY_DURATION } from '@/lib/spatial-experience';
import { interiorPlanKey, type InteriorRenderManifest } from '@/lib/interior-render';
import type { Placement } from '@/lib/studio-data';
import { BrandLogo } from '@/components/common/brand-logo';
import styles from './interior-tour.module.css';

const Scene = dynamic(() => import('./interior-scene').then(m => m.InteriorScene), { ssr: false });
const ENDING_DURATION = 4;
export type TourImpact = { reused: number; selected: number; newCount: number; newCost: number; availableForResale: number; layout: string };

export function InteriorTour({ placements, impact, onClose }: { placements: Placement[]; impact: TourImpact; onClose: () => void }) {
  const { tr } = useLocale(), reduced = useReducedMotion();
  const [plan] = useState(() => placements.map(p => ({ ...p })));
  const shots = useMemo(() => buildInteriorTour(plan), [plan]);
  const clock = useRef(0), started = useRef(false), lastAnnounced = useRef(-1);
  const [time, setTime] = useState(0), [playing, setPlaying] = useState(false), [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false), [attempt, setAttempt] = useState(0), [structure, setStructure] = useState(false);
  const [lighting, setLighting] = useState<'day' | 'evening'>('day');
  const [rendered, setRendered] = useState<InteriorRenderManifest[number] | null>(null), [photographic, setPhotographic] = useState(false), [loadedImage, setLoadedImage] = useState('');
  const filmLength = ENTRY_DURATION + shots.length * ROOM_DURATION, duration = filmLength + ENDING_DURATION;
  const entering = time < ENTRY_DURATION, ending = time >= filmLength, ended = time >= duration;
  const { index, progress } = tourFrame(Math.max(0, time - ENTRY_DURATION), shots.length);
  const shot = shots[index], renderedImage = rendered?.frames[shot?.id]?.[lighting];
  const showImage = !!renderedImage && loadedImage === renderedImage && (photographic || failed) && !entering;
  useEffect(() => {
    const controller = new AbortController();
    fetch('/films/interior/manifest.json', { signal: controller.signal }).then(r => r.ok ? r.json() : []).then((manifest: InteriorRenderManifest) => {
      setRendered(manifest.find(item => item.key === interiorPlanKey(plan)) ?? null);
    }).catch(() => {});
    return () => controller.abort();
  }, [plan]);
  const onReady = useCallback(() => {
    setReady(true);
    if (!started.current) { started.current = true; if (reduced) { clock.current = ENTRY_DURATION; setTime(ENTRY_DURATION); } else setPlaying(true); }
  }, [reduced]);
  const onPause = useCallback(() => setPlaying(false), []);
  const onError = useCallback(() => { setFailed(true); setPlaying(false); clock.current = Math.max(ENTRY_DURATION, clock.current); setTime(clock.current); }, []);
  useEffect(() => { if (reduced) { setPlaying(false); if (clock.current < ENTRY_DURATION) { clock.current = ENTRY_DURATION; setTime(ENTRY_DURATION); } } }, [reduced]);
  useEffect(() => {
    if (!playing || !ready) return;
    let frame = 0, previous = performance.now();
    const tick = (now: number) => {
      const delta = Math.min(.075, (now - previous) / 1000); previous = now;
      if (!document.hidden) clock.current = Math.min(duration, clock.current + delta);
      const rounded = Math.floor(clock.current * 12);
      if (rounded !== lastAnnounced.current || clock.current === duration) { lastAnnounced.current = rounded; setTime(clock.current); }
      if (clock.current >= duration) { setPlaying(false); return; }
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [playing, ready, duration]);
  function seek(value: number) { clock.current = Math.max(reduced ? ENTRY_DURATION : 0, Math.min(duration, value)); setTime(clock.current); }
  function jump(room: number) { seek(ENTRY_DURATION + Math.max(0, Math.min(shots.length, room)) * ROOM_DURATION); }
  function toggle() { if (ended) seek(0); setPlaying(v => !v); }
  const unavailable = failed && !rendered;
  const fade = !playing || reduced || entering || ending ? 0 : .65 * Math.max(index > 0 && progress < .055 ? 1 - progress / .055 : 0, progress > .965 ? (progress - .965) / .035 : 0);
  const timestamp = (n: number) => `${Math.floor(n / 60)}:${Math.floor(n % 60).toString().padStart(2, '0')}`;
  return <Dialog.Root open onOpenChange={open => { if (!open) onClose(); }}><Dialog.Portal>
    <Dialog.Overlay className={styles.backdrop} />
    <Dialog.Content className={styles.player} aria-describedby="interior-tour-description" data-testid="interior-tour" data-playing={playing} data-ending={ending} onKeyDown={event => {
      if (!ready || unavailable || event.target instanceof HTMLInputElement || event.target instanceof HTMLButtonElement) return;
      if (event.key === ' ') { event.preventDefault(); toggle(); }
      if (event.key === 'ArrowRight') { event.preventDefault(); jump(index + 1); }
      if (event.key === 'ArrowLeft') { event.preventDefault(); jump(index - 1); }
    }}>
      <header className={styles.header}>
        <div className={styles.wordmark}><BrandLogo compact /></div>
        <div className={styles.filmTitle}><span>{tr('THE SPATIAL EXPERIENCE', '空间沉浸体验', '空間沉浸體驗')}</span><Dialog.Title>{tr('Step into your next chapter.', '走进下一段生活。', '走進下一段生活。')}</Dialog.Title></div>
        <span className={styles.layoutLabel}>{tr('ARRANGEMENT', '布局', '佈局')} {impact.layout}</span>
        <Dialog.Close className={styles.close} aria-label={tr('Return to my impact', '返回搬家成果', '返回搬屋成果')}><X size={20} /></Dialog.Close>
      </header>
      <div className={styles.screen}>
        {!failed && shots.length > 0 && <Scene key={attempt} placements={plan} shots={shots} clock={clock} lighting={lighting} reduced={reduced} structure={structure} paused={showImage || ended} onReady={onReady} onPause={onPause} onError={onError} label={tr('Your furnished home. Drag to look around.', '你的新家，拖动画面可以环顾房间。', '你的新居，拖動畫面可以環顧房間。')} />}
        {renderedImage && (photographic || failed) && <div className={styles.renderedFrame} data-visible={showImage} aria-hidden={!showImage}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img key={renderedImage} src={renderedImage} alt={tr('Architectural render of your arrangement', '当前布局的建筑效果图', '目前佈局的建築效果圖')} onLoad={() => { setLoadedImage(renderedImage); if (failed) onReady(); }} onError={() => { setRendered(null); setPhotographic(false); }} />
        </div>}
        <div className={styles.vignette} />
        {ready && !ending && <div className={styles.sceneTools}>
          <span className={styles.sceneStatus}><i />{entering ? tr('PLAN → PRESENCE', '从蓝图到生活', '從藍圖到生活') : structure ? tr('SPATIAL STRUCTURE', '空间结构', '空間結構') : showImage ? tr('ARCHITECTURAL STILL', '建筑静帧', '建築靜幀') : tr('LIVE SPACE', '实时空间', '即時空間')}</span>
          <div><button disabled={entering || failed} aria-label={tr('Structure', '结构', '結構')} aria-pressed={structure} onClick={() => { setStructure(v => !v); setPhotographic(false); }}><Box size={15} /><span>{tr('Structure', '结构', '結構')}</span></button>
          {rendered && <button disabled={entering} aria-label={photographic ? tr('Live view', '实时视图', '即時視圖') : tr('Photo view', '摄影视图', '攝影视圖')} aria-pressed={photographic} onClick={() => { setPhotographic(v => !v); setStructure(false); setPlaying(false); }}><ImageIcon size={15} /><span>{photographic ? tr('Live view', '实时视图', '即時視圖') : tr('Photo view', '摄影视图', '攝影视圖')}</span></button>}</div>
        </div>}
        {ready && entering && <div className={styles.opening} style={{ opacity: reduced ? 0 : Math.min(1, time / .45, Math.max(0, (ENTRY_DURATION - time - .55) / .8)) }}>
          <span>{tr('YOUR PLAN. A NEW PERSPECTIVE.', '你的方案，全新视角。', '你的方案，全新視角。')}</span><h2>{tr('From a plan', '从一张蓝图', '從一張藍圖')}<br /><em>{tr('to a place.', '到一个家。', '到一個家。')}</em></h2>
          <div className={styles.entryProgress}><i style={{ transform: `scaleX(${Math.min(1, time / ENTRY_DURATION)})` }} /></div>
        </div>}
        {!ready && !unavailable && shots.length > 0 && <div className={styles.loading} role="status"><div className={styles.loadingMark}><House size={28} strokeWidth={1} /></div><span>{tr('Preparing your new perspective…', '正在准备你的新视角…', '正在準備你的新視角…')}</span></div>}
        {(unavailable || !shots.length) && <div className={styles.loading} role="alert"><House size={30} strokeWidth={1} /><span>{shots.length ? tr('This room could not load.', '房间暂时未能加载。', '房間暫時未能載入。') : tr('Leave some clear floor space to begin a room tour.', '请在房间里留出一些空间，再开始看房。', '請在房間裡留出一些空間，再開始睇樓。')}</span>{shots.length > 0 && <button onClick={() => { setFailed(false); setReady(false); started.current = false; setAttempt(v => v + 1); }}>{tr('Try again', '重新加载', '重新載入')}</button>}<button onClick={onClose}>{tr('Back to my plan', '返回方案', '返回方案')}</button></div>}
        {ready && !entering && !ending && <div className={styles.roomCaption} key={shot.id}><span>{String(index + 1).padStart(2, '0')}<i />{String(shots.length).padStart(2, '0')}</span><div><h2>{tr(...shot.title)}</h2><p>{tr(...shot.detail)}</p></div><span className={styles.lookHint}>{tr('Drag to look around', '拖动环顾房间', '拖動環顧房間')}</span></div>}
        <div className={styles.cut} style={{ opacity: fade }} />
        {ready && ending && <div className={styles.ending}>
          <span>{tr('YOUR NEXT CHAPTER, READY.', '下一段生活，准备好了。', '下一段生活，準備好了。')}</span>
          <h2>{tr('Thank you for', '感谢选择', '感謝選擇')}<br /><em>{tr('choosing ReNest.', 'ReNest。', 'ReNest。')}</em></h2>
          <div className={styles.finalImpact}><div><strong>{impact.reused}</strong><span>{tr('pieces coming with you', '件旧家具一起出发', '件舊傢俬一起出發')}</span></div><div><strong>{impact.newCount}</strong><span>{tr('thoughtful additions', '件恰好的添置', '件恰好的添置')}</span></div><div><strong><small>HK$</small>{impact.newCost.toLocaleString('en-HK')}</strong><span>{tr('estimated purchases', '预计家具采购', '預計傢俬採購')}</span></div></div>
          <p><Check size={14} />{tr('Your furniture. Your arrangement. Your next address.', '你的家具，你的布局，你的下一个家。', '你的傢俬，你的佈局，你的下一個家。')}</p>
          <div className={styles.endingActions}><button onClick={() => { seek(0); setPlaying(true); }}><RotateCcw size={15} />{tr('Experience again', '再次体验', '再次體驗')}</button><button onClick={onClose}>{tr('Back to my plan', '返回我的方案', '返回我的方案')}<ArrowRight size={15} /></button></div>
        </div>}
      </div>
      <footer className={styles.controls}>
        <nav className={styles.chapters} aria-label={tr('Tour chapters', '看房章节', '睇樓章節')}>
          <button disabled={!ready || unavailable || reduced} aria-current={entering ? 'step' : undefined} onClick={() => seek(0)} style={{ '--chapter-progress': `${Math.min(1, time / ENTRY_DURATION) * 100}%` } as CSSProperties}><span>00</span><b>{tr('The reveal', '空间揭幕', '空間揭幕')}</b></button>
          {shots.map((room, i) => <button key={room.id} disabled={!ready || unavailable} aria-current={!entering && !ending && index === i ? 'step' : undefined} onClick={() => jump(i)} style={{ '--chapter-progress': `${Math.max(0, Math.min(1, (time - ENTRY_DURATION - i * ROOM_DURATION) / ROOM_DURATION)) * 100}%` } as CSSProperties}><span>{String(i + 1).padStart(2, '0')}</span><b>{tr(...room.title)}</b></button>)}
        </nav>
        <div className={styles.transport}>
          <button onClick={() => jump(index - 1)} disabled={!ready || unavailable || entering || index === 0} aria-label={tr('Previous room', '上一个房间', '上一個房間')}><ArrowLeft size={17} /></button>
          <button className={styles.play} onClick={toggle} disabled={!ready || unavailable} aria-label={ended ? tr('Replay tour', '重播看房', '重播睇樓') : playing ? tr('Pause film', '暂停播放', '暫停播放') : tr('Play film', '开始播放', '開始播放')}>{ended ? <RotateCcw size={17} /> : playing ? <Pause size={17} /> : <Play size={17} />}</button>
          <button onClick={() => jump(entering ? 0 : index + 1)} disabled={!ready || unavailable || ending} aria-label={tr('Next room', '下一个房间', '下一個房間')}><ArrowRight size={17} /></button>
          <span className={styles.time}>{timestamp(time)} <i>/</i> {timestamp(duration)}</span>
          <input className={styles.timeline} type="range" min={reduced ? ENTRY_DURATION : 0} max={duration} step={.1} value={time} disabled={!ready || unavailable} aria-label={tr('Film progress', '播放进度', '播放進度')} onChange={event => seek(Number(event.target.value))} />
          <button className={styles.light} onClick={() => setLighting(v => v === 'day' ? 'evening' : 'day')} aria-label={lighting === 'day' ? tr('Switch tour to evening', '切换夜晚光线', '切換夜晚光線') : tr('Switch tour to daylight', '切换日间光线', '切換日間光線')}>{lighting === 'day' ? <Sun size={16} /> : <Moon size={16} />}<span>{lighting === 'day' ? tr('Daylight', '日光', '日光') : tr('Evening', '夜晚', '夜晚')}</span></button>
        </div>
        <p id="interior-tour-description" className={styles.hint}>{tr('A spatial tour of your current arrangement. Drag to look around; choose a chapter to explore.', '当前布局的空间漫游。拖动可以环顾，点击章节可以切换房间。', '目前佈局的空間漫遊。拖動可以環顧，點擊章節可以切換房間。')}</p>
      </footer>
    </Dialog.Content>
  </Dialog.Portal></Dialog.Root>;
}
