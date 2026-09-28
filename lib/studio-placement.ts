import {studioInventory,type Placement} from './studio-data';
export function footprint(p:Placement){const item=studioInventory.find(i=>i.id===p.id)!;const r=p.rotation*Math.PI/180;return {w:Math.abs(Math.cos(r))*item.dimensions[0]+Math.abs(Math.sin(r))*item.dimensions[1],d:Math.abs(Math.sin(r))*item.dimensions[0]+Math.abs(Math.cos(r))*item.dimensions[1]};}
// Axis-aligned wall segments and fixed kitchen/bath areas from generate.mjs.
const obstacles=[ [0,0,3.65,.72],[2.9,.48,3.48,1.05],[0,1.34,2.44,1.46],[3.26,1.34,3.65,1.46],[3.59,.48,3.71,1.4],[4.24,.48,4.36,2.37],[4.24,3.19,8.4,3.31],[5.44,3.25,5.56,3.48],[5.44,4.32,5.56,6.15],[3.42,4.3,4.48,4.42],[5.28,4.3,5.5,4.42],[3.42,4.36,3.54,6.15],[3.54,4.42,5.42,6.09] ];
export function placementIssue(p:Placement,others:Placement[]):'bounds'|'wall'|'furniture'|null{
 const {w,d}=footprint(p),x1=p.x-w/2,x2=p.x+w/2,z1=p.z-d/2,z2=p.z+d/2;
 if(x1<.06||x2>8.34||z1<(x2>3.65?.54:.06)||z2>6.09)return 'bounds';
 const overlap=(a:number,b:number,c:number,d:number)=>x1<c-.015&&x2>a+.015&&z1<d-.015&&z2>b+.015;
 if(obstacles.some(v=>overlap(v[0],v[1],v[2],v[3])))return 'wall';
 for(const other of others){if(other.id===p.id)continue;const f=footprint(other);if(overlap(other.x-f.w/2,other.z-f.d/2,other.x+f.w/2,other.z+f.d/2))return 'furniture';}return null;
}
