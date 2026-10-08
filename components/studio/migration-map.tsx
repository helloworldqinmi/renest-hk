'use client';

import { useEffect, useRef } from 'react';
import { useLocale } from '@/components/locale-provider';
import { driveProgress, smoothMotion } from '@/lib/migration-motion';
import styles from './migration-map.module.css';
import mapData from '@/lib/hong-kong-map.json';

const route = mapData.route;

/** A deliberately illustrated Hong Kong journey, synchronized with the 3D truck. */
export function MigrationMap({ progress, reduced, paused = false }: { progress: number; reduced: boolean; paused?: boolean }) {
  const { tr } = useLocale();
  const road = useRef<SVGPathElement>(null), travelled = useRef<SVGPathElement>(null), truck = useRef<SVGGElement>(null), map = useRef<HTMLDivElement>(null);
  const mapViewport = useRef<SVGSVGElement>(null);
  const target = useRef(progress), stopped = useRef(paused); target.current = progress; stopped.current = paused;
  useEffect(() => {
    const path = road.current, vehicle = truck.current, line = travelled.current, host = map.current, viewport = mapViewport.current;
    if (!path || !vehicle || !line || !host || !viewport) return;
    const length = path.getTotalLength();
    let disposed = false, frame = 0, previous = performance.now(), displayed = driveProgress(target.current), painted = false;
    const tick = (now: number) => {
      if (disposed || !host.isConnected) return;
      const delta = Math.min(.06, (now - previous) / 1000); previous = now;
      if (stopped.current && painted) { frame = requestAnimationFrame(tick); return; }
      const goal = driveProgress(target.current);
      const opening = reduced ? 1 : smoothMotion((target.current - .34) / .075);
      const closing = reduced ? 0 : smoothMotion((target.current - .64) / .04);
      // Start over the departure street, reveal the actual geography, then find
      // the destination at the same scale for the return to the physical scene.
      const fullScale = opening * (1 - closing), width = 150 + 750 * fullScale, height = width * 650 / 900;
      const anchorX = mapData.start[0] + (mapData.end[0] - mapData.start[0]) * closing;
      const anchorY = mapData.start[1] + (mapData.end[1] - mapData.start[1]) * closing;
      const centerX = anchorX + (450 - anchorX) * fullScale, centerY = anchorY + (325 - anchorY) * fullScale;
      viewport.setAttribute('viewBox', `${centerX - width / 2} ${centerY - height / 2} ${width} ${height}`);
      host.style.setProperty('--map-copy-opacity', String(reduced ? 1 : smoothMotion((opening - .75) / .25) * (1 - closing)));
      host.dataset.cameraScale = fullScale.toFixed(3);
      displayed = reduced ? goal : displayed + (goal - displayed) * (1 - Math.exp(-12 * delta));
      const point = path.getPointAtLength(displayed * length);
      vehicle.setAttribute('transform', `translate(${point.x.toFixed(2)} ${point.y.toFixed(2)})`);
      painted = true;
      line.style.strokeDasharray = `${length}`;
      line.style.strokeDashoffset = `${length * (1 - displayed)}`;
      host.dataset.arrived = String(goal > .985);
      host.dataset.journeyProgress = displayed.toFixed(3);
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => { disposed = true; cancelAnimationFrame(frame); };
  }, [reduced]);

  return <div ref={map} className={styles.journey} data-testid="migration-map" data-reduced={reduced} data-paused={paused}>
    <div className={styles.copy}><span>{tr('A LITTLE JOURNEY. A BIG NEW CHAPTER.', '一段小旅程，一段新生活。', '一段小旅程，一段新生活。')}</span><h2>{tr('Good things', '带上喜欢的', '帶上喜歡的')}<br /><em>{tr('are on their way.', '一起出发。', '一起出發。')}</em></h2><p>{tr('Your familiar pieces, heading north.', '熟悉的家具，向北出发。', '熟悉的傢俬，向北出發。')}</p></div>
    <svg ref={mapViewport} className={styles.map} viewBox={reduced ? '0 0 900 650' : `${mapData.start[0] - 75} ${mapData.start[1] - 150 * 650 / 900 / 2} 150 ${150 * 650 / 900}`} role="img" aria-label={tr('Illustrated moving journey from Kowloon to the Northern Metropolis', '从九龙到北都会的插画搬家旅程', '從九龍到北都會的插畫搬屋旅程')}>
      <defs>
        <pattern id="journey-sea" width="85" height="65" patternUnits="userSpaceOnUse"><path d="M12 40 Q21 34 30 40 T48 40" fill="none" stroke="#a6ced2" strokeWidth="1.5" opacity=".45" /></pattern>
        <filter id="journey-shadow" x="-30%" y="-30%" width="160%" height="180%"><feDropShadow dx="0" dy="4" stdDeviation="3" floodColor="#416266" floodOpacity=".22" /></filter>
      </defs>
      <rect width="900" height="650" fill="url(#journey-sea)" />
      <g fill="#d8e6be" stroke="#91af94" strokeWidth="1.5" strokeLinejoin="round" fillRule="evenodd">{mapData.paths.map((d,i)=><path key={i} d={d}/>)}</g>
      <path d="M290 180 Q330 132 384 149 T473 151" fill="none" stroke="#b2cf86" strokeWidth="24" strokeLinecap="round" opacity=".4"/>
      <g fill="#97b87d" stroke="#7a9d70" strokeWidth="1.3"><path d="M372 305 Q390 273 408 305 Z"/><path d="M412 300 Q430 269 448 300 Z"/><path d="M500 222 Q518 186 536 222 Z"/><path d="M227 465 Q244 434 261 465 Z"/></g>
      <g fill="#d2c5aa" stroke="#8f9d8a" strokeWidth="1.3"><rect x="454" y="350" width="10" height="22" rx="2"/><rect x="468" y="341" width="11" height="30" rx="2"/><path d="M447 443 v-37 h9 v37 Z"/><path d="M461 445 v-42 l8-11 7 11 v42 Z"/></g>
      <g fill="#fff8e9" stroke="#8f9d8a" strokeWidth="1.3"><path d="M372 152 v-17 h20 v17 Z"/><path d="M369 135 l13-12 13 12 Z"/><path d="M396 155 v-23 h17 v23 Z"/><path d="M393 132 l12-11 11 11 Z"/></g>
      <g className={styles.labels} fill="#42645a"><text x="315" y="239">{tr('NEW TERRITORIES','新界','新界')}</text><text x="434" y="400">{tr('KOWLOON','九龙','九龍')}</text><text x="446" y="488">{tr('HONG KONG ISLAND','香港岛','香港島')}</text><text x="188" y="506">{tr('LANTAU','大屿山','大嶼山')}</text><text x="483" y="315">{tr('SHA TIN','沙田','沙田')}</text><text x="463" y="228">{tr('TAI PO','大埔','大埔')}</text><text x="429" y="179">{tr('FANLING','粉岭','粉嶺')}</text><text x="516" y="429" fill="#7ea6b1">{tr('VICTORIA HARBOUR','维多利亚港','維多利亞港')}</text></g>
      <path ref={road} d={route} fill="none" stroke="#fdf8e9" strokeWidth="14" strokeLinecap="round"/>
      <path d={route} fill="none" stroke="#b7b69f" strokeWidth="1.5" strokeDasharray="3 7" strokeLinecap="round"/>
      <path ref={travelled} d={route} fill="none" stroke="#d19b61" strokeWidth="4" strokeLinecap="round"/>
      <circle cx={mapData.start[0]} cy={mapData.start[1]} r="6" fill="#40675c" stroke="#fffbec" strokeWidth="3"/>
      <g className={styles.destination}><circle cx={mapData.end[0]} cy={mapData.end[1]} r="15" fill="#dfab73" opacity=".25"/><circle cx={mapData.end[0]} cy={mapData.end[1]} r="6" fill="#b27949" stroke="#fff9e9" strokeWidth="3"/></g>
      <g className={styles.destinationLabel} transform="translate(-108 1)"><rect x="515" y="113" width="194" height="54" rx="8" fill="#fffbed" stroke="#b2c8a6"/><text x="531" y="135">{tr('NORTHERN','北都会','北都會')}</text><text x="531" y="153">{tr('METROPOLIS','新的家，在这里。','新的家，在這裡。')}</text><path d="M516 145 l-27 4" stroke="#9bb893" fill="none"/></g>
      <g className={styles.cloud} fill="#fffcef" opacity=".9"><path d="M636 78 q-8-17 9-20 q8-19 23-6 q20-3 23 17 q19 5 11 18 h-62 Z" /><path d="M264 375 q-7-15 10-17 q8-17 22-4 q15-4 19 11 q17 5 9 15 h-59 Z" /></g>
      <g className={styles.boat} transform="translate(410 483)"><path d="M-16 8 h33 l-8 8 h-18 Z" fill="#bd9271" /><path d="M0-20 v27 h-18 Z" fill="#fffbec" /><path d="M3-13 v20 h14 Z" fill="#dcbda1" /></g>
      <g ref={truck} className={styles.routePoint}>
        <circle r="13" fill="#3b7065" opacity=".12" />
        <circle r="6.5" fill="#356d61" stroke="#fffdf5" strokeWidth="3" />
      </g>
      <g transform="translate(803 114)" className={styles.compass}><path d="M0 17 V-12 M-5-4 L0-12 5-4" fill="none" stroke="#678d89" strokeWidth="1.5" /><text x="0" y="-22" textAnchor="middle">N</text></g>
    </svg>
    <a className={styles.attribution} href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">{mapData.attribution}</a>
    <div className={styles.footer}><span>{tr('KOWLOON', '九龙', '九龍')}</span><i /><span>{tr('NORTHERN METROPOLIS', '北都会', '北都會')}</span><small>{tr('An illustrated journey', '插画旅程', '插畫旅程')}</small></div>
  </div>;
}
