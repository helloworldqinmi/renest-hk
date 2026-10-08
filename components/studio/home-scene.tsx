'use client';

import { useEffect, useRef, useState, type RefObject } from 'react';
import * as T from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { createIPhone, createMovingTruck, lidarPosition } from './scene-props';
import { batchStatic } from './scene-geometry';
import { studioInventory, allExistingIds, oldPlacements, studioLayouts, type LayoutId, type Placement } from '@/lib/studio-data';
import styles from './studio.module.css';
import { footprint, isStaged, placementIssue } from '@/lib/studio-placement';
import { stagingArea } from '@/lib/studio-workspace';
import { cargoSlot, cargoScale, driveProgress, overheadTransfer, smoothMotion, tailgateOpen } from '@/lib/migration-motion';
import { scanTimeline, revealedPointCount, furnitureCapture } from '@/lib/scan-timeline';
import {createSelectionHalo} from './selection-halo';
import { createSurfaceMaps, finishMaterial } from './scene-finish';
import { captureItemIndex } from './capture-mesh';
import { createCaptureDepth, createSpatialTopology, scanPointMaterial } from './spatial-effects';
import { createRenderBudget, renderPixelRatio } from './render-budget';
import { scanCameraFrame, smoothstep } from '@/lib/spatial-experience';
import { useLocale } from '@/components/locale-provider';

export type SceneMode='old'|'empty'|'layout'|'product'|'move'|'vignette';
export type SceneApi={capture:()=>void;reset:()=>void;debug:()=>{yaw:number;up:number[];calls:number;visibleIds:string[];mode:SceneMode}};
export type DragFeedback={id:string;state:'moving'|'staged'|'blocked'};
export type HomeSceneProps={stagingLabel?:string;onDragFeedback?:(feedback:DragFeedback|null)=>void;diyView?:'top'|'3d';placements?:Placement[];editable?:boolean;highlightNew?:boolean;onMove?:(id:string,x:number,z:number)=>void;mode:SceneMode;layout?:LayoutId;scan?:number;migrationProgress?:number;readyToScan?:boolean;selectedIds?:string[];selectedId?:string|null;view?:'orbit'|'top';lighting?:'day'|'evening';fullWalls?:boolean;highlight?:boolean;detectedFurniture?:boolean;furnitureOnly?:boolean;fold?:boolean;autoFold?:boolean;productId?:string;cinematic?:boolean;showcase?:boolean;reveal?:boolean;presentation?:'impact';paused?:boolean;motionPaused?:boolean;onInteract?:()=>void;replay?:number;apiRef?:RefObject<SceneApi|null>;onSelect?:(id:string)=>void;onReady?:(mode:SceneMode)=>void;onScanSamples?:(count:number)=>void};
type Transform={object:T.Object3D;from:T.Vector3;to:T.Vector3;fromYaw:number;toYaw:number;fromScale:number;show:boolean;delay:number};
const clamp=(n:number)=>Math.max(0,Math.min(1,n));
const ease=(n:number)=>1-Math.pow(1-clamp(n),3);
const materialList=(o:T.Mesh)=>(Array.isArray(o.material)?o.material:[o.material]) as T.MeshStandardMaterial[];

function pointCloud(root:T.Object3D,budget:number){
 root.updateMatrixWorld(true);
 const a=new T.Vector3(),b=new T.Vector3(),c=new T.Vector3(),edge=new T.Vector3(),cross=new T.Vector3();
 const surfaces:{mesh:T.Mesh;areas:Float64Array;area:number;weight:number;furniture:boolean}[]=[];let totalArea=0;
 root.traverse(o=>{
  if(!(o instanceof T.Mesh)||o.userData.contactShadow)return;
  let furniture=false;for(let parent:T.Object3D|null=o;parent;parent=parent.parent){if(!parent.visible)return;if(parent.userData.selectable)furniture=true;}
  const position=o.geometry.getAttribute('position'),index=o.geometry.index,count=Math.floor((index?.count??position.count)/3),areas=new Float64Array(count);let area=0;
  for(let i=0;i<count;i++){
   a.fromBufferAttribute(position,index?index.getX(i*3):i*3).applyMatrix4(o.matrixWorld);
   b.fromBufferAttribute(position,index?index.getX(i*3+1):i*3+1).applyMatrix4(o.matrixWorld);
   c.fromBufferAttribute(position,index?index.getX(i*3+2):i*3+2).applyMatrix4(o.matrixWorld);
   area+=edge.subVectors(b,a).cross(cross.subVectors(c,a)).length()*.5;areas[i]=area;
  }
  const weight=furniture?12:1;
  if(area>0){surfaces.push({mesh:o,areas,area,weight,furniture});totalArea+=area*weight;}
 });
 const points:number[][]=[];let seed=42;const random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
 const keyLight=new T.Vector3(-.4,.85,.3).normalize();
 for(const {mesh,areas,area,weight,furniture}of surfaces){
  const material=(Array.isArray(mesh.material)?mesh.material[0]:mesh.material) as T.MeshStandardMaterial;
  const color=material.color.clone();if(!furniture&&/plaster|concrete/i.test(material.name))color.set('#8dabb5');
  const position=mesh.geometry.getAttribute('position'),index=mesh.geometry.index,count=Math.max(1,Math.round(budget*area*weight/totalArea));
  for(let n=0;n<count;n++){
   const sample=random()*area;let low=0,high=areas.length-1;while(low<high){const mid=(low+high)>>>1;if(areas[mid]<sample)low=mid+1;else high=mid;}
   const i=low*3;a.fromBufferAttribute(position,index?index.getX(i):i).applyMatrix4(mesh.matrixWorld);b.fromBufferAttribute(position,index?index.getX(i+1):i+1).applyMatrix4(mesh.matrixWorld);c.fromBufferAttribute(position,index?index.getX(i+2):i+2).applyMatrix4(mesh.matrixWorld);
   const light=.58+.42*Math.abs(edge.subVectors(b,a).cross(cross.subVectors(c,a)).normalize().dot(keyLight));
   const u=Math.sqrt(random()),v=random();a.multiplyScalar(1-u).addScaledVector(b,u*(1-v)).addScaledVector(c,u*v);points.push([a.x,a.y,a.z,color.r*light,color.g*light,color.b*light]);
  }
 }
 points.sort((a,b)=>a[0]-b[0]);const geometry=new T.BufferGeometry();geometry.setAttribute('position',new T.Float32BufferAttribute(points.flatMap(point=>point.slice(0,3)),3));geometry.setAttribute('color',new T.Float32BufferAttribute(points.flatMap(point=>point.slice(3)),3));geometry.setAttribute('captureRank',new T.Float32BufferAttribute(points.map(()=>random()),1));
 const cloud=new T.Points(geometry,scanPointMaterial());cloud.name='LiDAR surface samples';return cloud;
}

export function HomeScene(props:HomeSceneProps){
 const {tr}=useLocale();
 const host=useRef<HTMLDivElement>(null);const live=useRef(props);live.current=props;
 const [error,setError]=useState(false);const [loaded,setLoaded]=useState(false);const [attempt,setAttempt]=useState(0);
 useEffect(()=>{
  const container=host.current;if(!container)return;let disposed=false,frame=0,ready=false,loadSerial=0;const motionPreference=matchMedia('(prefers-reduced-motion: reduce)');let reduced=motionPreference.matches;const mobile=matchMedia('(max-width: 740px)').matches;
  let renderer:T.WebGLRenderer;try{renderer=new T.WebGLRenderer({alpha:true,antialias:true,powerPreference:'high-performance',preserveDrawingBuffer:false});}catch{setError(true);return;}
  renderer.setPixelRatio(Math.min(devicePixelRatio,mobile?1.25:1.4));renderer.setClearColor('#eaece6');renderer.outputColorSpace=T.SRGBColorSpace;renderer.toneMapping=T.AgXToneMapping;renderer.toneMappingExposure=1.08;renderer.shadowMap.enabled=true;renderer.shadowMap.type=T.PCFShadowMap;renderer.shadowMap.autoUpdate=false;renderer.shadowMap.needsUpdate=true;renderer.localClippingEnabled=true;renderer.domElement.setAttribute('aria-label','Interactive 3D home; drag to rotate, scroll to zoom');container.appendChild(renderer.domElement);
  const scene=new T.Scene();const camera=new T.OrthographicCamera(-7,7,5,-5,.1,80);camera.up.set(0,1,0);camera.position.set(9.2,11.3,13.5);
  const budget=createRenderBudget(renderer,mobile);let previousRender='',lastRenderAt=0,materialSignature='',inViewport=true;
  const scanCamera=new T.PerspectiveCamera(60,1,.035,80),scanEye=new T.Vector3(),scanGaze=new T.Vector3(),scanOverviewTarget=new T.Vector3(),scanOverviewPosition=new T.Vector3(),scanUp=new T.Vector3(0,1,0);
  let previousScanImmersion=0;
  let controls=new OrbitControls(camera,renderer.domElement);controls.target.set(0,.35,0);controls.enableDamping=true;controls.dampingFactor=.075;controls.minPolarAngle=.2;controls.maxPolarAngle=1.3;controls.rotateSpeed=.65;controls.zoomSpeed=.85;controls.minZoom=.65;controls.maxZoom=3;controls.screenSpacePanning=true;
  const pmrem=new T.PMREMGenerator(renderer),room=new RoomEnvironment();const environmentTarget=pmrem.fromScene(room,.04);scene.environment=environmentTarget.texture;scene.environmentIntensity=.64;room.dispose();pmrem.dispose();
  const ambient=new T.HemisphereLight('#f4f5f0','#a1a292',1.05);scene.add(ambient);
  const fill=new T.DirectionalLight('#e3eaf0',.55);fill.position.set(7,8,-5);scene.add(fill);
  const sun=new T.DirectionalLight('#fff4e4',2.35);sun.position.set(-3,14,4);sun.castShadow=true;sun.shadow.mapSize.set(mobile?1024:1536,mobile?1024:2048);Object.assign(sun.shadow.camera,{left:-8,right:8,top:8,bottom:-8,near:.1,far:40});sun.shadow.normalBias=.012;sun.shadow.bias=-.00008;sun.shadow.radius=3.5;sun.shadow.intensity=.76;const rim=new T.DirectionalLight('#d9e5ee',.28);rim.position.set(-8,5,-10);scene.add(sun,sun.target,rim);
  const ground=new T.Mesh(new T.PlaneGeometry(160,160),new T.ShadowMaterial({opacity:live.current.cinematic?.24:.18}));ground.rotation.x=-Math.PI/2;ground.position.y=live.current.mode==='vignette'?-.003:-.16;ground.receiveShadow=true;scene.add(ground);
  const lampIds=['F18','F11','F12','F15'];
  const warmLights=lampIds.map(()=>{const l=new T.PointLight('#ffcf91',0,3.5,2);scene.add(l);return l;});
  const surfaces=createSurfaceMaps(Math.min(renderer.capabilities.getMaxAnisotropy(),mobile?2:4));
  const lampMaterials=new Set<T.MeshStandardMaterial>();
  const contactMaterials=new Set<T.MeshBasicMaterial>();
  const lampPosition=new T.Vector3();
  const dayBackground=new T.Color('#edeae3'),nightBackground=new T.Color('#37424d'),heroBackground=new T.Color(getComputedStyle(container).getPropertyValue('--home-scene-background').trim()||'#17271f');
  const reuseHighlight=new T.Color('#71a078'),newHighlight=new T.Color('#d89940');
  let selectedIds=live.current.selectedIds,selectedSet=new Set(selectedIds??allExistingIds);
  const daySun=new T.Color('#fff4e4'),nightSun=new T.Color('#d3dfe9'),background=new T.Color();
  const workbench=new T.Group();scene.add(workbench);workbench.visible=false;
  const benchCanvas=document.createElement('canvas');benchCanvas.width=1200;benchCanvas.height=540;
  const benchTexture=new T.CanvasTexture(benchCanvas);benchTexture.colorSpace=T.SRGBColorSpace;
  const benchMaterial=new T.MeshBasicMaterial({map:benchTexture,transparent:true,depthWrite:false});
  const bench=new T.Mesh(new T.PlaneGeometry(stagingArea.maxX-stagingArea.minX,stagingArea.maxZ-stagingArea.minZ),benchMaterial);
  bench.rotation.x=-Math.PI/2;bench.position.set((stagingArea.minX+stagingArea.maxX)/2-4.3,-.025,(stagingArea.minZ+stagingArea.maxZ)/2-2.9);workbench.add(bench);
  let benchLabel='';
  function drawWorkbench(label:string){const c=benchCanvas.getContext('2d')!;c.clearRect(0,0,1200,540);c.fillStyle='#e0e7db';c.beginPath();c.roundRect(4,4,1192,532,26);c.fill();c.strokeStyle='#a1b49a';c.lineWidth=3;c.setLineDash([12,10]);c.stroke();c.setLineDash([]);c.fillStyle='#bdcbb6';for(let x=36;x<1180;x+=36)for(let y=88;y<520;y+=36){c.beginPath();c.arc(x,y,1.5,0,Math.PI*2);c.fill();}c.fillStyle='#526e50';c.font='500 24px sans-serif';c.textAlign='center';c.fillText(label,600,48);benchTexture.needsUpdate=true;}
  const dropMaterial=new T.MeshBasicMaterial({color:'#76966d',transparent:true,opacity:.22,depthWrite:false,depthTest:false});
  const dropPreview=new T.Mesh(new T.PlaneGeometry(1,1),dropMaterial);dropPreview.rotation.x=-Math.PI/2;dropPreview.renderOrder=10;dropPreview.visible=false;scene.add(dropPreview);
  let planBlend=0,previousLightBlend=-1,previousPlanBlend=-1;

  const models=new Map<string,T.Group>();const pending=new Map<string,Promise<T.Group>>();const roots=new Map<string,Map<string,T.Object3D>>();const clips=new Map<string,T.Plane>();const clouds=new Map<string,T.Points>();const wires=new Map<string,T.Object3D>();const allMaterials=new Set<T.Material>();const allGeometry=new Set<T.BufferGeometry>();const bases=new WeakMap<T.Material,{color:T.Color;opacity:number;transparent:boolean;emissive:T.Color;emissiveIntensity:number}>();
  const loader=new GLTFLoader();let vignetteTime=0,revealStart=0;const phone=createIPhone();const deviceScene=new T.Scene();deviceScene.environment=environmentTarget.texture;deviceScene.environmentIntensity=.64;const deviceAmbient=new T.HemisphereLight('#f4f5f0','#a1a292',1.05),deviceKey=new T.DirectionalLight('#fff4e4',2.1);deviceKey.position.set(-3,8,5);deviceScene.add(deviceAmbient,deviceKey,phone);phone.traverse(object=>{if(object instanceof T.Mesh){object.castShadow=false;allGeometry.add(object.geometry);for(const material of materialList(object)){material.depthTest=true;material.depthWrite=true;allMaterials.add(material);}}});phone.visible=false;
  const sweep=new T.Mesh(new T.PlaneGeometry(6.6,2.75),new T.MeshBasicMaterial({color:'#adc4d4',transparent:true,opacity:.14,side:T.DoubleSide,depthWrite:false,blending:T.AdditiveBlending}));sweep.rotation.y=Math.PI/2;sweep.position.y=1.35;scene.add(sweep);sweep.visible=false;
  const rayGeo=new T.BufferGeometry();rayGeo.setAttribute('position',new T.BufferAttribute(new Float32Array(144),3));const scanRays=new T.LineSegments(rayGeo,new T.LineBasicMaterial({color:'#bfd1dc',transparent:true,opacity:.42,depthWrite:false,blending:T.AdditiveBlending}));scene.add(scanRays);scanRays.visible=false;
  const scanFront=new T.LineSegments(new T.EdgesGeometry(new T.BoxGeometry(.012,2.75,6.6)),new T.LineBasicMaterial({color:'#d6e3eb',transparent:true,opacity:.8,depthWrite:false,blending:T.AdditiveBlending}));scanFront.position.y=1.35;scene.add(scanFront);scanFront.visible=false;
  const captureBackground=new T.Color('#112333');
  const captureDepths=new Map<string,T.Mesh>();
  let activeRoot:T.Group|null=null,mode:SceneMode=live.current.mode,modeKey='',layoutKey='',viewKey='',wallKey='',selectionKey='',presentationKey='',showcaseKey=false,lastReplay=-1,selectedBox:T.Box3Helper|null=null,transitions:Transform[]=[],transitionStart=0,transitionEnd=0,lastFrame=0,lightBlend=0,foldBlend=0,productUserOrbit=false;
  let extractionBlend=0,galleryBlend=0,lastPointCount=-1,lastSampleAnnouncement=0;const furnitureLift=new Map<string,number>();
  let displayedScan=0,displayedMove=0,wasScanning=false,wasAwaiting=false;
  const detectedGreen=new T.Color('#719c76'),selectionGlow=new T.Color('#fff5de');
  const center=new T.Vector3(-4.3,0,-2.9);
  function renderFrame(viewCamera:T.Camera){renderer.render(scene,viewCamera);let calls=renderer.info.render.calls;if(phone.visible){renderer.autoClear=false;renderer.clearDepth();renderer.render(deviceScene,viewCamera);calls+=renderer.info.render.calls;renderer.autoClear=true;}return calls;}
  let moveShot='',arrivedAzimuth:number|null=null,arrivedPolar:number|null=null,settledAfterMove=false;
  const moveCameraOffset=new T.Vector3(),moveCargoPosition=new T.Vector3(),moveDestination=new T.Vector3();
  let lastMoveShadow=0;
  let migration:{truck:T.Group;oldWrap:T.Group;newWrap:T.Group;flights:{id:string;source:T.Object3D;carry:T.Object3D;start:T.Vector3;cargo:T.Vector3;cargoScale:number;oldYaw:number}[]}|null=null;
  async function buildMove(){
   const [old,empty]=await Promise.all([load('old'),load('empty')]);if(disposed)throw Error('Scene disposed');
   const g=new T.Group();g.name='A move, in three acts';const oldWrap=new T.Group(),newWrap=new T.Group();oldWrap.position.set(-2.8,0,-.7);newWrap.position.set(2.8,0,-.7);oldWrap.scale.setScalar(.42);newWrap.scale.setScalar(.42);const oldCopy=old.clone(true),newCopy=empty.clone(true);oldCopy.traverse(o=>{if(o.userData.layer==='architecture')o.visible=true;if(o.userData.selectable){const pose=oldPlacements.find(p=>p.id===o.userData.id);if(pose){o.position.set(pose.x,0,pose.z);o.rotation.set(0,pose.rotation*Math.PI/180,0);o.scale.setScalar(1);}}});oldCopy.visible=true;newCopy.visible=true;oldWrap.add(oldCopy);newWrap.add(newCopy);g.add(oldWrap,newWrap);scene.add(g);g.updateMatrixWorld(true);
   const truck=createMovingTruck();truck.position.set(-2.8,-.025,2.25);truck.scale.setScalar(.7);g.add(truck);const flights:{id:string;source:T.Object3D;carry:T.Object3D;start:T.Vector3;cargo:T.Vector3;cargoScale:number;oldYaw:number}[]=[];
   oldCopy.traverse(o=>{if(!o.userData.selectable)return;const copy=o.clone(true);copy.position.set(0,0,0);copy.scale.setScalar(1);const oldYaw=oldPlacements.find(p=>p.id===o.userData.id)?.rotation??0;copy.rotation.set(0,0,0);const carry=new T.Group();carry.add(copy);carry.userData={id:o.userData.id,origin:'existing',selectable:true};g.add(carry);const slot=cargoSlot(flights.length);flights.push({id:o.userData.id,source:o,carry,start:o.getWorldPosition(new T.Vector3()),cargo:new T.Vector3(slot.x,slot.y,slot.z),cargoScale:cargoScale(o.userData.dimensions),oldYaw:oldYaw*Math.PI/180});});
   const routeGeometry=new T.BufferGeometry().setFromPoints([new T.Vector3(-2.8,-.08,2.25),new T.Vector3(2.8,-.08,2.25)]);
   const route=new T.Line(routeGeometry,new T.LineDashedMaterial({color:'#879fb2',dashSize:.08,gapSize:.1,transparent:true,opacity:.4,depthWrite:false}));route.computeLineDistances();g.add(route);
   migration={truck,oldWrap,newWrap,flights};roots.set('move',new Map(flights.map(f=>[f.id,f.carry])));models.set('move',g);g.visible=false;
   g.traverse(o=>{if(o.userData.contactShadow){o.visible=false;return;}if(o instanceof T.Mesh){o.castShadow=!/Shade seam|Twig|Leaf|Woven rug border/.test(o.name.replaceAll('_',' '))&&!materialList(o).some(m=>/tailored seam|glazing|glass/i.test(m.name));o.receiveShadow=true;for(const m of materialList(o)){const base=bases.get(m);if(base){m.opacity=base.opacity;m.transparent=base.transparent;m.color.copy(base.color);}}}});
   flights.forEach(f=>f.carry.traverse(o=>{if(o instanceof T.Mesh)o.castShadow=false;}));
   return g;
  }

  function addContactShadow(object:T.Object3D,clip:T.Plane){
   const dimensions=object.userData.dimensions as number[]|undefined;if(!dimensions)return;
   const material=new T.MeshBasicMaterial({color:'#394338',map:surfaces.contact,transparent:true,opacity:.13,depthWrite:false,clippingPlanes:[clip],polygonOffset:true,polygonOffsetFactor:-1});
   const geometry=new T.PlaneGeometry(dimensions[0]*1.08,dimensions[1]*1.08);
   const shadow=new T.Mesh(geometry,material);shadow.name='Soft furniture contact';shadow.userData.contactShadow=true;
   shadow.rotation.x=-Math.PI/2;shadow.position.y=.038;object.add(shadow);
   allMaterials.add(material);allGeometry.add(geometry);contactMaterials.add(material);
  }
  const itemReveals=new Map<number,{plane:T.Plane;min:number;max:number}>();
  function prepare(raw:T.Group,key:string){
   raw.traverse(o=>{if(/Subtle wood grain|Throw stitched fold|Fine vertical oak fluting|Woven rug border/.test(o.name.replaceAll('_',' ')))o.visible=false;});
   batchStatic(raw);raw.position.copy(key.startsWith('product')||key==='vignette'?new T.Vector3():center);const clip=new T.Plane(new T.Vector3(-1,0,0),100);clips.set(key,clip);const items=new Map<string,T.Object3D>();
   raw.traverse(o=>{if(o.userData.selectable)items.set(o.userData.id,o);if(o instanceof T.Mesh){o.castShadow=!/Shade seam|Twig|Leaf|Woven rug border/.test(o.name.replaceAll('_',' '))&&!materialList(o).some(m=>/tailored seam|glazing|glass/i.test(m.name));o.receiveShadow=true;const mats=materialList(o).map(m=>{const copy=m.clone();finishMaterial(copy,surfaces,o.name);if(copy.userData.lampGlow)lampMaterials.add(copy);copy.clippingPlanes=[clip];copy.clipShadows=true;bases.set(copy,{color:copy.color.clone(),opacity:copy.opacity,transparent:copy.transparent,emissive:copy.emissive.clone(),emissiveIntensity:copy.emissiveIntensity});allMaterials.add(copy);return copy;});o.material=mats.length===1?mats[0]:mats;allGeometry.add(o.geometry);}});
   for(const object of items.values())addContactShadow(object,clip);
   if(key==='old'){
    raw.updateMatrixWorld(true);
    for(const [id,object]of items){
     const box=new T.Box3().setFromObject(object),plane=new T.Plane(new T.Vector3(-1,0,0),100);
     itemReveals.set(captureItemIndex(id),{plane,min:box.min.x-.015,max:box.max.x+.015});
     object.traverse(o=>{if(o instanceof T.Mesh)for(const material of materialList(o))material.clippingPlanes=[plane];});
    }
   }
   roots.set(key,items);raw.visible=false;scene.add(raw);models.set(key,raw);return raw;
  }
  async function load(key:string):Promise<T.Group>{
   if(models.has(key))return models.get(key)!;if(pending.has(key))return pending.get(key)!;if(key==='move'){const task=buildMove();pending.set(key,task);return task;}
   if(key==='vignette'){
    const task=(async()=>{const pieces=await Promise.all(['F01','F02','F18'].map(id=>loader.loadAsync(`/models/v2/furniture/${id}.glb`)));
     if(disposed){pieces.forEach(({scene})=>scene.traverse(o=>{if(o instanceof T.Mesh){o.geometry.dispose();materialList(o).forEach(m=>m.dispose());}}));throw new Error('Scene disposed');}
     const corner=new T.Group();corner.name='The familiar corner';
     pieces.forEach(({scene},index)=>{const wrapper=new T.Group();wrapper.add(scene);wrapper.position.set(index===2?-1.35:index===1?.18:0,0,index===1?1.04:-.3);corner.add(wrapper);});
     return prepare(corner,key);
    })();pending.set(key,task);return task;
   }
   const task=(async()=>{const url=key==='old'?'/models/v2/old-home.glb':key==='empty'?'/models/v2/new-home-empty.glb':key.startsWith('product')?`/models/v2/furniture/${studioInventory.find(i=>i.id===key.split(':')[1])?.modelSourceId??key.split(':')[1]}.glb`:'/models/v2/new-home-a.glb';const gltf=await loader.loadAsync(url);if(disposed){gltf.scene.traverse(o=>{if(o instanceof T.Mesh){o.geometry.dispose();materialList(o).forEach(m=>m.dispose());}});throw new Error('Scene disposed');}const raw=prepare(gltf.scene,key);
   if(key==='layout'){
    const extraIds=['N02','N03','N04','N05','N06'];const extras=await Promise.all(extraIds.map(id=>loader.loadAsync(`/models/v2/furniture/${studioInventory.find(i=>i.id===id)?.modelSourceId??id}.glb`)));
    if(disposed)throw new Error('Scene disposed');
    extras.forEach((gltf,index)=>{let object:T.Object3D|undefined;gltf.scene.traverse(o=>{if(o.userData.selectable)object=o;});if(!object)return;object.userData.id=extraIds[index];object.userData.origin='new';object.removeFromParent();raw.add(object);batchStatic(object);roots.get(key)!.set(object.userData.id,object);object.visible=false;object.traverse(o=>{if(o instanceof T.Mesh){o.castShadow=!/Shade seam|Twig|Leaf|Woven rug border/.test(o.name.replaceAll('_',' '))&&!materialList(o).some(m=>/tailored seam|glazing|glass/i.test(m.name));o.receiveShadow=true;const m=(o.material as T.MeshStandardMaterial).clone();finishMaterial(m,surfaces,o.name);if(m.userData.lampGlow)lampMaterials.add(m);m.clippingPlanes=[clips.get(key)!];m.clipShadows=true;bases.set(m,{color:m.color.clone(),opacity:m.opacity,transparent:m.transparent,emissive:m.emissive.clone(),emissiveIntensity:m.emissiveIntensity});o.material=m;allMaterials.add(m);allGeometry.add(o.geometry);}});addContactShadow(object,clips.get(key)!);});
   }
   if(key.startsWith('product')){const bounds=new T.Box3().setFromObject(raw);const c=bounds.getCenter(new T.Vector3());raw.position.set(-c.x,-bounds.min.y,-c.z);}
   return raw;})();pending.set(key,task);return task;
  }
  let cameraTween:{start:number;from:T.Spherical;to:T.Spherical;fromTarget:T.Vector3;toTarget:T.Vector3;fromZoom:number}|null=null;
  function setView(instant=false){
   const diy3d=live.current.editable&&live.current.diyView==='3d';const top=!diy3d&&(live.current.editable||live.current.view==='top');controls.enableDamping=false;controls.update();controls.enableDamping=true;
   // Keep world-up invariant. Changing camera.up after OrbitControls construction causes roll.
   camera.up.set(0,1,0);controls.minPolarAngle=0;controls.enableRotate=!top&&!live.current.editable;controls.mouseButtons.LEFT=top?T.MOUSE.PAN:T.MOUSE.ROTATE;controls.touches.ONE=top?T.TOUCH.PAN:T.TOUCH.ROTATE;
   const to=new T.Vector3(...(top?[0,20,.001]:mode==='vignette'?[3.6,2.8,5.1]:mode==='product'?[2.5,2.1,3.1]:[9.2,11.3,13.5]) as [number,number,number]),target=new T.Vector3(0,mode==='vignette'?.6:mode==='product'?.45:.35,mode==='vignette'?.35:0);
   if(live.current.editable){target.set(-.1,.35,2.3);if(diy3d)to.set(9.1,11.65,15.8);else to.set(-.1,20,2.301);}
   if(mode==='layout'&&arrivedAzimuth!==null&&!top&&!live.current.editable){const radius=to.length();to.setFromSphericalCoords(radius,arrivedPolar??.9,arrivedAzimuth).add(target);}
   if(mode==='move'){target.set((live.current.migrationProgress??0)>=.66?2.8:-2.8,.25,.45);to.copy(target).add(new T.Vector3(7,8,10));}
   if(instant||reduced){cameraTween=null;camera.position.copy(to);controls.target.copy(target);camera.zoom=1;camera.lookAt(target);controls.update();camera.updateProjectionMatrix();}
   else {
    // Interpolate orbit angles, not XYZ: a Cartesian path retains its diagonal
    // azimuth until the very last frame near the top-view pole, then snaps north.
    const from=new T.Spherical().setFromVector3(camera.position.clone().sub(controls.target));
    const destination=new T.Spherical().setFromVector3(to.clone().sub(target));
    destination.theta=from.theta+Math.atan2(Math.sin(destination.theta-from.theta),Math.cos(destination.theta-from.theta));
    cameraTween={start:performance.now(),from,to:destination,fromTarget:controls.target.clone(),toTarget:target,fromZoom:camera.zoom};
   }
  }

  function resize(){const w=container!.clientWidth,h=container!.clientHeight;if(!w||!h)return;previousRender='';renderer.setPixelRatio(renderPixelRatio(w,h,devicePixelRatio,mobile));renderer.setSize(w,h,false);const ratio=w/h,baseSpan=mode==='product'?2.5:live.current.cinematic&&window.innerWidth<740?13.4:mode==='move'?Math.max(5.8,5.2/ratio):ratio<.9?15.8:10.9,base=(mode==='old'||mode==='empty')&&!live.current.cinematic?Math.max(baseSpan,(live.current.scan!==undefined||live.current.readyToScan?15.2:13.4)/ratio):baseSpan,impact=live.current.presentation==='impact',span=live.current.editable?Math.max(11.9,(live.current.diyView==='3d'?13.8:9.9)/ratio):mode==='vignette'?Math.max(3.3,4.4/ratio):impact?Math.max(9.6,12/ratio):mode==='layout'&&mobile?Math.max(base,11.7/ratio):base,offset=0;camera.left=-span*ratio/2;camera.right=span*ratio/2;camera.top=span/2-offset;camera.bottom=-span/2-offset;camera.updateProjectionMatrix();scanCamera.aspect=ratio;scanCamera.updateProjectionMatrix();}
  function observeCamera(){controls.addEventListener('change',()=>{container!.dataset.cameraYaw=String(controls.getAzimuthalAngle());container!.dataset.cameraUp=camera.up.toArray().join(',');});}
  function resyncControls(){const target=controls.target.clone();controls.dispose();controls=new OrbitControls(camera,renderer.domElement);controls.target.copy(target);controls.enableDamping=true;controls.dampingFactor=.075;controls.minPolarAngle=live.current.view==='top'?0:.2;controls.maxPolarAngle=1.3;controls.rotateSpeed=.65;controls.zoomSpeed=.85;controls.minZoom=.65;controls.maxZoom=3;controls.screenSpacePanning=true;controls.enableRotate=live.current.view!=='top';controls.mouseButtons.LEFT=live.current.view==='top'?T.MOUSE.PAN:T.MOUSE.ROTATE;controls.touches.ONE=live.current.view==='top'?T.TOUCH.PAN:T.TOUCH.ROTATE;observeCamera();controls.update();}
  observeCamera();
  const observer=new ResizeObserver(resize);observer.observe(container);const visibilityObserver=new IntersectionObserver(([entry])=>{inViewport=entry.isIntersecting;},{rootMargin:'80px'});visibilityObserver.observe(container);resize();setView(true);
  function wallCut(){for(const model of models.values())model.traverse(o=>{if(o.userData.wall){const w=o.userData.wall,h=live.current.fullWalls?w.height:Math.max(0,Math.min(w.height,w.cutHeight-w.bottom));o.scale.y=h/w.height;o.position.y=w.bottom+h/2;o.visible=h>0;}if(o.userData.upper)o.visible=!!live.current.fullWalls||!!o.userData.rear;});renderer.shadowMap.needsUpdate=true;}
  let selectionHalo:ReturnType<typeof createSelectionHalo>|null=null;
  function clearBox(){selectionHalo?.dispose();selectionHalo=null;if(selectedBox){scene.remove(selectedBox);selectedBox.geometry.dispose();(selectedBox.material as T.Material).dispose();selectedBox=null;}}
  function selection(){clearBox();const key=mode==='product'?`product:${live.current.productId}`:mode;const object=roots.get(key)?.get(live.current.selectedId??'');if(object&&object.visible){object.updateWorldMatrix(true,true);if(mode==='old'){selectionHalo=createSelectionHalo();selectionHalo.update(new T.Box3().setFromObject(object));scene.add(selectionHalo.object);return;}selectedBox=new T.Box3Helper(new T.Box3().setFromObject(object),object.userData.origin==='new'?0xb78e59:0x5b8a70);scene.add(selectedBox);}}
  // GLTF may encode a 180° yaw as Euler X/Z rotations; set all axes when applying a floor-plan yaw.
  function applyLayout(now:number){
   const items=roots.get('layout');if(!items)return;const layout=studioLayouts.find(l=>l.id===(live.current.layout??'a'))!;const selected=new Set(live.current.selectedIds??allExistingIds);const targets=new Map((live.current.placements??layout.placements).filter(p=>p.origin==='new'||selected.has(p.id)).map(p=>[p.id,p]));const first=!layoutKey||(live.current.replay??0)!==lastReplay;const landed=settledAfterMove&&!layoutKey;transitions=[];
   let index=0;for(const [id,o]of items){const target=targets.get(id);if(target){if(live.current.editable||landed){o.position.set(target.x,0,target.z);o.rotation.set(0,target.rotation*Math.PI/180,0);o.scale.setScalar(1);o.visible=true;continue;}if(first||!o.visible){const from=oldPlacements.find(p=>p.id===id);o.position.set(from?.x??target.x,0,from?.z??target.z);o.rotation.set(0,(from?.rotation??target.rotation)*Math.PI/180,0);o.scale.setScalar(.03);}const yaw=target.rotation*Math.PI/180;const delta=Math.atan2(Math.sin(yaw-o.rotation.y),Math.cos(yaw-o.rotation.y));transitions.push({object:o,from:o.position.clone(),to:new T.Vector3(target.x,0,target.z),fromYaw:o.rotation.y,toYaw:o.rotation.y+delta,fromScale:o.scale.x,show:true,delay:reduced?0:index++*38});o.visible=true;}else if(live.current.editable){o.visible=false;}else if(o.visible)transitions.push({object:o,from:o.position.clone(),to:o.position.clone().add(new T.Vector3(0,.3,0)),fromYaw:o.rotation.y,toYaw:o.rotation.y,fromScale:o.scale.x,show:false,delay:0});}
   if(landed)settledAfterMove=false;transitionStart=now;transitionEnd=now+(reduced||landed?1:2100);renderer.shadowMap.needsUpdate=true;selectionKey='';
  }
  async function ensureMode(){const key=live.current.mode==='product'?`product:${live.current.productId??'N01'}`:live.current.mode;if(modeKey===key)return;const fromMoving=modeKey==='move'&&key==='layout';if(fromMoving){arrivedAzimuth=Math.atan2(camera.position.x-controls.target.x,camera.position.z-controls.target.z);arrivedPolar=new T.Spherical().setFromVector3(camera.position.clone().sub(controls.target)).phi;settledAfterMove=true;}else if(key==='move'){arrivedAzimuth=null;arrivedPolar=null;settledAfterMove=false;}const serial=++loadSerial;modeKey=key;mode=live.current.mode;ready=false;setLoaded(false);setError(false);
   try{const next=await load(key);if(disposed||serial!==loadSerial)return;const hadActiveRoot=!!activeRoot;for(const m of models.values())m.visible=false;for(const c of clouds.values())c.visible=false;for(const w of wires.values())w.visible=false;activeRoot=next;activeRoot.visible=true;wallCut();layoutKey='';selectionKey='';viewKey=live.current.view??'orbit';resize();if(mode==='layout'&&live.current.reveal&&!reduced)camera.zoom=.86;setView(!hadActiveRoot||(mode!=='move'&&mode!=='layout'));
    if(mode==='old'||mode==='empty'){if(!clouds.has(key)){next.traverse(o=>{if(o.userData.wall){const w=o.userData.wall;o.scale.y=1;o.position.y=w.bottom+w.height/2;o.visible=true;}if(o.userData.upper)o.visible=true;});clouds.set(key,pointCloud(next,mobile?120000:260000));scene.add(clouds.get(key)!);const depth=createCaptureDepth(next);captureDepths.set(key,depth);scene.add(depth);allGeometry.add(depth.geometry);allMaterials.add(depth.material as T.Material);wallCut();const topology=createSpatialTopology(next,mobile,true),w=topology.group,material=topology.material;material.clippingPlanes=[new T.Plane(new T.Vector3(-1,0,0),-4.55),new T.Plane(new T.Vector3(1,0,0),4.55)];allMaterials.add(material);w.traverse(o=>{if(o instanceof T.Mesh){allGeometry.add(o.geometry);allMaterials.add(o.material as T.Material);(o.material as T.MeshBasicMaterial).clippingPlanes=material.clippingPlanes;}});w.visible=false;scene.add(w);wires.set(key,w);container!.dataset.reconstructionTriangles=String(w.userData.triangles??0);wallCut();}}
    const captureNodes=[clouds.get(key),captureDepths.get(key),wires.get(key)].filter((node):node is T.Object3D=>!!node);const captureVisibility=captureNodes.map(node=>node.visible);captureNodes.forEach(node=>{node.visible=true;});
    if(renderer.extensions.has("KHR_parallel_shader_compile")) await renderer.compileAsync(scene,camera); else renderer.compile(scene,camera);captureNodes.forEach((node,index)=>{node.visible=captureVisibility[index];});if(live.current.readyToScan||live.current.scan!==undefined){phone.visible=true;if(renderer.extensions.has('KHR_parallel_shader_compile'))await renderer.compileAsync(deviceScene,camera);else renderer.compile(deviceScene,camera);phone.visible=false;}if(disposed||serial!==loadSerial)return;activeRoot.visible=!live.current.readyToScan&&live.current.scan===undefined;renderer.shadowMap.needsUpdate=true;renderFrame(camera);ready=true;revealStart=performance.now();setLoaded(true);live.current.onReady?.(mode);if(mode==='empty')void load('layout').catch(()=>{});
   }catch(e){if(!disposed&&serial===loadSerial){setError(true);console.error('Unable to load spatial model',e);}}
  }
  const raycaster=new T.Raycaster();let pointer:[number,number]|null=null;
  let dragged:T.Object3D|null=null,dragStart:T.Vector3|null=null,dragPointer:number|null=null;
  const dragOffset=new T.Vector3();let feedbackKey='';
  function feedback(value:DragFeedback|null){const key=JSON.stringify(value);if(key!==feedbackKey){feedbackKey=key;live.current.onDragFeedback?.(value);}}
  function aim(e:PointerEvent){const r=renderer.domElement.getBoundingClientRect();raycaster.setFromCamera(new T.Vector2((e.clientX-r.left)/r.width*2-1,-(e.clientY-r.top)/r.height*2+1),camera);}
  function floorPoint(e:PointerEvent){aim(e);return raycaster.ray.intersectPlane(new T.Plane(new T.Vector3(0,1,0),0),new T.Vector3());}
  function pick(e:PointerEvent){if(!activeRoot)return null;aim(e);for(const hit of raycaster.intersectObject(activeRoot,true)){if(hit.object.userData.contactShadow)continue;let visible=true;for(let o:T.Object3D|null=hit.object;o;o=o.parent)if(!o.visible&&!(o===activeRoot&&live.current.detectedFurniture&&!live.current.furnitureOnly))visible=false;if(!visible)continue;let object:T.Object3D|null=hit.object;while(object&&!object.userData.selectable)object=object.parent;if(object)return object;}return null;}
  function candidate(){const p=live.current.placements?.find(p=>p.id===dragged?.userData.id);return p&&dragged?{...p,x:dragged.position.x,z:dragged.position.z}:null;}
  function updateDrop(){const p=candidate();if(!p||!dragged)return;const issue=placementIssue(p,live.current.placements??[],true),size=footprint(p);dropPreview.visible=true;dropPreview.scale.set(size.w+.06,size.d+.06,1);dropPreview.position.copy(dragged.getWorldPosition(new T.Vector3()));dropPreview.position.y=.04;dropMaterial.color.set(issue?'#bc7157':'#76966d');if(selectedBox){dragged.updateWorldMatrix(true,true);selectedBox.box.setFromObject(dragged);(selectedBox.material as T.LineBasicMaterial).color.copy(dropMaterial.color);}feedback({id:p.id,state:issue?'blocked':isStaged(p)?'staged':'moving'});}
  const down=(e:PointerEvent)=>{
   if(dragPointer!==null)return;
   pointer=[e.clientX,e.clientY];productUserOrbit=true;live.current.onInteract?.();
   if(!live.current.editable||e.button!==0||!activeRoot||cameraTween||transitions.length)return;
   const object=pick(e),point=floorPoint(e);if(!object||!point)return;
   dragged=object;dragStart=object.position.clone();dragPointer=e.pointerId;object.parent!.worldToLocal(point);dragOffset.copy(object.position).sub(point);
   controls.enabled=false;live.current.onSelect?.(object.userData.id);renderer.domElement.focus({preventScroll:true});renderer.domElement.setPointerCapture(e.pointerId);renderer.domElement.style.cursor='grabbing';updateDrop();e.stopImmediatePropagation();e.preventDefault();
  };
  const move=(e:PointerEvent)=>{
   if(!dragged){if(live.current.editable)renderer.domElement.style.cursor=pick(e)?'grab':'default';return;}
   if(e.pointerId!==dragPointer)return;const point=floorPoint(e);if(!point)return;dragged.parent!.worldToLocal(point);point.add(dragOffset);
   dragged.position.set(Math.round(point.x*20)/20,0,Math.round(point.z*20)/20);renderer.shadowMap.needsUpdate=true;updateDrop();e.preventDefault();
  };
  function finishDrag(cancel=false){
   if(!dragged)return false;const object=dragged,p=candidate(),pointerId=dragPointer;
   const valid=p&&!placementIssue(p,live.current.placements??[],true),changed=dragStart&&p&&(p.x!==dragStart.x||p.z!==dragStart.z);
   if((cancel||!valid)&&dragStart)object.position.copy(dragStart);
   dragged=null;dragStart=null;dragPointer=null;pointer=null;dropPreview.visible=false;feedback(null);renderer.domElement.style.cursor=live.current.editable?'grab':'';
   if(pointerId!==null&&renderer.domElement.hasPointerCapture(pointerId))renderer.domElement.releasePointerCapture(pointerId);
   renderer.shadowMap.needsUpdate=true;selection();if(!cancel&&p&&changed)live.current.onMove?.(p.id,p.x,p.z);return true;
  }
  const cancel=(e:PointerEvent)=>{if(e.pointerId===dragPointer)finishDrag(true);};
  const escape=(e:KeyboardEvent)=>{if(e.key==='Escape'&&dragged){e.preventDefault();finishDrag(true);}};
  const blur=()=>finishDrag(true);
  const leave=()=>{if(!dragged)renderer.domElement.style.cursor='';};
  const up=(e:PointerEvent)=>{if(dragged&&e.pointerId!==dragPointer)return;if(finishDrag())return;if(!pointer||!activeRoot||Math.hypot(e.clientX-pointer[0],e.clientY-pointer[1])>5||live.current.scan!==undefined)return;const picked=pick(e);if(picked)live.current.onSelect?.(picked.userData.id);};
  renderer.domElement.addEventListener('pointerdown',down,true);renderer.domElement.addEventListener('pointermove',move);renderer.domElement.addEventListener('pointercancel',cancel);renderer.domElement.addEventListener('pointerup',up);
  renderer.domElement.tabIndex=0;renderer.domElement.addEventListener('lostpointercapture',cancel);renderer.domElement.addEventListener('pointerleave',leave);window.addEventListener('keydown',escape);window.addEventListener('blur',blur);
  const lost=(e:Event)=>{e.preventDefault();setError(true);};renderer.domElement.addEventListener('webglcontextlost',lost);
  const api:SceneApi={capture(){renderFrame(camera);const a=document.createElement('a');a.download=`renest-${mode}-${live.current.layout??'old'}-${live.current.view??'orbit'}.png`;a.href=renderer.domElement.toDataURL('image/png');a.click();},reset(){setView();},debug(){return{yaw:controls.getAzimuthalAngle(),up:camera.up.toArray(),calls:renderer.info.render.calls,visibleIds:[...(roots.get(mode)?.entries()??[])].filter(([,o])=>o.visible).map(([id])=>id),mode};}};if(live.current.apiRef)live.current.apiRef.current=api;
  function animate(now:number){if(disposed)return;frame=requestAnimationFrame(animate);if(document.hidden||live.current.paused||ready&&!inViewport){lastFrame=now;return;}if(now-lastFrame<1000/(mobile?30:60)-.5)return;const dt=Math.min(.05,(now-lastFrame)/1000||.016);lastFrame=now;void ensureMode();if(!ready||!activeRoot)return;
   const p=live.current;mode=p.mode;const k=mode==='product'?`product:${p.productId}`:mode;
   if(dragged&&(!p.editable||mode!=='layout'))finishDrag(true);
   workbench.visible=mode==='layout'&&(!!p.editable||!!p.placements?.some(isStaged));if(workbench.visible&&benchLabel!==p.stagingLabel){benchLabel=p.stagingLabel??'TEMPORARY SPACE';drawWorkbench(benchLabel);}
   const framingKey=`${!!p.editable}|${p.diyView??'top'}|${p.presentation??''}|${p.scan!==undefined||!!p.readyToScan}`;if(presentationKey!==framingKey){presentationKey=framingKey;resize();}
   const nextViewKey=`${p.view??'orbit'}|${!!p.editable}|${p.diyView??'top'}`;if(viewKey!==nextViewKey){setView();viewKey=nextViewKey;renderer.domElement.setAttribute('aria-label',p.editable?`Furniture DIY workspace; fixed ${p.diyView==='3d'?'3D':'top'} view; drag furniture to move, Escape to cancel`:'Interactive 3D home; drag to rotate, scroll to zoom');}if(wallKey!==String(p.fullWalls)){wallCut();wallKey=String(p.fullWalls);}
   const key=`${p.layout}|${(p.selectedIds??allExistingIds).join(',')}|${p.replay??0}|${JSON.stringify(p.placements??[])}`;if(mode==='layout'&&key!==layoutKey){applyLayout(now);layoutKey=key;lastReplay=p.replay??0;}
   const transitioning=now<transitionEnd;
   if(transitions.length){for(const tr of transitions){const t=reduced?1:clamp((now-transitionStart-tr.delay)/1300),e=ease(t);tr.object.position.lerpVectors(tr.from,tr.to,e);tr.object.position.y+=reduced?0:Math.sin(Math.PI*t)*.42;tr.object.rotation.set(0,T.MathUtils.lerp(tr.fromYaw,tr.toYaw,e),0);tr.object.scale.setScalar(T.MathUtils.lerp(tr.fromScale,tr.show?1:.001,e));if(t===1&&!tr.show)tr.object.visible=false;}renderer.shadowMap.needsUpdate=true;if(!transitioning)transitions=[];}
   const scanning=p.scan!==undefined,scanTarget=p.scan??1;const awaiting=!!p.readyToScan;if(scanning&&!wasScanning){setView(true);controls.autoRotate=false;displayedScan=0;previousScanImmersion=0;pointer=null;}if(wasScanning&&!scanning&&mode==='old'&&!reduced){camera.position.copy(scanCamera.position);controls.target.copy(scanOverviewTarget);camera.lookAt(controls.target);controls.enableDamping=false;controls.update();controls.enableDamping=true;}if(awaiting&&!wasAwaiting)setView(true);wasScanning=scanning;wasAwaiting=awaiting;
   displayedScan=!scanning||reduced||scanTarget<displayedScan-.02?scanTarget:T.MathUtils.damp(displayedScan,scanTarget,18,dt);
   const progress=scanning?displayedScan:1;const extractionMesh=mode==='old'&&scanning&&progress>=.4;const finalSurfaceX=mode==='old'&&scanning?-4.55+smoothstep((progress-.85)/.12)*9.2:100;
   const timeline=scanTimeline(awaiting?0:progress);
   for(const [item,reveal]of itemReveals){
    const amount=furnitureCapture(progress,item).surface;
    const x=mode==='old'&&scanning?T.MathUtils.lerp(reveal.min,reveal.max,amount):100;
    if(reveal.plane.constant!==x){reveal.plane.constant=x;renderer.shadowMap.needsUpdate=true;}
   }
   container!.dataset.captureStage=timeline.stage;container!.dataset.captureTone=scanning&&progress<.59?'dark':'light';
   const scanView=scanCameraFrame(mode==='old'&&scanning?progress:0,reduced);
   container!.dataset.scanView=scanView.immersion>.7?'interior':'overview';
   container!.style.setProperty('--capture-progress',`${Math.round(progress*100)}%`);
   if(scanView.immersion!==previousScanImmersion){
    activeRoot.traverse(o=>{if(o.userData.wall){const w=o.userData.wall,cut=Math.max(0,Math.min(w.height,w.cutHeight-w.bottom)),h=T.MathUtils.lerp(p.fullWalls?w.height:cut,w.height,scanView.immersion);o.scale.y=h/w.height;o.position.y=w.bottom+h/2;o.visible=h>0;}if(o.userData.upper)o.visible=!!p.fullWalls||!!o.userData.rear||scanView.immersion>.65;});
    previousScanImmersion=scanView.immersion;renderer.shadowMap.needsUpdate=true;
   }
   for(const [name,cloud]of clouds){
    cloud.visible=name===k&&scanning;
    if(cloud.visible){const positions=cloud.geometry.getAttribute('position');
     const count=progress>=.06?revealedPointCount(positions.array,timeline.beamX):0;
     cloud.geometry.setDrawRange(0,count);const pointMaterial=cloud.material as T.PointsMaterial;pointMaterial.opacity=timeline.pointOpacity;(pointMaterial.userData.captureDensity as {value:number}).value=.06+.94*clamp((progress-.06)/.32);if(!pointMaterial.clippingPlanes)pointMaterial.clippingPlanes=[new T.Plane(new T.Vector3(1,0,0),4.55)];pointMaterial.clippingPlanes[0].constant=100;
     container!.dataset.scanPointCount=String(count);if(scanning&&count!==lastPointCount&&now-lastSampleAnnouncement>120){lastPointCount=count;lastSampleAnnouncement=now;p.onScanSamples?.(count);}
     container!.dataset.scanPointMaxX=count?String(positions.getX(count-1)):'';
    }
   }
   // Only acquired samples are visible. Whole-room context and unscanned creases
   // used to reveal scattered cups/plant outlines ahead of the sensor.
   for(const [name,depth]of captureDepths)depth.visible=name===k&&scanning&&!timeline.wireActive&&!timeline.surfaceActive;
   for(const [name,w]of wires){w.visible=name===k&&(extractionMesh||scanning&&(timeline.wireActive||mode==='old'&&progress>=.4));if(w.visible)w.traverse(o=>{if(o instanceof T.Mesh){const material=o.material as T.MeshBasicMaterial;material.opacity=mode==='old'?smoothstep((progress-.4)/.055):timeline.wireOpacity/.72;if(material.userData.captureDensity)material.userData.captureDensity.value=smoothstep((progress-.4)/.26);if(material.userData.captureFusion)material.userData.captureFusion.value=smoothstep((progress-.78)/.19);if(material.userData.captureExtraction)material.userData.captureExtraction.value=mode==='old'&&scanning?1:0;if(material.userData.captureSelected)material.userData.captureSelected.value=captureItemIndex(p.selectedId??undefined);if(extractionMesh&&material.userData.captureKept){for(let item=1;item<=18;item++)material.userData.captureKept.value[item]=Number(!p.selectedIds||p.selectedIds.includes('F'+String(item).padStart(2,'0')));}if(material.userData.captureReveal){
     const reveal=material.userData.captureReveal.value as Float32Array,emphasis=material.userData.captureEmphasis.value as Float32Array;
     reveal.fill(-100);emphasis.fill(0);
     if(mode==='old'&&scanning){reveal[0]=finalSurfaceX;for(const [item,state]of itemReveals){reveal[item]=state.plane.constant;emphasis[item]=furnitureCapture(progress,item).emphasis;}}
    }material.clippingPlanes![0].constant=timeline.meshX;material.clippingPlanes![1].constant=mode==='old'&&scanning?100:-timeline.surfaceX;}});}
   const clip=clips.get(k),clipX=scanning?(mode==='old'?finalSurfaceX:timeline.surfaceX):100;
   if(clip&&clip.constant!==clipX){clip.constant=clipX;renderer.shadowMap.needsUpdate=true;}
   const solidVisible=!awaiting&&(!scanning||(mode==='old'?progress>.635:timeline.surfaceActive));
   if(activeRoot.visible!==solidVisible)renderer.shadowMap.needsUpdate=true;
   activeRoot.visible=solidVisible;
   ground.visible=!awaiting&&(!scanning||(mode==='old'?progress>.86:timeline.surfaceActive));
   container!.dataset.scanClipX=String(clip?.constant??100);
   container!.dataset.scanSolidVisible=String(activeRoot.visible);
   container!.dataset.scanBeamX=String(timeline.beamX);
   container!.dataset.scanProgress=String(progress);
   phone.visible=(awaiting||scanning&&progress<.4)&&mode!=='product'&&scanView.immersion<.7;sweep.visible=scanning&&timeline.beamActive&&scanView.immersion<.7;scanRays.visible=sweep.visible;scanFront.visible=sweep.visible;scanFront.position.x=timeline.beamX;
   if(phone.visible){
    const travel=timeline.sweep;
    const deviceArrival=awaiting?0:timeline.turn;phone.position.set(T.MathUtils.lerp(4.14,-5.7-Math.sin(travel*Math.PI)*.25,deviceArrival),T.MathUtils.lerp(5.2775,1.4+Math.sin(travel*Math.PI*2)*.05,deviceArrival),T.MathUtils.lerp(6.075,3.4-travel*5.6,deviceArrival));
    const facing=new T.Object3D();facing.position.copy(phone.position);facing.lookAt(phone.position.clone().multiplyScalar(2).sub(camera.position));const front=facing.quaternion.clone();
    facing.lookAt(new T.Vector3(timeline.beamX,1.25,0));phone.quaternion.slerpQuaternions(front,facing.quaternion,timeline.turn);
    phone.rotateZ(Math.sin(travel*Math.PI*3)*.035);phone.scale.setScalar(T.MathUtils.lerp(3,1.75,deviceArrival));phone.updateMatrixWorld(true);
    container!.dataset.scanPhonePosition=phone.position.toArray().map(n=>n.toFixed(4)).join(',');
    const origin=phone.localToWorld(lidarPosition.clone());sweep.position.x=timeline.beamX;
    const vertices=rayGeo.attributes.position as T.BufferAttribute;for(let i=0;i<24;i++){vertices.setXYZ(i*2,origin.x,origin.y,origin.z);vertices.setXYZ(i*2+1,timeline.beamX,.08+(i%6)*.5,-2.8+Math.floor(i/6)*1.9);}vertices.needsUpdate=true;
    phone.traverse(o=>{if(o.name==='LiDAR pulse'){const pulse=timeline.beamActive?1+(Math.sin(now*.007)+1)*.3:1;o.scale.setScalar(pulse);}});
   }
   if(mode==='move'&&migration){
    const shot=(p.migrationProgress??0)>=.66?'unloading':'loading';
    if(moveShot!==shot){moveShot=shot;cameraTween=null;}
    migration.oldWrap.visible=shot==='loading';migration.newWrap.visible=shot==='unloading';
    container!.dataset.moveShot=shot;
    const moveTarget=p.migrationProgress??0;
    displayedMove=reduced||Math.abs(moveTarget-displayedMove)>.12?moveTarget:T.MathUtils.damp(displayedMove,moveTarget,18,dt);
    const progress=displayedMove,drive=driveProgress(progress),truck=migration.truck;
    truck.position.set(T.MathUtils.lerp(-2.8,2.8,drive),-.025,2.25);truck.rotation.y=0;truck.updateMatrixWorld(true);
    const departing=smoothMotion(clamp((progress-.24)/.115)),arriving=smoothMotion(clamp((progress-.665)/.12));
    const aerial=shot==='loading'?departing:1-arriving,focusX=shot==='loading'?-2.8:2.8;
    controls.enabled=false;controls.enableDamping=false;
    const arrivalArc=smoothMotion(clamp((progress-.665)/.31));
    controls.target.set(T.MathUtils.lerp(focusX,truck.position.x,aerial*.7),.25,T.MathUtils.lerp(shot==='loading'?.45:.2,2.25,aerial));
    // The final reveal lands on the opposite diagonal, lower and closer to the home.
    // Both sides meet the map almost vertically; only the arrival develops this orbit.
    const orbit=shot==='loading'?T.MathUtils.lerp(.52,.72,clamp(progress/.355)):T.MathUtils.lerp(.72,-.92,arrivalArc);
    const radius=shot==='loading'?12:T.MathUtils.lerp(12,10,arrivalArc),elevation=shot==='loading'?9:T.MathUtils.lerp(9,5.6,arrivalArc);
    moveCameraOffset.set(Math.sin(orbit)*radius*(1-aerial*.93),T.MathUtils.lerp(elevation,16,aerial),Math.cos(orbit)*radius*(1-aerial*.93));
    camera.position.copy(controls.target).add(moveCameraOffset);
    const retreat=smoothMotion(clamp((progress-.295)/.085));const moveZoom=shot==='loading'?T.MathUtils.lerp(1,.22,retreat):T.MathUtils.lerp(.26,1.06,arriving);
    if(camera.zoom!==moveZoom){camera.zoom=moveZoom;camera.updateProjectionMatrix();}camera.lookAt(controls.target);
    for(const wheel of truck.userData.wheels as T.Group[])wheel.rotation.z=-drive*5.6/(.25*.7);
    (truck.userData.ramp as T.Group).rotation.z=T.MathUtils.lerp(-Math.PI/2,.72,tailgateOpen(progress));
    const chosen=new Set(p.selectedIds??allExistingIds),plan=studioLayouts.find(l=>l.id===(p.layout??'a'))!;let index=0;
    for(const f of migration.flights){
     if(!chosen.has(f.id)){f.source.visible=true;f.carry.visible=false;continue;}
     const order=index++,loadP=clamp((progress-.025-order*.011)/.14),unloadP=clamp((progress-.70-order*.009)/.14),target=plan.placements.find(t=>t.id===f.id);
     const cargo=truck.localToWorld(moveCargoPosition.copy(f.cargo));f.source.visible=loadP===0;f.carry.visible=loadP>0;
     if(progress<.66||!target){
      const point=overheadTransfer(f.start.toArray(),cargo.toArray(),loadP);f.carry.position.set(point[0],point[1],point[2]);
      f.carry.scale.setScalar(T.MathUtils.lerp(.42,f.cargoScale,smoothMotion(loadP/.25)));
      f.carry.rotation.y=T.MathUtils.lerp(f.oldYaw,0,smoothMotion(loadP/.5));
     }else{
      const dest=moveDestination.set(2.8+(target.x-4.3)*.42,0,-.7+(target.z-2.9)*.42),point=overheadTransfer(cargo.toArray(),dest.toArray(),unloadP);
      f.carry.position.set(point[0],point[1],point[2]);
      f.carry.scale.setScalar(T.MathUtils.lerp(f.cargoScale,.42,smoothMotion((unloadP-.75)/.25)));
      f.carry.rotation.y=target.rotation*Math.PI/180*smoothMotion(unloadP/.75);
     }
    }if(now-lastMoveShadow>1000/15){lastMoveShadow=now;renderer.shadowMap.needsUpdate=true;}
   }

   const detected=mode==='old'&&!awaiting&&(!!p.detectedFurniture&&!scanning||scanning&&progress>.635);
   extractionBlend=mode!=='old'?0:reduced?(detected?1:0):T.MathUtils.damp(extractionBlend,detected?1:0,7,dt);
   const gallery=detected&&!!p.furnitureOnly,previousGallery=galleryBlend;
   galleryBlend=mode!=='old'?0:reduced?(gallery?1:0):T.MathUtils.damp(galleryBlend,gallery?1:0,8,dt);
   if(Math.abs(galleryBlend-(gallery?1:0))<.002)galleryBlend=gallery?1:0;
   const galleryMoving=previousGallery!==galleryBlend;let liftMoving=false;
   if(mode==='old'&&roots.has('old')){let i=0;for(const [id,o]of roots.get('old')!){const original=oldPlacements.find(item=>item.id===id)!;const x=.72+(i%6)*1.44,z=.65+Math.floor(i/6)*2.05;i++;const before=furnitureLift.get(id)??0,target=detected&&p.selectedId===id?1:0,lift=reduced?target:T.MathUtils.damp(before,target,10,dt);furnitureLift.set(id,lift);if(Math.abs(before-lift)>.0001)liftMoving=true;o.position.set(T.MathUtils.lerp(original.x,x,galleryBlend),lift*.22,T.MathUtils.lerp(original.z,z,galleryBlend));o.rotation.set(0,T.MathUtils.lerp(original.rotation*Math.PI/180,0,galleryBlend),0);o.scale.setScalar(T.MathUtils.lerp(1,.58,galleryBlend)*(1+lift*T.MathUtils.lerp(.04,.16,galleryBlend)));}models.get('old')!.traverse(o=>{if(o.userData.layer==='architecture')o.visible=galleryBlend===0;});}
   if(galleryMoving||liftMoving)renderer.shadowMap.needsUpdate=true;
   container!.dataset.extractionMode=detected?(gallery?'gallery':'in-room'):'none';container!.dataset.highlightedFurniture=detected?(p.selectedId??''):'';
   if(selectedIds!==p.selectedIds){selectedIds=p.selectedIds;selectedSet=new Set(selectedIds??allExistingIds);}const set=selectedSet;const nextMaterialSignature=[k,(selectedIds??[]).join(','),p.selectedId,p.highlight,p.highlightNew,scanning,detected,extractionBlend.toFixed(3),galleryBlend.toFixed(3),layoutKey].join('|');if(materialSignature!==nextMaterialSignature||liftMoving){materialSignature=nextMaterialSignature;for(const [id,obj]of roots.get(k)??[]){obj.traverse(o=>{if(o instanceof T.Mesh)for(const m of materialList(o)){const base=bases.get(m);if(!base)continue;const muted=mode==='old'&&!set.has(id)&&!scanning&&p.selectedId!==id;const color=obj.userData.origin==='new'?(p.highlightNew?newHighlight:base.color):(p.highlight?reuseHighlight:base.color);m.color.copy(color);const selectedLift=mode==='old'&&detected?(furnitureLift.get(id)??0):0;if(mode==='old'&&extractionBlend>0)m.color.lerp(detectedGreen,extractionBlend*(1-galleryBlend)*(1-selectedLift));m.color.multiplyScalar(1+selectedLift*.06);m.emissive.copy(base.emissive).lerp(selectionGlow,selectedLift*.022);m.emissiveIntensity=base.emissiveIntensity;m.opacity=muted?.24:base.opacity;const transparent=muted||base.transparent;if(m.transparent!==transparent){m.transparent=transparent;m.needsUpdate=true;}}});}
   }
   const evening=p.lighting==='evening';
   lightBlend=reduced?(evening?1:0):T.MathUtils.damp(lightBlend,evening?1:0,3,dt);
   planBlend=reduced?(p.view==='top'?1:0):T.MathUtils.damp(planBlend,p.view==='top'?1:0,4,dt);
   // Plan mode is a softly lit architectural study; evening keeps cool fill and warm practicals.
   const night=lightBlend*(1-planBlend);
   background.copy(p.cinematic?heroBackground:dayBackground);if(!p.cinematic)background.lerp(nightBackground,night);
   if(scanning)background.copy(captureBackground).lerp(dayBackground,smoothstep((progress-.54)/.1));
   renderer.setClearColor(background,scanning?1:0);if(ground.material instanceof T.MeshStandardMaterial)ground.material.color.copy(background);
   sun.color.copy(daySun).lerp(nightSun,night);sun.intensity=T.MathUtils.lerp(2.15,.78,night)*(1-planBlend*.16);
   sun.position.set(T.MathUtils.lerp(-3,-.8,planBlend),T.MathUtils.lerp(14,19,planBlend),T.MathUtils.lerp(4,1.2,planBlend));
   sun.shadow.intensity=T.MathUtils.lerp(.74,.3,planBlend);sun.shadow.radius=T.MathUtils.lerp(4,3,planBlend);
   ambient.intensity=T.MathUtils.lerp(.7,.32,night)+planBlend*.16;fill.intensity=T.MathUtils.lerp(.48,.28,night);
   scene.environmentIntensity=T.MathUtils.lerp(.58,.32,night);
   for(const material of lampMaterials)material.emissiveIntensity=night*.65;
   for(const material of contactMaterials)material.opacity=T.MathUtils.lerp(.13,.09,planBlend);
   const currentItems=roots.get(k);
   warmLights.forEach((light,index)=>{
    const furniture=currentItems?.get(lampIds[index]);
    const enabled=!!furniture?.visible&&!scanning&&!awaiting&&!p.furnitureOnly&&(mode==='old'||mode==='layout'||mode==='vignette');
    light.intensity=enabled?night*(index===0?7:3.5):0;
    if(enabled&&furniture){furniture.localToWorld(lampPosition.set(index===3?.42:0,index===0?1.47:index===3?1.09:.77,index===3?-.07:0));light.position.copy(lampPosition);}
   });
   const relighting=Math.abs(planBlend-previousPlanBlend)>.0002||Math.abs(lightBlend-previousLightBlend)>.0002;
   if(relighting){renderer.shadowMap.needsUpdate=true;previousPlanBlend=planBlend;previousLightBlend=lightBlend;}
   container!.dataset.lightingProfile=p.view==='top'?'plan':evening?'evening':'day';
   if(mode==='layout'&&p.reveal&&!reduced){const brightness=.65+.35*ease((now-revealStart)/1800);sun.intensity*=brightness;ambient.intensity*=brightness;scene.environmentIntensity*=brightness;}
   const auto=(mode==='layout'||mode==='product')&&p.autoFold&&!reduced&&!transitioning;const desiredFold=auto?(1-Math.cos(now*.00075))*0.5:p.fold?1:0;foldBlend=reduced?desiredFold:T.MathUtils.damp(foldBlend,desiredFold,6,dt);let movingFold=false;activeRoot.traverse(o=>{if(o.userData.foldAxis){const axis=o.userData.foldAxis as 'x'|'y'|'z';const target=o.userData.foldAngle*foldBlend;if(Math.abs(o.rotation[axis]-target)>.0001)movingFold=true;o.rotation[axis]=target;}});if(movingFold)renderer.shadowMap.needsUpdate=true;
   const selectKey=`${p.selectedId}|${mode}|${p.layout}`;if(selectionKey!==selectKey){selection();selectionKey=selectKey;}if(selectedBox&&(transitioning||movingFold||galleryMoving||liftMoving)){const obj=roots.get(k)?.get(p.selectedId??'');if(obj){obj.updateWorldMatrix(true,true);selectedBox.box.setFromObject(obj);}}
   if(selectionHalo&&(galleryMoving||liftMoving)){const obj=roots.get(k)?.get(p.selectedId??'');if(obj){obj.updateWorldMatrix(true,true);selectionHalo.update(new T.Box3().setFromObject(obj));}}
   if(showcaseKey!==!!p.showcase){showcaseKey=!!p.showcase;if(showcaseKey)productUserOrbit=false;}
   if(mode!=='vignette'&&(mode==='product'||p.cinematic||p.showcase)&&!productUserOrbit&&p.view!=='top'&&!reduced&&!cameraTween){controls.autoRotate=true;controls.autoRotateSpeed=p.showcase?.18:p.cinematic?.22:.5;}else controls.autoRotate=false;controls.enabled=!p.editable&&!scanning&&!cameraTween&&!dragged;if(cameraTween){const t=clamp((now-cameraTween.start)/950),e=t*t*(3-2*t);controls.target.lerpVectors(cameraTween.fromTarget,cameraTween.toTarget,e);camera.position.setFromSphericalCoords(T.MathUtils.lerp(cameraTween.from.radius,cameraTween.to.radius,e),T.MathUtils.lerp(cameraTween.from.phi,cameraTween.to.phi,e),T.MathUtils.lerp(cameraTween.from.theta,cameraTween.to.theta,e)).add(controls.target);camera.zoom=T.MathUtils.lerp(cameraTween.fromZoom,1,e);camera.lookAt(controls.target);camera.updateProjectionMatrix();if(t===1){cameraTween=null;resyncControls();}}else if(mode==='vignette'){controls.enabled=false;if(p.showcase&&!reduced)vignetteTime+=dt;const angle=.648+Math.sin(vignetteTime*.16)*.065;camera.position.set(5.96*Math.sin(angle),2.8,5.96*Math.cos(angle)+.35);camera.lookAt(controls.target);}else if(!p.editable)controls.update();let viewCamera:T.Camera=camera;if(mode==='old'&&scanning&&!reduced){scanEye.set(T.MathUtils.lerp(4.45,3.75,scanView.pan)-4.3,T.MathUtils.lerp(1.48,1.62,scanView.pan),T.MathUtils.lerp(3.25,2.85,scanView.pan)-2.9);scanOverviewPosition.copy(camera.position).sub(controls.target).applyAxisAngle(scanUp,scanView.orbit).add(controls.target);scanCamera.position.lerpVectors(scanOverviewPosition,scanEye,scanView.immersion);const distance=camera.position.distanceTo(controls.target),matchedFov=2*Math.atan((camera.top-camera.bottom)/(2*distance*camera.zoom))*180/Math.PI;scanCamera.fov=T.MathUtils.lerp(matchedFov,mobile?78:68,scanView.immersion);scanCamera.updateProjectionMatrix();const scanAzimuth=Math.atan2(camera.position.x-controls.target.x,camera.position.z-controls.target.z)+scanView.orbit;scanGaze.copy(scanEye).addScaledVector(scanUp,-.58);scanGaze.x-=Math.sin(scanAzimuth)*2.5;scanGaze.z-=Math.cos(scanAzimuth)*2.5;scanOverviewTarget.copy(controls.target).lerp(scanGaze,scanView.immersion);scanCamera.lookAt(scanOverviewTarget);const normalizer=Math.max(.1,scanCamera.position.distanceTo(scanOverviewTarget));for(let axis=0;axis<16;axis++)scanCamera.projectionMatrix.elements[axis]=T.MathUtils.lerp(camera.projectionMatrix.elements[axis],scanCamera.projectionMatrix.elements[axis]/normalizer,scanView.immersion);scanCamera.projectionMatrixInverse.copy(scanCamera.projectionMatrix).invert();viewCamera=scanCamera;}container!.dataset.activeCamera=viewCamera===scanCamera?'first-person':'orthographic';container!.dataset.scanCameraPosition=viewCamera.position.toArray().map(n=>n.toFixed(3)).join(',');const visibleIds=[...(roots.get(k)?.entries()??[])].filter(([,o])=>o.visible).map(([id])=>id).join(',');if(container!.dataset.visibleFurniture!==visibleIds)container!.dataset.visibleFurniture=visibleIds;const pose=camera.position.toArray().map(n=>n.toFixed(4)).join(',');if(container!.dataset.cameraPosition!==pose)container!.dataset.cameraPosition=pose;const signature=[pose,camera.zoom,layoutKey,viewKey,wallKey,p.selectedId,p.highlight,p.highlightNew,p.fold,foldBlend.toFixed(4),lightBlend.toFixed(4),planBlend.toFixed(4),galleryBlend.toFixed(4),extractionBlend.toFixed(4),visibleIds,(p.selectedIds??[]).join(','),p.furnitureOnly,feedbackKey,p.scan,p.replay].join('|');const moving=(scanning||mode==='move')&&!p.motionPaused||transitioning||liftMoving||!!cameraTween||mode==='layout'&&!!p.reveal&&!reduced&&now-revealStart<1800;if(moving||signature!==previousRender){budget(now,moving||controls.autoRotate||lastRenderAt>0&&now-lastRenderAt<1000);lastRenderAt=now;previousRender=signature;const calls=renderFrame(viewCamera);container!.dataset.renderCount=String(Number(container!.dataset.renderCount??0)+1);container!.dataset.drawCalls=String(calls);container!.dataset.pixelRatio=renderer.getPixelRatio().toFixed(2);}
  }
  const onMotionPreference=()=>{reduced=motionPreference.matches;if(reduced){controls.autoRotate=false;resyncControls();if(cameraTween)setView(true);}};
  motionPreference.addEventListener('change',onMotionPreference);
  frame=requestAnimationFrame(animate);
  return()=>{disposed=true;motionPreference.removeEventListener('change',onMotionPreference);cancelAnimationFrame(frame);observer.disconnect();visibilityObserver.disconnect();controls.dispose();benchTexture.dispose();window.removeEventListener('keydown',escape);window.removeEventListener('blur',blur);renderer.domElement.removeEventListener('lostpointercapture',cancel);renderer.domElement.removeEventListener('pointerleave',leave);renderer.domElement.removeEventListener('pointerdown',down,true);renderer.domElement.removeEventListener('pointermove',move);renderer.domElement.removeEventListener('pointercancel',cancel);renderer.domElement.removeEventListener('pointerup',up);renderer.domElement.removeEventListener('webglcontextlost',lost);clearBox();scene.traverse(o=>{if(o instanceof T.Mesh||o instanceof T.Points||o instanceof T.Line){allGeometry.add(o.geometry);const mats=Array.isArray(o.material)?o.material:[o.material];mats.forEach(m=>allMaterials.add(m));}});allGeometry.forEach(g=>g.dispose());const textures=new Set<T.Texture>();allMaterials.forEach(m=>{for(const value of Object.values(m))if(value instanceof T.Texture)textures.add(value);m.dispose();});textures.forEach(texture=>texture.dispose());surfaces.dispose();sun.shadow.dispose();environmentTarget.dispose();renderer.dispose();renderer.domElement.remove();if(live.current.apiRef)live.current.apiRef.current=null;};
 },[attempt]);
 return <div ref={host} className={styles.scene} data-editable={props.editable?'true':'false'} data-model-loaded={loaded?'true':'false'}><div className={styles.scanHud} aria-hidden><div className={styles.scanReticle}><i/><span>{tr('Keep the room in view','让房间保持在取景框内','讓房間保持在取景框內')}</span></div><div className={styles.scanStages}><b>{tr('01 · Point cloud','01 · 采集点云','01 · 採集點雲')}</b><b>{tr('02 · Triangle mesh','02 · 三角网格','02 · 三角網格')}</b><b>{tr('03 · Real surfaces','03 · 真实表面','03 · 真實表面')}</b></div><div className={styles.scanHudProgress}><i/></div></div>{(!loaded||error)&&<div className={styles.loading} role="status">{error?<><strong>Let’s reload this space.</strong><span>The 3D model could not be opened.</span><button onClick={()=>{setError(false);setAttempt(n=>n+1);}}>Try again</button></>:<><i/><span>Preparing your space…</span></>}</div>}</div>;
}
