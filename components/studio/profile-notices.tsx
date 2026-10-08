'use client';
import {useLocale} from '@/components/locale-provider';
import type {ProfileNotice} from '@/lib/profile-planning';
import type {LocalCopy} from '@/lib/living-profile';
const copy:Record<ProfileNotice,LocalCopy>={
 beds:['The supplied beds do not cover all requested sleeping places. Adjust the furniture or requirements.','现有床位未覆盖全部需求，需要调整家具或床位要求。','現有床位未覆蓋全部需求，需要調整傢俬或床位要求。'],
 overnight:['A separate overnight guest bed is not included in this arrangement.','此方案尚未留出额外的客人床位。','此方案尚未留出額外的客人床位。'],
 'must-keep':['Some must-keep pieces are missing. This is a draft that needs adjustment.','部分必留家具未能纳入，只能作为待调整方案。','部分必留傢俬未能納入，只能作為待調整方案。'],
 workstations:['This preset has fewer desks than the simultaneous workspaces requested.','此预设的书桌数量不足以满足同时工作的人数。','此預設的書枱數量不足以滿足同時工作的人數。'],
 'work-room':['Your preferred room for work needs manual placement changes.','书桌所在房间仍需根据你的偏好手动调整。','書枱所在房間仍需根據你的偏好手動調整。'],
 dining:['Dining or guest seating needs exceed the table/seats in this preset.','日常或待客的餐桌座位需求超过此预设，请调整餐区。','日常或待客的餐枱座位需求超過此預設，請調整飯廳。'],
 access:['Accessibility needs are recorded. Wheelchair routes and clearances have not been verified by this demo.','无障碍需求已记录；本演示尚未验证轮椅动线和实际通行净宽。','無障礙需求已記錄；本示範尚未驗證輪椅動線和實際通行淨闊。'],
 'service-budget':['You included transport/assembly but have not reserved a cost. Furniture prices are not an all-in quote.','预算包含运装，但尚未预留费用；家具价格不代表全部入住费用。','預算包含運裝，但尚未預留費用；傢俬價格不代表全部入住費用。'],
 'unknown-budget':['Budget is undecided. Catalogue prices are shown without a confirmed spending limit.','预算待确认，目前显示目录参考价，尚未设定消费上限。','預算待確認，目前顯示目錄參考價，尚未設定消費上限。'],
 'hobby-space':['Requested dedicated hobby areas exceed the 45 m² demo home. Reduce them or allow shared space.','爱好专用面积合计超过示例的 45 平方米，请调整或选择共用空间。','愛好專用面積合計超過範例的 45 平方米，請調整或選擇共用空間。'],
 details:['Hobbies, pet facilities and visual style are saved in your brief; the supplied models do not yet depict these details.','爱好、宠物设施和风格已随需求保存，现有示意模型尚未逐项实现这些细节。','愛好、寵物設施和風格已隨需求儲存，現有示意模型尚未逐項實現這些細節。'],
 mounting:['Wall-mounted furniture was omitted because mounting permission is unconfirmed or disallowed.','打孔许可未确认或不允许，暂不放入需要上墙固定的家具。','打孔許可未確認或不允許，暫不放入需要上牆固定的傢俬。'],
 'budget-trimmed':['Optional additions were reduced to stay within your furniture allowance.','已减少可选添置，控制在你预留的家具预算内。','已減少可選添置，控制在你預留的傢俬預算內。'],
 secondhand:['Compatible second-hand pieces replace the corresponding new recommendations.','已用适配的二手家具替换对应新品推荐。','已用適配的二手傢俬替換對應新品推薦。'],
};
export function ProfileNotices({issues,changes=[],expanded=false}:{issues:ProfileNotice[];changes?:ProfileNotice[];expanded?:boolean}){
 const {tr}=useLocale();if(!issues.length&&!changes.length)return null;
 const important=issues.filter(v=>['beds','must-keep','workstations','dining','access','hobby-space'].includes(v));
 const others=issues.filter(v=>!important.includes(v));
 return <div className="profile-notices">{important.length>0&&<div className="profile-notices-warning"><b>{tr('Still needs your attention','这些需求仍需处理','這些需求仍需處理')}</b><ul>{important.map(v=><li key={v}>{tr(...copy[v])}</li>)}</ul></div>}{changes.length>0&&<ul className="profile-notices-changes">{changes.map(v=><li key={v}>{tr(...copy[v])}</li>)}</ul>}{others.length>0&&<details open={expanded}><summary>{tr('Planning notes','规划说明','規劃說明')} · {others.length}</summary><ul>{others.map(v=><li key={v}>{tr(...copy[v])}</li>)}</ul></details>}</div>;
}
