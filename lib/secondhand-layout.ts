import {studioLayouts,studioInventory,type LayoutEdits,type LayoutId,type Placement} from './studio-data';
import {placementIssue} from './studio-placement';

export function trySecondhand(id:string,layout:LayoutId,edits:LayoutEdits,selected:string[]):{layout:LayoutId;placements:Placement[]}|null{
 const item=studioInventory.find(v=>v.id===id);if(!item?.secondhand||!item.replacesId)return null;
 const replaces=item.replacesId;
 const preferred=studioLayouts.find(v=>v.id===layout)!;
 const preset=preferred.newIds.includes(replaces)?preferred:studioLayouts.find(v=>v.newIds.includes(replaces))!;
 const current=(edits[preset.id]??preset.placements).filter(p=>p.origin==='new'||selected.includes(p.id));
 if(current.some(p=>p.id===id))return {layout:preset.id,placements:current};
 const source=current.find(p=>p.id===item.replacesId)??preset.placements.find(p=>p.id===item.replacesId)!;
 const alternative={...source,id,origin:'new'};
 const placements=[...current.filter(p=>p.id!==item.replacesId),alternative];
 if(placementIssue(alternative,placements))return null;
 return {layout:preset.id,placements};
}
