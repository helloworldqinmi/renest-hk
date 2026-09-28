'use client';

import Image from 'next/image';
import {useEffect,useRef,useState} from 'react';
import {FileImage,ScanLine,Upload,Check} from 'lucide-react';
import {useLocale} from '@/components/locale-provider';
import {defaultHomeInput,type HomeInputChoice} from '@/lib/home-input';

export function NewHomeInput({source,onSource,choice,onChoice}:{source:'template'|'scan';onSource:(value:'template'|'scan')=>void;choice:HomeInputChoice;onChoice:(value:HomeInputChoice)=>void}){
 const {tr}=useLocale();const [preview,setPreview]=useState<string|null>(null),[error,setError]=useState('');
 const [fileReady,setFileReady]=useState(false);const request=useRef(0);
 useEffect(()=>()=>{request.current++;},[]);
 useEffect(()=>()=>{if(preview)URL.revokeObjectURL(preview);},[preview]);
 function select(next:HomeInputChoice){request.current++;setError('');setFileReady(false);setPreview(null);onChoice(next);}
 async function upload(file:File|undefined,kind:'floorplan-upload'|'scan-upload'){
  if(!file)return;const serial=++request.current;setError('');setFileReady(false);setPreview(null);onChoice({method:kind});
  if(file.size>20*1024*1024){setError(tr('Choose a file smaller than 20 MB.','请选择小于 20 MB 的文件。','請選擇小於 20 MB 的檔案。'));return;}
  try{
   if(kind==='floorplan-upload'){
    if(!['image/png','image/jpeg','image/webp'].includes(file.type))throw Error('image');
    const bitmap=await createImageBitmap(file);bitmap.close();
    if(serial!==request.current)return;setPreview(URL.createObjectURL(file));
   }else if(file.name.toLowerCase().endsWith('.glb')){
    const header=new DataView(await file.slice(0,12).arrayBuffer());if(header.byteLength<12||header.getUint32(0,true)!==0x46546c67||header.getUint32(4,true)!==2||header.getUint32(8,true)!==file.size)throw Error('scan');
   }else if(file.name.toLowerCase().endsWith('.json')){
    const data=JSON.parse(await file.text());if(!data||typeof data!=='object'||!(Array.isArray(data.walls)||data.dimensions&&Number.isFinite(data.dimensions.width)&&Number.isFinite(data.dimensions.depth)&&data.dimensions.width>0&&data.dimensions.depth>0))throw Error('scan');
   }else throw Error('scan');
   if(serial!==request.current)return;setFileReady(true);onChoice({method:kind,fileName:file.name});
  }catch{if(serial!==request.current)return;setError(kind==='floorplan-upload'?tr('This image could not be opened. Choose a valid PNG, JPEG or WebP.','无法打开图片，请选择有效的 PNG、JPEG 或 WebP。','無法開啟圖片，請選擇有效的 PNG、JPEG 或 WebP。'):tr('Choose a valid GLB 2.0 model or a RoomPlan-style JSON export.','请选择有效的 GLB 2.0 模型或 RoomPlan 格式 JSON 文件。','請選擇有效的 GLB 2.0 模型或 RoomPlan 格式 JSON 檔案。'));}
 }
 const uploading=choice.method==='floorplan-upload'||choice.method==='scan-upload';
 return <section className="new-home-input">
  <h3>{tr('How will you bring your new home in?','你想如何建立新家模型？','你想如何建立新居模型？')}</h3>
  <div className="home-methods" aria-label={tr('New home input method','新家输入方式','新居輸入方式')}>
   <button aria-pressed={source==='template'} onClick={()=>{onSource('template');select(defaultHomeInput);}}><FileImage size={22}/><b>{tr('Floor plan → 3D','平面图 → 3D','平面圖 → 3D')}</b><span>{tr('Upload a plan or choose from our library','上传平面图，或从户型图库选择','上傳平面圖，或從戶型圖庫選擇')}</span></button>
   <button aria-pressed={source==='scan'} onClick={()=>{onSource('scan');select({method:'scan-demo'});}}><ScanLine size={22}/><b>{tr('Use my own scan','使用自己的扫描','使用自己的掃描')}</b><span>{tr('Capture your home or import a scan','扫描新家，或导入已有扫描','掃描新居，或匯入已有掃描')}</span></button>
  </div>
  {source==='template'?<>
   <div className="feature-actions"><button aria-pressed={choice.method==='library'} onClick={()=>select(defaultHomeInput)}>{tr('Northern Metropolis plan library','北部都会区户型图库','北部都會區戶型圖庫')}</button><button aria-pressed={choice.method==='floorplan-upload'} onClick={()=>select({method:'floorplan-upload'})}>{tr('Upload my floor plan','上传自己的平面图','上傳自己的平面圖')}</button></div>
   {choice.method==='library'?<div className="plan-library"><button aria-pressed="true" onClick={()=>select(defaultHomeInput)}><div className="plan-reference"><Image src="/plans/northern-demo-a.png" alt={tr('The original floor plan used to build the current demo apartment','当前 demo 户型对应的原始平面图','目前 demo 戶型對應的原始平面圖')} fill sizes="(max-width:740px) 90vw, 400px"/></div><span><Check size={15}/>{tr('01 · Two-bedroom / current demo','01 · 两房户型／当前 Demo','01 · 兩房戶型／目前 Demo')}</span><b>45 m² / 484 ft²</b></button><p>{tr('The first library plan is the exact plan behind this demo’s 3D home and all three arrangements. This initial collection contains one illustrative plan, not an official development drawing.','图库第一张就是当前 Demo 的原始户型，对应同一个 3D 新家和三套布置。当前首批收录一张示意图，并非真实楼盘官方图纸。','圖庫第一張就是目前 Demo 的原始戶型，對應同一個 3D 新居和三套佈置。目前首批收錄一張示意圖，並非真實樓盤官方圖則。')}</p></div>:null}
  </>:<><div className="feature-actions"><button aria-pressed={choice.method==='scan-demo'} onClick={()=>select({method:'scan-demo'})}>{tr('Try phone scanning','体验手机扫描','體驗手機掃描')}</button><button aria-pressed={choice.method==='scan-upload'} onClick={()=>select({method:'scan-upload'})}>{tr('Import my scan','导入自己的扫描','匯入自己的掃描')}</button></div>{choice.method==='scan-demo'&&<div className="scan-method-note"><ScanLine size={28}/><h4>{tr('Walk through your new home','走一遍你的新家','走一遍你的新居')}</h4><p>{tr('The intended workflow uses your phone’s scan. Here you can preview that experience with the existing demo apartment; this browser does not access a live LiDAR sensor.','实际流程使用手机扫描你的新家。本轮可用现有户型预览扫描体验；此浏览器演示不会读取实时 LiDAR 传感器。','實際流程使用手機掃描你的新居。本輪可用現有戶型預覽掃描體驗；此瀏覽器示範不會讀取即時 LiDAR 感應器。')}</p></div>}</>}
  {uploading&&<div className="home-upload"><label><Upload size={21}/><b>{choice.method==='floorplan-upload'?tr('Choose your floor-plan image','选择你的平面图图片','選擇你的平面圖圖片'):tr('Choose your scan export','选择你的扫描文件','選擇你的掃描檔案')}</b><span>{choice.method==='floorplan-upload'?'PNG / JPEG / WebP · ≤20 MB':'GLB 2.0 / RoomPlan JSON · ≤20 MB'}</span><input key={choice.method} type="file" accept={choice.method==='floorplan-upload'?'image/png,image/jpeg,image/webp':'.glb,.json'} onChange={e=>void upload(e.target.files?.[0],choice.method as 'floorplan-upload'|'scan-upload')}/></label>{preview&&<div className="uploaded-plan"><Image src={preview} alt={tr('Your uploaded floor plan','你上传的平面图','你上傳的平面圖')} width={640} height={480} unoptimized/></div>}{choice.fileName&&<p><b>{choice.fileName}</b><br/>{fileReady?tr('File selected locally.','文件已在本地选择。','檔案已在本機選取。'):tr('Select this file again to preview it; source files are not stored in saved arrangements.','请重新选择文件以查看；保存布局不包含原始文件。','請重新選擇檔案以查看；儲存佈局不包含原始檔案。')}</p>}<p className="demo-source-note">{tr('Demo preview only: your file is not converted into geometry or sent to a server. Continuing previews the existing 45 m² / 484 ft² sample home, not a reconstruction of this file.','仅作流程演示：文件不会转成几何模型，也不会上传服务器。继续后预览的是现有 45 平方米／484 平方呎示例户型，并非此文件的重建结果。','僅作流程示範：檔案不會轉成幾何模型，也不會上傳伺服器。繼續後預覽的是現有 45 平方米／484 平方呎範例戶型，並非此檔案的重建結果。')}</p></div>}
  {error&&<p role="alert" className="input-error">{error}</p>}
 </section>;
}
