export type HomeInputChoice={method:'library'|'floorplan-upload'|'scan-upload'|'scan-demo';fileName?:string};
export const defaultHomeInput:HomeInputChoice={method:'library'};
export function parseHomeInput(value:unknown):HomeInputChoice{
 if(!value||typeof value!=='object')return defaultHomeInput;
 const v=value as Record<string,unknown>;
 if(!['library','floorplan-upload','scan-upload','scan-demo'].includes(v.method as string))return defaultHomeInput;
 return {method:v.method as HomeInputChoice['method'],fileName:typeof v.fileName==='string'?v.fileName.slice(0,255):undefined};
}
