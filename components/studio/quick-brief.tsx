'use client';

import {useState} from 'react';
import {ArrowRight, Users, Monitor, Coffee, Recycle} from 'lucide-react';
import {useLocale} from '@/components/locale-provider';
import {type LivingBrief} from '@/lib/living-brief';
import {buildQuickBrief, quickChoices, planDifference, type QuickPriority} from '@/lib/plan-insights';
import {planForProfile} from '@/lib/profile-planning';
import {studioLayouts, studioInventory, type Placement} from '@/lib/studio-data';
import {MiniPlan} from './layout-tools';
import {ProfileNotices} from './profile-notices';
import styles from './plan-decision.module.css';

export function QuickBrief({value, selected, onApply, onDetailed, ready = true, refining = false, currentPlacements}: {
  value: LivingBrief; selected: string[]; onApply: (value: LivingBrief) => void;
  onDetailed: (draft: LivingBrief) => void; ready?: boolean; refining?: boolean; currentPlacements?: Placement[];
}) {
  const {tr, t} = useLocale();
  const [choices, setChoices] = useState(() => quickChoices(value));
  const draft = buildQuickBrief(value, selected, choices);
  const planning = planForProfile(draft, selected);
  const plan = planning.plans.find(p => p.id === planning.recommended)!;
  const difference = currentPlacements ? planDifference(currentPlacements, plan.placements) : null;
  const options = [
    {id: 'reuse', icon: Recycle, title: tr('Keep what matters', '家庭生活', '家庭生活'), detail: tr('Keep more of your own furniture.', '优先保留旧家具，少添置。', '優先保留舊傢俬，少添置。')},
    {id: 'work', icon: Monitor, title: tr('Work side by side', '双人办公', '雙人辦公'), detail: tr('Compare room for two desks.', '优先比较两个工作位。', '優先比較兩個工作位。')},
    {id: 'host', icon: Coffee, title: tr('Bring people together', '经常聚会', '經常聚會'), detail: tr('Make room for a table of four.', '优先考虑四人聚餐。', '優先考慮四人聚餐。')},
  ];
  return <div className={styles.quick} data-refining={refining}>
    <div className={styles.quickIntro}>
      <span className={styles.eyebrow}>{tr('A SMALL BRIEF. A CLEARER MOVE.', '三个选择，看见新家。', '三個選擇，看見新居。')}</span>
      <h1>{refining ? tr('What would you change?', '这次，想改变什么？', '這次，想改變甚麼？') : tr('Make room for your everyday.', '先从你的日常开始。', '先從你的日常開始。')}</h1>
      <p>{tr('Choose a starting point. Compare the trade-offs, then make it yours.', '先选一个生活重点，看看方案与取舍，再慢慢完善。', '先選一個生活重點，看看方案與取捨，再慢慢完善。')}</p>
      {!refining && <div className={styles.sampleNote}><b>{tr('Your example move', '本次示例搬家', '本次示範搬屋')}</b><span>45 m² / 484 ft² · {selected.length} {tr('selected pieces', '件已选旧家具', '件已選舊傢俬')}</span><p>{tr('Three curated arrangements. Your answers change their ranking and purchases. No live scan is needed.', '比较三套预设布局；你的选择会改变推荐顺序与添置清单，无需实时扫描。', '比較三套預設佈局；你的選擇會改變推薦次序與添置清單，無需即時掃描。')}</p></div>}
    </div>
    <form className={styles.quickForm} onSubmit={e => {e.preventDefault(); onApply(draft);}}>
      <fieldset><legend><Users size={17}/>{tr('01 · Who is moving in?', '01 · 几个人一起住？', '01 · 幾個人一起住？')}</legend><div className={styles.pills}>
        {['1','2','3','4+'].map(n => <button type="button" key={n} aria-pressed={choices.household === n} onClick={() => setChoices(v => ({...v, household: n}))}>{n} {tr(n==='1'?'person':'people', '人', '人')}</button>)}
      </div><p className={styles.hint}>{tr('We check sleeping places against your household size.', '用于检查现有床位能否覆盖居住人数。', '用於檢查現有床位能否覆蓋居住人數。')}</p></fieldset>
      <fieldset><legend>{tr('02 · What matters most?', '02 · 最重要的生活需求？', '02 · 最重要的生活需求？')}</legend><div className={styles.priorities}>
        {options.map(o => <button type="button" key={o.id} aria-pressed={choices.priority === o.id} onClick={() => setChoices(v => ({...v, priority: o.id as QuickPriority}))}><o.icon size={23}/><b>{o.title}</b><span>{o.detail}</span></button>)}
      </div></fieldset>
      <fieldset><legend>{tr('03 · Your furniture allowance', '03 · 新增家具预算', '03 · 新增傢俬預算')}</legend><div className={styles.budgetRow}><span>HK$</span><input aria-label={tr('Furniture budget in HKD', '家具预算（港币）', '傢俬預算（港幣）')} type="number" required min={0} max={1000000} step={1} value={choices.budget} onChange={e => setChoices(v => ({...v, budget: Math.max(0, Math.min(1000000, Number(e.target.value) || 0))}))}/></div><div className={styles.pills}>{[0,1000,3000,6000].map(n => <button type="button" key={n} aria-pressed={choices.budget === n} onClick={() => setChoices(v => ({...v, budget: n}))}>{n === 0 ? tr('No purchases', '暂不添置', '暫不添置') : `HK$${n.toLocaleString()}`}</button>)}</div><p className={styles.hint}>{tr('Optional purchases are trimmed to fit. Delivery and installation need a separate quote.', '预算会限制可选添置；搬运与安装费用仍需另行报价。', '預算會限制可選添置；搬運與安裝費用仍需另行報價。')}</p></fieldset>
      <details className={styles.assumptions}><summary>{tr('Mounting & planning assumptions', '打孔限制与规划假设', '打孔限制與規劃假設')}</summary><label>{tr('Can furniture be fixed to a wall?', '家具可以上墙固定吗？', '傢俬可以上牆固定嗎？')}<select value={choices.drilling} onChange={e => setChoices(v => ({...v, drilling: e.target.value}))}><option value="unknown">{tr('Not confirmed', '尚未确认', '尚未確認')}</option><option value="no">{tr('No drilling', '不允许打孔', '不允許打孔')}</option><option value="yes">{tr('Mounting allowed', '允许上墙固定', '允許上牆固定')}</option></select></label><p>{tr('Quick planning allows compatible second-hand alternatives unless your detailed brief says otherwise. Unanswered needs are not treated as verified. Existing detailed answers are retained; changing the lifestyle updates work and hosting needs.', '快速规划默认允许适配的二手替代品，已有详细偏好优先。未填写的需求不视为已验证；详细答案会保留，切换生活重点会更新办公与待客需求。', '快速規劃預設允許適配的二手替代品，已有詳細偏好優先。未填寫的需求不視為已驗證；詳細答案會保留，切換生活重點會更新辦公與待客需求。')}</p></details>
      <div className={styles.livePreview} aria-live="polite"><MiniPlan placements={plan.placements}/><div><small>{tr('CURRENT STARTING POINT', '实时匹配结果', '即時配對結果')}</small><b>{t(studioLayouts.find(l => l.id === plan.id)!.name)}</b><span>HK${plan.cost.toLocaleString()} · {tr('indicative purchases', '参考采购费用', '參考採購費用')}</span></div></div>
      <ProfileNotices issues={plan.issues.filter(i => ['beds','must-keep','workstations','dining'].includes(i))}/>
      {difference&&<div className={styles.revision} aria-live="polite"><b>{tr('Preview of this update','更新预览','更新預覽')}</b><p>{tr('Purchase difference: ','采购费用变化：','採購費用變化：')}{difference.cost>0?'+':difference.cost<0?'−':''}HK${Math.abs(difference.cost).toLocaleString()}</p>{difference.added.length>0&&<p>{tr('Add: ','加入：','加入：')}{difference.added.map(p=>t(studioInventory.find(i=>i.id===p.id)!.name)).join(' · ')}</p>}{difference.removed.length>0&&<p>{tr('Remove: ','移出：','移出：')}{difference.removed.map(p=>t(studioInventory.find(i=>i.id===p.id)!.name)).join(' · ')}</p>}<p>{difference.moved.length} {tr('pieces repositioned','件家具改变位置','件傢俬改變位置')}</p></div>}
      {refining && <p className={styles.hint}>{tr('Applying replaces the three arrangements with updated presets. You can undo this update from the result.', '应用后会用更新后的预设替换三套布局，包括手动调整；可在结果页撤销此次更新。', '套用後會以更新後的預設替換三套佈局，包括手動調整；可在結果頁復原此次更新。')}</p>}
      <div className={styles.quickActions}><button type="submit" className={styles.primary} disabled={!ready}>{ready ? refining ? tr('Apply & see changes', '应用并查看变化', '套用並查看變化') : tr('Show my arrangements', '看看我的方案', '看看我的方案') : tr('Preparing your preview…', '正在准备空间预览…', '正在準備空間預覽…')}<ArrowRight size={17}/></button><button type="button" className={styles.secondary} onClick={()=>onDetailed(draft)}>{tr('Add detailed needs', '进一步完善需求', '進一步完善需求')}</button></div>
    </form>
  </div>;
}
