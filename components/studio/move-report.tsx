'use client';

import {createPortal} from 'react-dom';
import {Printer} from 'lucide-react';
import {useLocale} from '@/components/locale-provider';
import {Modal} from '@/components/common/modal';
import {BrandLogo} from '@/components/common/brand-logo';
import {inspectPlan} from '@/lib/plan-insights';
import type {LivingBrief} from '@/lib/living-brief';
import {existingItems, studioInventory, studioLayouts, type Placement, type LayoutId} from '@/lib/studio-data';
import {findFoldingProduct} from '@/lib/folding-products';
import {isStaged} from '@/lib/studio-placement';
import {MiniPlan} from './layout-tools';
import {ProfileNotices} from './profile-notices';
import styles from './plan-decision.module.css';

type ReportProps={brief:LivingBrief;placements:Placement[];selected:string[];layout:LayoutId;name:string};
function ReportContent({brief,placements,selected,layout,name}:ReportProps){
  const {tr,t}=useLocale();const info=inspectPlan(brief,placements,selected);
  const additions=placements.filter(p=>p.origin==='new').map(p=>studioInventory.find(i=>i.id===p.id)!);
  const rows=[...existingItems,...additions];
  return <article className={styles.report}>
    <header><BrandLogo/><span>{tr('MOVING PLAN · REVIEW BEFORE MOVING','搬家方案 · 执行前请复核','搬屋方案 · 執行前請覆核')}</span></header>
    <h1>{name||tr('Your next home, on paper.','把新家方案带走。','把新居方案帶走。')}</h1>
    <p>{t(studioLayouts.find(l=>l.id===layout)!.name)} · {tr('Sample home','示例户型','示範戶型')} · 45 m² / 484 ft²</p>
    <div className={styles.reportOverview}><figure><MiniPlan placements={placements}/><figcaption>{tr('Green: reused · ochre: additions. Estimated dimensions.','绿色：复用旧家具；棕色：添置家具。尺寸为估计值。','綠色：重用舊傢俬；棕色：添置傢俬。尺寸為估計值。')}</figcaption></figure><dl><dt>{tr('Old furniture placed inside','放入新家的旧家具','放入新居的舊傢俬')}</dt><dd>{info.reused.length} / {existingItems.length}</dd><dt>{tr('Reference purchases','新增采购参考费用','新增採購參考費用')}</dt><dd>HK${info.cost.toLocaleString()}</dd><dt>{tr('Sleeping places / desks','床位 / 书桌','床位 / 書枱')}</dt><dd>{info.beds} / {info.desks.length}</dd><dt>{tr('Delivery / installation / disposal','搬运 / 安装 / 旧物处理','搬運 / 安裝 / 舊物處理')}</dt><dd>{tr('Quote required','待报价','待報價')}</dd></dl></div>
    <h2>{tr('Your brief','你的需求','你的需求')}</h2>
    <p>{tr('Household: ','居住人数：','居住人數：')}{brief.profile?.answers.household??brief.household} · {tr('Priority: ','生活重点：','生活重點：')}{t(brief.priority)} · {tr('Furniture allowance: ','家具额度：','傢俬額度：')}{info.allowance===null?tr('Not confirmed','待确认','待確認'):`HK$${info.allowance.toLocaleString()}`}</p>
    {brief.profile?.extra&&<p>{brief.profile.extra}</p>}
    <h2>{tr('Confirm before the move','搬家前请确认','搬屋前請確認')}</h2>
    <ul><li>{tr('Remeasure furniture and check doorways, lift access, door swings and walking routes on site.','现场复尺家具，检查门口、电梯、门扇开启与通行动线。','現場覆尺傢俬，檢查門口、升降機、門扇開啟與通行動線。')}</li><li>{tr('Confirm product availability, mounting permission and service quotes.','确认商品库存、上墙许可和各项服务报价。','確認商品庫存、上牆許可和各項服務報價。')}</li><li>{tr('Assign a destination for every piece left out. Resale drafts are not published listings.','为未带走的每件家具确认去向；转售草稿尚未发布。','為未帶走的每件傢俬確認去向；轉售草稿尚未發佈。')}</li>{info.staged.length>0&&<li>{tr('Furniture in temporary storage is not counted as placed in your new home.','屋外暂存家具未计入新家复用数量。','屋外暫存傢俬未計入新居重用數量。')}</li>}{info.overBudget&&<li>{tr('Current purchases exceed your furniture allowance.','当前采购超出家具额度。','目前採購超出傢俬額度。')}</li>}{info.collisions.length>0&&<li>{tr('Some placements overlap or cross boundaries; revise them before moving.','部分摆放存在碰撞或越界，请在搬家前调整。','部分擺放存在碰撞或越界，請在搬屋前調整。')}</li>}</ul>
    <ProfileNotices issues={info.issues} expanded/>
    <h2>{tr('Furniture & packing checklist','家具去向与打包清单','傢俬去向與打包清單')}</h2>
    <table><thead><tr><th>{tr('Piece','家具','傢俬')}</th><th>{tr('W × D × H (cm)','宽 × 深 × 高（cm）','闊 × 深 × 高（cm）')}</th><th>{tr('Decision','安排','安排')}</th><th>{tr('HKD','港币','港幣')}</th><th>{tr('Packed','已打包','已打包')}</th></tr></thead><tbody>{rows.map(item=>{const p=placements.find(v=>v.id===item.id);return <tr key={item.id}><td><b>{t(item.name)}</b><small>{item.id}</small></td><td>{item.dimensions.map(n=>Math.round(n*100)).join(' × ')}</td><td>{p&&isStaged(p)?tr('Temporary storage','屋外暂存','屋外暫存'):item.origin==='new'?item.secondhand?tr('Buy second-hand','购买二手','購買二手'):tr('Buy new','购买新品','購買新品'):p?tr('Reuse / move','复用 / 搬入','重用 / 搬入'):tr('Confirm another destination','另行确认去向','另行確認去向')}</td><td>{item.productSlug?findFoldingProduct(item.productSlug)?.price.toLocaleString():'—'}</td><td>□</td></tr>;})}</tbody></table>
    <footer>{tr('ReNest · A planning preview, not a surveyed plan or an order. Costs reflect the current catalogue example.','ReNest · 布置预览，不是实测图纸或订单。费用基于当前示例目录。','ReNest · 佈置預覽，並非實測圖則或訂單。費用基於目前示範目錄。')}</footer>
  </article>;
}

export function MoveReport(props:ReportProps&{onClose:()=>void}){
  const {tr}=useLocale();
  return <><Modal open onClose={props.onClose} wide title={tr('Your moving plan','你的搬家方案','你的搬屋方案')}><div className={styles.reportActions}><p>{tr('Print this plan, or choose Save as PDF in the print dialog to share with family or movers.','打印此方案，或在打印窗口选择“另存为 PDF”，发送给家人或搬家公司。','列印此方案，或在列印視窗選擇「另存為 PDF」，傳送給家人或搬屋公司。')}</p><button className={styles.primary} onClick={()=>window.print()}><Printer size={17}/>{tr('Print / save PDF','打印 / 保存 PDF','列印 / 儲存 PDF')}</button></div><ReportContent {...props}/></Modal>{createPortal(<div data-renest-print className={styles.printOnly}><ReportContent {...props}/></div>,document.body)}</>;
}
