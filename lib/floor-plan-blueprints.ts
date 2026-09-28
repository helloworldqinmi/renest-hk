export type PlanWall={a:[number,number];b:[number,number];door?:[number,number];window?:boolean;exterior?:boolean};
export type PlanRoom={at:[number,number];name:[string,string,string]};
export type PlanExample={id:string;title:[string,string,string];area:number;width:number;depth:number;outline:[number,number][];walls:PlanWall[];rooms:PlanRoom[];enabled:boolean};
const wall=(x1:number,z1:number,x2:number,z2:number,extra:Partial<PlanWall>={}):PlanWall=>({a:[x1,z1],b:[x2,z2],...extra});

// These 17 wall segments intentionally match architecture(root, false) in
// v2-home-models/src/generate.mjs. No furniture is part of a blueprint.
export const demoBlueprint:PlanExample={
 id:'northern-demo-a',title:['Familiar two-bedroom','经典两房','經典兩房'],area:45,width:8.4,depth:6.15,enabled:true,
 outline:[[0,0],[3.65,0],[3.65,.48],[8.4,.48],[8.4,6.15],[0,6.15]],
 walls:[wall(0,0,3.65,0,{window:true,exterior:true}),wall(3.65,0,3.65,.48),wall(3.65,.48,4.3,.48,{window:true}),wall(4.3,.48,8.4,.48,{window:true,exterior:true}),wall(0,0,0,6.15),wall(0,6.15,1.4,6.15,{door:[.73,.86]}),wall(1.4,6.15,3.48,6.15),wall(3.48,6.15,5.5,6.15,{window:true}),wall(5.5,6.15,8.4,6.15,{window:true}),wall(8.4,.48,8.4,6.15),wall(0,1.4,3.65,1.4,{door:[2.85,.82]}),wall(3.65,.48,3.65,1.4),wall(4.3,.48,4.3,3.25,{door:[2.3,.82]}),wall(4.3,3.25,8.4,3.25),wall(5.5,3.25,5.5,6.15,{door:[.65,.84]}),wall(3.48,4.36,5.5,4.36,{door:[1.4,.8]}),wall(3.48,4.36,3.48,6.15)],
 rooms:[{at:[1.6,.72],name:['KITCHEN','厨房','廚房']},{at:[2,3.25],name:['LIVING / DINING','客厅／餐厅','客廳／飯廳']},{at:[6.4,1.87],name:['BEDROOM 1','卧室一','睡房一']},{at:[6.95,4.75],name:['BEDROOM 2','卧室二','睡房二']},{at:[4.45,5.27],name:['BATH','浴室','浴室']},{at:[1,5.47],name:['ENTRY','入口','入口']}],
};
export const floorPlanExamples:PlanExample[]=[demoBlueprint,{
 id:'compact-one-bedroom',title:['Compact one-bedroom','紧凑一房','精巧一房'],area:32,width:6.4,depth:5.4,enabled:false,
 outline:[[0,0],[6.4,0],[6.4,5.4],[0,5.4]],
 walls:[wall(0,0,3.7,0,{window:true,exterior:true}),wall(3.7,0,6.4,0,{window:true,exterior:true}),wall(6.4,0,6.4,5.4),wall(6.4,5.4,1.5,5.4),wall(0,5.4,1.5,5.4,{door:[.8,.85]}),wall(0,0,0,5.4),wall(3.7,0,3.7,3.4,{door:[2.65,.8]}),wall(3.7,3.4,6.4,3.4),wall(4.7,3.4,4.7,5.4,{door:[1.15,.75]}),wall(0,1.5,2.35,1.5,{door:[1.65,.9]})],
 rooms:[{at:[1.12,.76],name:['KITCHEN','厨房','廚房']},{at:[1.95,3.25],name:['LIVING / DINING','客厅／餐厅','客廳／飯廳']},{at:[5.05,1.7],name:['BEDROOM','卧室','睡房']},{at:[5.55,4.4],name:['BATH','浴室','浴室']}],
},{
 id:'family-three-bedroom',title:['Flexible three-bedroom','灵活三房','靈活三房'],area:62,width:9.6,depth:7.4,enabled:false,
 outline:[[0,0],[9.6,0],[9.6,7.4],[0,7.4]],
 walls:[wall(0,0,4.7,0,{window:true,exterior:true}),wall(4.7,0,7.1,0,{window:true,exterior:true}),wall(7.1,0,9.6,0,{window:true,exterior:true}),wall(9.6,0,9.6,7.4),wall(9.6,7.4,4.7,7.4,{window:true}),wall(4.7,7.4,1.5,7.4),wall(0,7.4,1.5,7.4,{door:[.8,.9]}),wall(0,0,0,7.4),wall(0,1.8,3.2,1.8,{door:[2.5,.9]}),wall(3.2,0,3.2,1.8),wall(4.7,0,4.7,3.3,{door:[2.6,.85]}),wall(7.1,0,7.1,3.3),wall(4.7,3.3,7.1,3.3),wall(7.1,3.3,9.6,3.3,{door:[.65,.85]}),wall(6.9,4,9.6,4,{door:[.75,.85]}),wall(6.9,4,6.9,7.4),wall(4.7,5.3,6.9,5.3,{door:[.75,.8]}),wall(4.7,5.3,4.7,7.4)],
 rooms:[{at:[1.6,.9],name:['KITCHEN','厨房','廚房']},{at:[2.35,4.05],name:['LIVING / DINING','客厅／餐厅','客廳／飯廳']},{at:[5.9,1.65],name:['BEDROOM 1','卧室一','睡房一']},{at:[8.35,1.65],name:['BEDROOM 2','卧室二','睡房二']},{at:[8.25,5.8],name:['BEDROOM 3','卧室三','睡房三']},{at:[5.8,6.35],name:['BATH','浴室','浴室']}],
}];

export function constructionFrame(progress:number){
 const clamp=(v:number)=>Math.max(0,Math.min(1,v));const ease=(v:number)=>{const p=clamp(v);return p*p*(3-2*p);};
 const p=clamp(progress);
 return {trace:clamp(p/.22),tilt:ease((p-.16)/.56),settle:ease((p-.84)/.16),labels:1-ease((p-.2)/.25),rise:(index:number,count:number)=>ease((p-.22-index/Math.max(1,count)*.2)/.43)};
}
