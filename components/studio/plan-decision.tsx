'use client';

import type {ReactNode} from 'react';
import {Check, ArrowRight, AlertCircle, Undo2} from 'lucide-react';
import {useLocale} from '@/components/locale-provider';
import {inspectPlan, planDifference} from '@/lib/plan-insights';
import type {LivingBrief} from '@/lib/living-brief';
import {studioInventory, type Placement} from '@/lib/studio-data';
import {ProfileNotices} from './profile-notices';
import styles from './plan-decision.module.css';

export function PlanDecision({brief, placements, selected, onHighlight, children}: {
  brief: LivingBrief; placements: Placement[]; selected: string[]; onHighlight: (id: string) => void; children?: ReactNode;
}) {
  const {tr, t} = useLocale();
  const info = inspectPlan(brief, placements, selected);
  const priority = brief.profile?.answers.priority;
  const primary = priority === 'work' ? tr('Room to work', '办公空间', '辦公空間') : priority === 'host' ? tr('Room for company', '待客空间', '待客空間') : tr('More of your own furniture', '保留更多旧家具', '保留更多舊傢俬');
  return <section className={styles.decision} aria-label={tr('Your arrangement explained', '方案决策摘要', '方案決策摘要')}>
    <div className={styles.cost}><div><span>{tr('Indicative purchases', '新增采购参考费用', '新增採購參考費用')}</span><strong><small>HK$</small>{info.cost.toLocaleString()}</strong></div><span data-over={info.overBudget}>{info.allowance === null ? tr('Budget not set', '预算待确认', '預算待確認') : `${tr('Allowance', '家具额度', '傢俬額度')} HK$${info.allowance.toLocaleString()}`}</span></div>
    <div className={styles.facts}><div><b>{info.reused.length}<small>/{selected.length}</small></b><span>{tr('selected pieces reused', '已选旧家具复用', '已選舊傢俬重用')}</span></div><div><b>{info.beds}</b><span>{tr('sleeping places', '现有床位', '現有床位')}</span></div><div><b>{info.desks.length}</b><span>{tr('desks in the room', '房间内书桌', '房間內書枱')}</span></div></div>
    {children}
    <div className={styles.reason}><Check size={16}/><div><b>{primary}</b><p>{tr('These counts reflect this arrangement, including your edits. Select a piece to locate it.', '数量按当前实际布局计算，包含你的调整。点击家具可在空间中定位。', '數量按目前實際佈局計算，包含你的調整。點選傢俬可在空間中定位。')}</p><div className={styles.itemLinks}>{(priority === 'work' ? info.desks : info.reused.filter(p => ['F01','F04','F09'].includes(p.id))).slice(0,3).map(p => <button key={p.id} onClick={() => onHighlight(p.id)}>{t(studioInventory.find(i => i.id === p.id)!.name)}<ArrowRight size={12}/></button>)}</div></div></div>
    {info.left.length > 0 && <div className={styles.tradeoff}><b>{tr('The trade-off', '需要做的取舍', '需要作的取捨')}</b><p>{info.left.map(i => t(i.name)).join(' · ')}</p><small>{tr('Not placed inside this home. Keep in storage, sell or pass on after confirming.', '未放入新家室内，需确认留存、转售或转赠安排。', '未放入新居室內，需確認留存、轉售或轉贈安排。')}</small></div>}
    <ProfileNotices issues={info.issues}/>
    {(info.overBudget || info.staged.length > 0 || info.collisions.length > 0) && <div className={styles.warning} role="status"><AlertCircle size={16}/><span>{info.overBudget && tr('Purchases exceed your allowance. ', '采购超过家具额度。', '採購超過傢俬額度。')}{info.staged.length > 0 && tr(`${info.staged.length} pieces are still in temporary storage. `, `${info.staged.length} 件仍在屋外暂存区。`, `${info.staged.length} 件仍在屋外暫存區。`)}{info.collisions.length > 0 && tr('Some placements need a collision check.', '部分摆放存在碰撞或越界，需调整。', '部分擺放存在碰撞或越界，需調整。')}</span></div>}
    <p className={styles.verification}>{tr('Before moving: remeasure furniture, doorways and circulation. Delivery, installation and disposal are not quoted.', '搬家前待确认：家具复尺、门口与通行净宽。搬运、安装和旧物处理尚未报价。', '搬屋前待確認：傢俬覆尺、門口與通行淨闊。搬運、安裝和舊物處理尚未報價。')}</p>
  </section>;
}

export function PlanRevision({before, after, onUndo}: {before: Placement[]; after: Placement[]; onUndo: () => void}) {
  const {tr,t}=useLocale();
  const diff=planDifference(before,after);
  const names=(items:Placement[])=>items.map(p=>t(studioInventory.find(i=>i.id===p.id)!.name)).join(' · ');
  return <div className={styles.revision} role="status"><div><b>{tr('What changed', '这次更新了什么', '這次更新了甚麼')}</b><button onClick={onUndo}><Undo2 size={14}/>{tr('Undo update','撤销更新','復原更新')}</button></div><p>{tr('Purchase difference','采购费用变化','採購費用變化')} <strong>{diff.cost>0?'+':diff.cost<0?'−':''}HK${Math.abs(diff.cost).toLocaleString()}</strong></p>{diff.added.length>0&&<p><b>{tr('Added: ','加入：','加入：')}</b>{names(diff.added)}</p>}{diff.removed.length>0&&<p><b>{tr('Left out: ','移出：','移出：')}</b>{names(diff.removed)}</p>}{diff.moved.length>0&&<p>{diff.moved.length} {tr('pieces repositioned','件家具改变了位置','件傢俬改變了位置')}</p>}{!diff.added.length&&!diff.removed.length&&!diff.moved.length&&<p>{tr('Your current pieces still fit this starting point. Review any unmet needs below.','当前家具清单与位置未变，请查看下方仍未满足的需求。','目前傢俬清單與位置未變，請查看下方仍未滿足的需求。')}</p>}</div>;
}
