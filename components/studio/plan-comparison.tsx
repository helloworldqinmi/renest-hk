'use client';
import {useLocale} from '@/components/locale-provider';
import {inspectPlan} from '@/lib/plan-insights';
import type {LivingBrief} from '@/lib/living-brief';
import {studioLayouts, type Placement, type LayoutId} from '@/lib/studio-data';
import {MiniPlan} from './layout-tools';
import {ProfileNotices} from './profile-notices';
import styles from './plan-decision.module.css';

export function PlanComparison({plans, brief, selected, current, recommended, onChoose}: {
  plans:{id:LayoutId;placements:Placement[]}[]; brief:LivingBrief; selected:string[];
  current:LayoutId; recommended:LayoutId; onChoose:(id:LayoutId)=>void;
}) {
  const {tr,t}=useLocale();
  const values=plans.map(p=>({...p,info:inspectPlan(brief,p.placements,selected)}));
  const rows=[
    {label:tr('Sleeping places','现有床位','現有床位'),values:values.map(p=>String(p.info.beds))},
    {label:tr('Desks inside','室内书桌','室內書枱'),values:values.map(p=>String(p.info.desks.length))},
    {label:tr('Old pieces reused','旧家具复用','舊傢俬重用'),values:values.map(p=>`${p.info.reused.length} / 18`)},
    {label:tr('Reference purchases','采购参考费用','採購參考費用'),values:values.map(p=>`HK$${p.info.cost.toLocaleString()}${p.info.overBudget?' *':''}`)},
    {label:tr('Not placed inside','未放入室内','未放入室內'),values:values.map(p=>String(p.info.left.length))},
  ];
  return <section className={styles.comparison}>
    <p>{tr('Choose the trade-off that works for you. Highlighted rows differ between arrangements. All figures include your edits.','选择适合你的取舍。高亮行表示方案之间的差异，所有数字包含你的调整。','選擇適合你的取捨。高亮行表示方案之間的差異，所有數字包含你的調整。')}</p>
    <div className={styles.tableScroll} tabIndex={0} role="region" aria-label={tr('Arrangement comparison table','方案对比表','方案比較表')}><table><caption className={styles.tableCaption}>{tr('Three ways to make it home','三种新家的可能','三種新居的可能')}</caption><thead><tr><th scope="col">{tr('Your decision','你的选择','你的選擇')}</th>{values.map(p=><th scope="col" key={p.id}><MiniPlan placements={p.placements}/><b>{t(studioLayouts.find(l=>l.id===p.id)!.name)}</b><small>{p.id===recommended?tr('Suggested starting point','优先比较','優先比較'):tr('Alternative','备选方案','備選方案')}</small></th>)}</tr></thead><tbody>{rows.map(row=><tr key={row.label} data-different={new Set(row.values).size>1}><th scope="row">{row.label}</th>{row.values.map((v,i)=><td key={values[i].id}>{v}</td>)}</tr>)}<tr><th scope="row">{tr('Pieces to arrange separately','需另作安排的旧家具','需另作安排的舊傢俬')}</th>{values.map(p=><td key={p.id}>{p.info.left.map(i=>t(i.name)).join(' · ')||tr('All placed inside','全部放入室内','全部放入室內')}</td>)}</tr><tr><th scope="row">{tr('Needs to resolve','待解决事项','待解決事項')}</th>{values.map(p=><td key={p.id}>{p.info.issues.length?<ProfileNotices issues={p.info.issues}/>:tr('No conflict in checked needs.','已检查的需求暂无冲突。','已檢查的需求暫無衝突。')}{p.info.staged.length>0&&<p>{tr('Pieces remain outside.','仍有家具在屋外暂存。','仍有傢俬在屋外暫存。')}</p>}{p.info.collisions.length>0&&<p>{tr('Placements need adjustment.','摆放存在碰撞或越界。','擺放存在碰撞或越界。')}</p>}</td>)}</tr></tbody><tfoot><tr><th scope="row">{tr('Choose an arrangement','采用方案','採用方案')}</th>{values.map(p=><td key={p.id}><button className={p.id===current?styles.primary:styles.secondary} onClick={()=>onChoose(p.id)}>{p.id===current?tr('Keep this arrangement','保留当前方案','保留目前方案'):tr('Use this arrangement','采用此方案','採用此方案')}</button></td>)}</tr></tfoot></table></div>
    <p className={styles.verification}>{tr('* Purchases exceed the allowance. Prices exclude delivery and installation. Door swings, accessibility and actual clearances remain unverified.','* 采购超过家具额度。参考价不含搬运与安装；门扇开启、无障碍和实际净宽尚未验证。','* 採購超過傢俬額度。參考價不含搬運與安裝；門扇開啟、無障礙和實際淨闊尚未驗證。')}</p>
  </section>;
}
