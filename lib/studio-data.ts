import {stagingArea} from './studio-workspace';
import {parseHomeInput,type HomeInputChoice} from './home-input';
import furnitureData from '@/v2-home-models/data/furniture.json';
import layoutData from '@/v2-home-models/data/layouts.json';
import { findFoldingProduct } from './folding-products';
import { parseBrief, type LivingBrief } from './living-brief';

export type LayoutId = 'a' | 'b' | 'c';
export type StudioPhase = 'old-ready' | 'old-scan' | 'inventory' | 'new-ready' | 'new-scan' | 'new-convert' | 'empty' | 'preferences' | 'generating' | 'results' | 'summary';
export type Placement = { id: string; x: number; z: number; rotation: number; origin: string };
export type StudioItem = { id: string; name: string; type: string; dimensions: number[]; origin: string; productSlug?: string; room: string;secondhand?:boolean;modelSourceId?:string;replacesId?:string };
const names: Record<string,string>={F01:'Linen sofa',F02:'Oak coffee table',F03:'TV & media console',F04:'Oak dining table',F05:'Dining chair 01',F06:'Dining chair 02',F07:'Dining chair 03',F08:'Dining chair 04',F09:'Double bed',F10:'Bedroom wardrobe',F11:'Bedside table 01',F12:'Bedside table 02',F13:'Single bed',F14:'Study wardrobe',F15:'Oak writing desk',F16:'Desk chair',F17:'Entry console',F18:'Brass floor lamp',N01:'Drop-leaf kitchen cart',N02:'Drop-leaf dining table',N03:'Wall-mounted folding desk',N04:'Convertible step chair'};
export const studioInventory: StudioItem[]=furnitureData.map(d=>({...d,name:names[d.id],room: d.id>='F09'&&d.id<='F12'?'Main bedroom':d.id>='F13'&&d.id<='F16'?'Study / bedroom 2':d.id==='F17'?'Entry':'Living & dining'}));
studioInventory.push(
 {id:'N05',name:'Pre-owned Desk Chair',type:'chair',dimensions:[.44,.45,.87],origin:'new',productSlug:'preowned-desk-chair',room:'Study / bedroom 2',secondhand:true,modelSourceId:'F16',replacesId:'N04'},
 {id:'N06',name:'Pre-owned Oak Writing Desk',type:'desk',dimensions:[1.15,.52,.77],origin:'new',productSlug:'preowned-oak-desk',room:'Study / bedroom 2',secondhand:true,modelSourceId:'F15',replacesId:'N03'}
);
export const existingItems=studioInventory.filter(i=>i.origin==='existing');
export const allExistingIds=existingItems.map(i=>i.id);
export const oldPlacements=layoutData[0].placements as Placement[];
// Deliberate demo trade-offs: family keeps everything; gathering clears the
// coffee table and replaces dining; focus trades a second bed for an office.
function curatedPlacements(index:number):Placement[]{
 const omitted=index===1?['F02','F04']:index===2?['F13','F07','F08']:[];
 return (layoutData[index+1].placements as Placement[]).filter(p=>!omitted.includes(p.id)).map(p=>{
  if(index===2){const moves:Record<string,[number,number,number]>={F15:[7.12,4.15,0],F16:[7.12,4.72,180],N03:[5.88,5.38,90],N04:[6.45,5.38,-90],F04:[2.15,5.2,0],F05:[1.82,4.58,0],F06:[2.49,4.58,0]};if(moves[p.id]){const [x,z,rotation]=moves[p.id];return {...p,x,z,rotation};}}
  return {...p};
 });
}
export const studioLayouts = (['a','b','c'] as const).map((id,index)=>({
 id,letter:id.toUpperCase(),name:['Familiar comforts','Room to gather','A place to focus'][index],
 subtitle:['Keep your everyday rituals.','Open up to good company.','Two workspaces. One home.'][index],
 description:['Your sofa and dining set settle into a familiar rhythm. A folding kitchen cart adds a little more prep space.','Turn the living room toward conversation. A drop-leaf table makes dinner for four feel effortless, then folds away.','The second bedroom becomes a shared office. Keep the main bed and two dining chairs; trade the spare bed for two workspaces.'][index],
 placements:curatedPlacements(index),newIds:layoutData[index+1].newIds,stored:index===1?['F02','F04']:index===2?['F13','F07','F08']:[],
 cost:layoutData[index+1].newIds.reduce((sum,id)=>sum+(findFoldingProduct(studioInventory.find(i=>i.id===id)?.productSlug??'')?.price??0),0),
}));
export const habits=[{id:'reuse',title:'Keep what I love',detail:'Bring as much as possible'},{id:'host',title:'Friends over for dinner',detail:'A more sociable living space'},{id:'work',title:'Work from home',detail:'A dedicated second workspace'},{id:'open',title:'Room to move',detail:'Fold things away after use'}];
export function recommendLayout(selected:string[],note:string):LayoutId{
 if(/work|office|study|wfh|办公|辦公|工作|学习|學習|书房|書房/i.test(note))return 'c';
 if(/host|friend|dinner|聚|朋友|用餐/i.test(note))return 'b';
 if(selected.includes('work'))return 'c';
 if(selected.includes('host')||selected.includes('open'))return 'b';
 return 'a';
}
export function retainedFor(id:LayoutId,selected:string[]){return studioLayouts.find(l=>l.id===id)!.placements.filter(p=>p.origin==='existing'&&selected.includes(p.id));}
export const STUDIO_SAVE_KEY='renest-spatial-plan-v2';
export const STUDIO_SESSION_KEY='renest-spatial-session-v2';
export type LayoutEdits=Partial<Record<LayoutId,Placement[]>>;
export type SavedStudioPlan={version:2;name?:string;phase:StudioPhase;selected:string[];habits:string[];note:string;layout:LayoutId;savedAt?:string;brief?:LivingBrief;edits?:LayoutEdits;homeSource?:'template'|'scan';homeInput?:HomeInputChoice};
export const STUDIO_HISTORY_KEY='renest-spatial-history-v1';
export function parseEdits(value:unknown):LayoutEdits{
 const result:LayoutEdits={};if(!value||typeof value!=='object')return result;
 for(const id of ['a','b','c'] as const){const entries=(value as Record<string,unknown>)[id];if(!Array.isArray(entries))continue;const seen=new Set<string>();result[id]=entries.filter(p=>p&&typeof p.id==='string'&&studioInventory.some(i=>i.id===p.id)&&!seen.has(p.id)&&[p.x,p.z,p.rotation].every(v=>typeof v==='number'&&Number.isFinite(v))&&p.x>=0&&p.x<=8.4&&p.z>=0&&p.z<=stagingArea.maxZ&&(seen.add(p.id),true)).map(p=>({id:p.id,x:p.x,z:p.z,rotation:p.rotation,origin:studioInventory.find(i=>i.id===p.id)!.origin}));}return result;
}
export function readPlanHistory():SavedStudioPlan[]{try{const raw=JSON.parse(localStorage.getItem(STUDIO_HISTORY_KEY)??'[]');const list=Array.isArray(raw)?raw.map(v=>parseStudioPlan(JSON.stringify(v))).filter((v):v is SavedStudioPlan=>!!v):[];const legacy=parseStudioPlan(localStorage.getItem(STUDIO_SAVE_KEY));return legacy&&!list.some(v=>v.savedAt===legacy.savedAt)?[legacy,...list].slice(0,20):list.slice(0,20);}catch{return [];}}
export function savePlanHistory(plan:SavedStudioPlan){const list=readPlanHistory();localStorage.setItem(STUDIO_HISTORY_KEY,JSON.stringify([plan,...list].slice(0,20)));localStorage.setItem(STUDIO_SAVE_KEY,JSON.stringify(plan));}
export function parseStudioPlan(raw:string|null):SavedStudioPlan|null{
 try{const v=JSON.parse(raw??'null');if(v?.version!==2||!['a','b','c'].includes(v.layout)||!Array.isArray(v.selected)||!Array.isArray(v.habits))return null;return {version:2,name:typeof v.name==='string'?v.name.trim().slice(0,60)||undefined:undefined,phase:['inventory','new-ready','empty','preferences','results','summary'].includes(v.phase)?v.phase:'old-ready',layout:v.layout,selected:v.selected.filter((id:unknown)=>typeof id==='string'&&allExistingIds.includes(id)),habits:v.habits.filter((id:unknown)=>habits.some(h=>h.id===id)),note:typeof v.note==='string'?v.note.slice(0,360):'',savedAt:typeof v.savedAt==='string'&&Number.isFinite(Date.parse(v.savedAt))?v.savedAt:undefined,brief:parseBrief(v.brief),edits:parseEdits(v.edits),homeSource:v.homeSource==='scan'?'scan':'template',homeInput:parseHomeInput(v.homeInput??{method:v.homeSource==='scan'?'scan-demo':'library'})};}catch{return null;}
}
