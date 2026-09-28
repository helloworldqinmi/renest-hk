import type {LivingBrief} from './living-brief';
import {studioLayouts,studioInventory,recommendLayout,type Placement,type LayoutId} from './studio-data';
import {findFoldingProduct} from './folding-products';
import {trySecondhand} from './secondhand-layout';

export type ProfileNotice='beds'|'overnight'|'must-keep'|'workstations'|'work-room'|'dining'|'access'|'service-budget'|'unknown-budget'|'hobby-space'|'details'|'mounting'|'budget-trimmed'|'secondhand';
export type ProfilePlan={id:LayoutId;placements:Placement[];cost:number;issues:ProfileNotice[];changes:ProfileNotice[];score:number};
const itemPrice=(p:Placement)=>findFoldingProduct(studioInventory.find(i=>i.id===p.id)?.productSlug??'')?.price??0;
export const placementCost=(placements:Placement[])=>placements.filter(p=>p.origin==='new').reduce((sum,p)=>sum+itemPrice(p),0);
export function furnitureAllowance(brief:LivingBrief):number|null{
 const a=brief.profile?.answers;if(!a)return brief.budget;
 if(a.purchaseTiming==='later'||a.budgetRange==='zero')return 0;
 if(!a.budgetRange||a.budgetRange==='unknown')return null;
 return Math.max(0,brief.budget-(a.includesFees==='yes'?Number(a.serviceReserve??0):0));
}
export function profileNotices(brief:LivingBrief,placements:Placement[]):ProfileNotice[]{
 const p=brief.profile;if(!p)return [];const a=p.answers,ids=new Set(placements.map(v=>v.id)),issues:ProfileNotice[]=[];
 const double=ids.has('F09')?1:0,single=ids.has('F13')?1:0,people=a.household==='4+'?4:Number(a.household)||0;
 if(double<(Number(a.doubleBeds)||0)||single<(Number(a.singleBeds)||0)||double*2+single<people)issues.push('beds');
 if(['sometimes','often','unknown'].includes(a.overnight)&&double*2+single<=people)issues.push('overnight');
 if(Object.entries(p.furniture).some(([id,v])=>v==='must'&&!ids.has(id)))issues.push('must-keep');
 const desks=placements.filter(v=>studioInventory.find(i=>i.id===v.id)?.type.match(/desk/i));
 const needed=a.workFrequency==='never'?0:a.workers==='3+'?3:Number(a.workers)||0;
 if(desks.length<needed)issues.push('workstations');
 if(needed&&((a.deskRoom==='living'&&!desks.some(v=>v.x<4.3))||(a.deskRoom==='study'&&ids.has('F13'))))issues.push('work-room');
 const seats=placements.filter(v=>['F05','F06','F07','F08'].includes(v.id)||['N04','N05'].includes(v.id)&&v.x<4.3).length;
 const diningTable=ids.has('F04')||ids.has('N02');
 const diners=a.diners==='3-4'?4:a.diners==='5+'?5:Number(a.diners)||0;
 const guests=['sometimes','often'].includes(a.hosting)?a.hostingSeats==='6+'?6:Number(a.hostingSeats)||0:0;
 if(Math.max(diners,guests)>0&&(!diningTable||seats<Math.max(diners,guests)))issues.push('dining');
 if(p.tags.access?.some(v=>v!=='none'))issues.push('access');
 if(a.includesFees==='yes'&&!a.serviceReserve)issues.push('service-budget');
 if(a.budgetRange==='unknown')issues.push('unknown-budget');
 if(Object.values(p.hobbyAreas).reduce((n,v)=>n+v,0)>45&&a.shareHobbySpace!=='yes')issues.push('hobby-space');
 if((p.tags.hobbies?.length??0)||(p.tags.pets?.some(v=>v!=='none'))||p.completed.includes('style'))issues.push('details');
 return issues;
}
export function planForProfile(brief:LivingBrief,selected:string[],habits:string[]=[],note=''):{plans:ProfilePlan[];recommended:LayoutId;allowance:number|null}{
 const p=brief.profile,a=p?.answers??{},allowance=furnitureAllowance(brief);
 const effective=[...new Set([...selected,...Object.entries(p?.furniture??{}).filter(([,v])=>v==='must').map(([id])=>id)])].filter(id=>p?.furniture[id]!=='sell');
 const legacyPreferred=brief.priority==='Work space'||brief.work==='Two people'?'c':brief.priority==='Social space'?'b':recommendLayout(habits,note);
 const profilePreferred=p?(a.workFrequency!=='never'&&['2','3+'].includes(a.workers)?'c':a.hosting==='often'?'b':'a'):legacyPreferred;
 const preferred=a.priority==='work'?'c':['host','open'].includes(a.priority)?'b':['reuse','budget','storage'].includes(a.priority)?'a':profilePreferred;
 const plans=studioLayouts.map(preset=>{
  let placements=preset.placements.filter(v=>v.origin==='new'||effective.includes(v.id)).map(v=>({...v}));const changes:ProfileNotice[]=[];
  const usedAllowed=['allow','prefer'].includes(a.secondhand),mountAllowed=!p||a.drilling==='yes';
  if(p&&usedAllowed){for(const id of ['N06','N05']){const item=studioInventory.find(i=>i.id===id)!;if(placements.some(v=>v.id===item.replacesId)&&(a.secondhand==='prefer'||(!mountAllowed&&item.replacesId==='N03'))){const result=trySecondhand(id,preset.id,{[preset.id]:placements},effective);if(result){placements=result.placements;if(!changes.includes('secondhand'))changes.push('secondhand');}}}}
  if(!mountAllowed&&placements.some(v=>v.id==='N03')){placements=placements.filter(v=>v.id!=='N03');changes.push('mounting');}
  if(allowance!==null&&placementCost(placements)>allowance){
   const purchases=placements.filter(v=>v.origin==='new').sort((x,y)=>{
    const importance=(v:Placement)=>/desk/i.test(studioInventory.find(i=>i.id===v.id)!.type)?3:v.id==='N02'?2:1;return importance(y)-importance(x)||itemPrice(x)-itemPrice(y);
   });let remaining=allowance;const retained=new Set<string>();for(const item of purchases)if(itemPrice(item)<=remaining){retained.add(item.id);remaining-=itemPrice(item);}
   placements=placements.filter(v=>v.origin!=='new'||retained.has(v.id));changes.push('budget-trimmed');
  }
  const issues=profileNotices(brief,placements),cost=placementCost(placements);
  let score=(preset.id===preferred?30:0)+placements.filter(v=>v.origin==='existing').length;
  for(const issue of issues)score-=issue==='must-keep'?1000:issue==='beds'?250:issue==='workstations'||issue==='dining'?150:issue==='overnight'?65:issue==='work-room'?35:0;
  for(const priority of p?.tags.secondary??[]){if(priority==='work'&&preset.id==='c')score+=5;if(['open','host'].includes(priority)&&preset.id==='b')score+=5;if(['reuse','budget'].includes(priority)&&preset.id==='a')score+=5;}
  if(a.priority==='budget')score-=cost/100;
  const finalChanges=changes.filter(code=>code!=='secondhand'||placements.some(v=>studioInventory.find(i=>i.id===v.id)?.secondhand));
  return {id:preset.id,placements,cost,issues,changes:finalChanges,score};
 });
 return {plans,recommended:[...plans].sort((a,b)=>b.score-a.score||a.cost-b.cost)[0].id,allowance};
}
