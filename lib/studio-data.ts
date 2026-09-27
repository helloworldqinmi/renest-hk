import furnitureData from '@/v2-home-models/data/furniture.json';
import layoutData from '@/v2-home-models/data/layouts.json';
import { findFoldingProduct } from './folding-products';

export type LayoutId = 'a' | 'b' | 'c';
export type StudioPhase = 'old-ready' | 'old-scan' | 'inventory' | 'new-ready' | 'new-scan' | 'empty' | 'preferences' | 'generating' | 'results' | 'summary';
export type Placement = { id: string; x: number; z: number; rotation: number; origin: string };
export type StudioItem = { id: string; name: string; type: string; dimensions: number[]; origin: string; productSlug?: string; room: string };
const names: Record<string,string>={F01:'Linen sofa',F02:'Oak coffee table',F03:'TV & media console',F04:'Oak dining table',F05:'Dining chair 01',F06:'Dining chair 02',F07:'Dining chair 03',F08:'Dining chair 04',F09:'Double bed',F10:'Bedroom wardrobe',F11:'Bedside table 01',F12:'Bedside table 02',F13:'Single bed',F14:'Study wardrobe',F15:'Oak writing desk',F16:'Desk chair',F17:'Entry console',F18:'Brass floor lamp',N01:'Drop-leaf kitchen cart',N02:'Drop-leaf dining table',N03:'Wall-mounted folding desk',N04:'Convertible step chair'};
export const studioInventory: StudioItem[]=furnitureData.map(d=>({...d,name:names[d.id],room: d.id>='F09'&&d.id<='F12'?'Main bedroom':d.id>='F13'&&d.id<='F16'?'Study / bedroom 2':d.id==='F17'?'Entry':'Living & dining'}));
export const existingItems=studioInventory.filter(i=>i.origin==='existing');
export const allExistingIds=existingItems.map(i=>i.id);
export const oldPlacements=layoutData[0].placements as Placement[];
export const studioLayouts = (['a','b','c'] as const).map((id,index)=>({
 id,letter:id.toUpperCase(),name:['Familiar comforts','Room to gather','A place to focus'][index],
 subtitle:['Keep your everyday rituals.','Open up to good company.','Two workspaces. One home.'][index],
 description:['Your sofa and dining set settle into a familiar rhythm. A folding kitchen cart adds a little more prep space.','Turn the living room toward conversation. A drop-leaf table makes dinner for four feel effortless, then folds away.','Your original desk moves into the living area. A fold-away desk in the second bedroom creates a quieter place to focus.'][index],
 placements:layoutData[index+1].placements as Placement[],newIds:layoutData[index+1].newIds,stored:layoutData[index+1].stored,
 cost:layoutData[index+1].newIds.reduce((sum,id)=>sum+(findFoldingProduct(studioInventory.find(i=>i.id===id)?.productSlug??'')?.price??0),0),
}));
export const habits=[{id:'reuse',title:'Keep what I love',detail:'Bring as much as possible'},{id:'host',title:'Friends over for dinner',detail:'A more sociable living space'},{id:'work',title:'Work from home',detail:'A dedicated second workspace'},{id:'open',title:'Room to move',detail:'Fold things away after use'}];
export function recommendLayout(selected:string[],note:string):LayoutId{
 if(/work|office|study|办公|工作|学习/i.test(note))return 'c';
 if(/host|friend|dinner|聚|朋友|用餐/i.test(note))return 'b';
 if(selected.includes('work'))return 'c';
 if(selected.includes('host')||selected.includes('open'))return 'b';
 return 'a';
}
export function retainedFor(id:LayoutId,selected:string[]){return studioLayouts.find(l=>l.id===id)!.placements.filter(p=>p.origin==='existing'&&selected.includes(p.id));}
export const STUDIO_SAVE_KEY='renest-spatial-plan-v2';
export const STUDIO_SESSION_KEY='renest-spatial-session-v2';
export type SavedStudioPlan={version:2;phase:StudioPhase;selected:string[];habits:string[];note:string;layout:LayoutId;savedAt?:string};
export function parseStudioPlan(raw:string|null):SavedStudioPlan|null{
 try{const v=JSON.parse(raw??'null');if(v?.version!==2||!['a','b','c'].includes(v.layout)||!Array.isArray(v.selected)||!Array.isArray(v.habits))return null;return {version:2,phase:['inventory','new-ready','empty','preferences','results','summary'].includes(v.phase)?v.phase:'old-ready',layout:v.layout,selected:v.selected.filter((id:unknown)=>typeof id==='string'&&allExistingIds.includes(id)),habits:v.habits.filter((id:unknown)=>habits.some(h=>h.id===id)),note:typeof v.note==='string'?v.note.slice(0,360):'',savedAt:typeof v.savedAt==='string'?v.savedAt:undefined};}catch{return null;}
}
