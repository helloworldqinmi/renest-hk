const clamp=(n:number)=>Math.max(0,Math.min(1,n));
export const smoothMotion=(n:number)=>{const t=clamp(n);return t*t*t*(t*(t*6-15)+10);};

/** Ordered single-layer slots, in truck-local metres; cargo never shares a footprint. */
export function cargoSlot(index:number){return {x:-1.08+(index%6)*.25,y:.482,z:-.3+Math.floor(index/6)*.3};}
export function cargoScale(dimensions:readonly number[]){return Math.min(.1,.147/Math.max(dimensions[0],dimensions[1]),.8/dimensions[2]);}
export function driveProgress(progress:number){return smoothMotion((progress-.37)/.29);}

/** Lift clear, travel above obstructions, then lower vertically. */
export function overheadTransfer(from:readonly number[],to:readonly number[],progress:number,clearance=1.9){
 const t=clamp(progress),height=Math.max(clearance,from[1],to[1]);
 if(t<.25)return [from[0],from[1]+(height-from[1])*smoothMotion(t/.25),from[2]];
 if(t<.75){const u=smoothMotion((t-.25)/.5);return [from[0]+(to[0]-from[0])*u,height,from[2]+(to[2]-from[2])*u];}
 return [to[0],height+(to[1]-height)*smoothMotion((t-.75)/.25),to[2]];
}

export function tailgateOpen(progress:number){return progress<.37?1-smoothMotion((progress-.345)/.025):smoothMotion((progress-.66)/.035);}
