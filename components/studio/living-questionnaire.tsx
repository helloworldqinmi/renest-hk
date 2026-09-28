'use client';
import { useLocale } from '@/components/locale-provider';
import type { LivingBrief } from '@/lib/living-brief';
export function LivingQuestionnaire({value,onChange}:{value:LivingBrief;onChange:(v:LivingBrief)=>void}){
 const {tr}=useLocale();
 const fields: {key:Exclude<keyof LivingBrief,'budget'|'moveDate'|'profile'>;label:string;options:[string,string,string][]}[]=[
  {key:'household',label:tr('People at home','常住人数','常住人數'),options:[['1','1 人','1 人'],['2','2 人','2 人'],['3','3 人','3 人'],['4+','4 人以上','4 人以上']]},
  {key:'children',label:tr('Children / older adults','儿童／长者人数','兒童／長者人數'),options:[['0','无','無'],['1','1 人','1 人'],['2+','2 人以上','2 人以上']]},
  {key:'pets',label:tr('Pets','宠物','寵物'),options:[['None','无','無'],['Cat','猫','貓'],['Dog','狗','狗'],['Other','其他','其他']]},
  {key:'work',label:tr('Working from home','居家办公频率','居家辦公頻率'),options:[['Never','不需要','不需要'],['Sometimes','偶尔','偶爾'],['Daily','每天，一人','每天，一人'],['Two people','两人同时','兩人同時']]},
  {key:'guests',label:tr('Dinner seats needed','用餐座位需求','用餐座位需求'),options:[['2','2 席','2 席'],['4','4 席','4 席'],['6+','6 席以上','6 席以上']]},
  {key:'storage',label:tr('Storage needs','收纳需求','收納需求'),options:[['Low','少量','少量'],['Medium','适中','適中'],['High','大量','大量']]},
  {key:'accessibility',label:tr('Circulation needs','通行需求','通行需求'),options:[['Standard','一般','一般'],['Step-free','无障碍／婴儿车','無障礙／嬰兒車'],['Wide paths','宽通道','闊通道']]},
  {key:'style',label:tr('Preferred atmosphere','风格偏好','風格偏好'),options:[['Warm natural','温暖自然','溫暖自然'],['Minimal','简约','簡約'],['Colourful','丰富色彩','豐富色彩']]},
  {key:'priority',label:tr('Main trade-off','最重要的取舍','最重要的取捨'),options:[['Reuse first','优先复用','優先重用'],['Social space','聚会空间','聚會空間'],['Work space','办公空间','辦公空間']]},
 ];
 return <fieldset className="brief-form"><legend>{tr('Your everyday, in a little more detail','详细生活需求与预算','詳細生活需求與預算')}</legend><p>{tr('Your priorities, work needs and budget rank the demo layouts. Other answers stay in your saved brief for planning.','优先事项、办公需求和预算用于推荐方案；其他答案保存在需求档案中供规划参考。','優先事項、辦公需求和預算用於推薦方案；其他答案儲存在需求檔案中供規劃參考。')}</p><div className="brief-grid">{fields.map(f=><label key={f.key}>{f.label}<select value={value[f.key]} onChange={e=>onChange({...value,[f.key]:e.target.value})}>{f.options.map(([en,cn,hk])=><option key={en} value={en}>{tr(en,cn,hk)}</option>)}</select></label>)}<label>{tr('New furniture budget (HK$)','新家具预算（港币）','新傢俬預算（港幣）')}<input type="number" min={0} max={1000000} step={100} value={value.budget} onChange={e=>onChange({...value,budget:Math.max(0,Math.min(1000000,Number(e.target.value)||0))})}/></label><label>{tr('Target move date (optional)','预计搬家日期（选填）','預計搬屋日期（選填）')}<input type="date" value={value.moveDate} onChange={e=>onChange({...value,moveDate:e.target.value})}/></label></div><small>{tr('Budget excludes delivery and installation. Demo plans are not accessibility-certified.','预算不含配送与安装。演示方案未经无障碍认证。','預算不含配送與安裝。示範方案未經無障礙認證。')}</small></fieldset>;
}
