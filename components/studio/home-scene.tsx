'use client';

import { useEffect, useRef, useState, type RefObject } from 'react';
import * as T from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { createIPhone, createMovingTruck, lidarPosition } from './scene-props';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { studioInventory, allExistingIds, oldPlacements, studioLayouts, type LayoutId, type Placement } from '@/lib/studio-data';
import styles from './studio.module.css';
import { footprint, isStaged, placementIssue } from '@/lib/studio-placement';
import { stagingArea } from '@/lib/studio-workspace';
import { cargoSlot, cargoScale, driveProgress, overheadTransfer, smoothMotion, tailgateOpen } from '@/lib/migration-motion';
import { scanTimeline, revealedPointCount } from '@/lib/scan-timeline';
import {createSelectionHalo} from './selection-halo';
import { createSurfaceMaps, finishMaterial } from './scene-finish';

export type SceneMode='old'|'empty'|'layout'|'product'|'move'|'vignette';
export type SceneApi={capture:()=>void;reset:()=>void;debug:()=>{yaw:number;up:number[];calls:number;visibleIds:string[];mode:SceneMode}};
export type DragFeedback={id:string;state:'moving'|'staged'|'blocked'};
export type HomeSceneProps={stagingLabel?:string;onDragFeedback?:(feedback:DragFeedback|null)=>void;diyView?:'top'|'3d';placements?:Placement[];editable?:boolean;highlightNew?:boolean;onMove?:(id:string,x:number,z:number)=>void;mode:SceneMode;layout?:LayoutId;scan?:number;migrationProgress?:number;readyToScan?:boolean;selectedIds?:string[];selectedId?:string|null;view?:'orbit'|'top';lighting?:'day'|'evening';fullWalls?:boolean;highlight?:boolean;detectedFurniture?:boolean;furnitureOnly?:boolean;fold?:boolean;autoFold?:boolean;productId?:string;cinematic?:boolean;showcase?:boolean;reveal?:boolean;presentation?:'impact';paused?:boolean;onInteract?:()=>void;replay?:number;apiRef?:RefObject<SceneApi|null>;onSelect?:(id:string)=>void;onReady?:(mode:SceneMode)=>void;onScanSamples?:(count:number)=>void};
type Transform={object:T.Object3D;from:T.Vector3;to:T.Vector3;fromYaw:number;toYaw:number;fromScale:number;show:boolean;delay:number};
const clamp=(n:number)=>Math.max(0,Math.min(1,n));
const ease=(n:number)=>1-Math.pow(1-clamp(n),3);
const materialList=(o:T.Mesh)=>(Array.isArray(o.material)?o.material:[o.material]) as T.MeshStandardMaterial[];
function batchStatic(root:T.Object3D){
 const parents:T.Object3D[]=[];root.traverse(o=>{if(o.children.length)parents.push(o);});
 for(const parent of parents){const buckets=new Map<T.Material,T.Mesh[]>();for(const o of [...parent.children]){if(!(o instanceof T.Mesh)||o.children.length||o.userData.wall||o.userData.upper||/lampshade|Pleated shade|Warm diffuser/i.test(o.name)||Array.isArray(o.material))continue;const bucket=buckets.get(o.material)??[];bucket.push(o);buckets.set(o.material,bucket);}
  for(const [material,objects]of buckets){if(objects.length<3)continue;const geometries=objects.map(o=>{o.updateMatrix();const g=o.geometry.index?o.geometry.toNonIndexed():o.geometry.clone();return g.applyMatrix4(o.matrix);});const merged=mergeGeometries(geometries);geometries.forEach(g=>g.dispose());if(!merged)continue;const m=new T.Mesh(merged,material);m.name=material.name+' details';objects.forEach(o=>o.removeFromParent());parent.add(m);}
 }
}
function pointCloud(root:T.Object3D,budget:number){
 root.updateMatrixWorld(true);
 const a=new T.Vector3(),b=new T.Vector3(),c=new T.Vector3(),edge=new T.Vector3(),cross=new T.Vector3();
 const surfaces:{mesh:T.Mesh;areas:Float64Array;area:number}[]=[];let totalArea=0;
 root.traverse(o=>{
  if(!(o instanceof T.Mesh)||o.userData.contactShadow)return;
  const position=o.geometry.getAttribute('position'),index=o.geometry.index,count=Math.floor((index?.count??position.count)/3),areas=new Float64Array(count);let area=0;
  for(let i=0;i<count;i++){
   a.fromBufferAttribute(position,index?index.getX(i*3):i*3).applyMatrix4(o.matrixWorld);
   b.fromBufferAttribute(position,index?index.getX(i*3+1):i*3+1).applyMatrix4(o.matrixWorld);
   c.fromBufferAttribute(position,index?index.getX(i*3+2):i*3+2).applyMatrix4(o.matrixWorld);
   area+=edge.subVectors(b,a).cross(cross.subVectors(c,a)).length()*.5;areas[i]=area;
  }
  if(area>0){surfaces.push({mesh:o,areas,area});totalArea+=area;}
 });
 const points:number[][]=[];let seed=42;const random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
 for(const {mesh,areas,area}of surfaces){
  const position=mesh.geometry.getAttribute('position'),index=mesh.geometry.index,count=Math.max(1,Math.round(budget*area/totalArea));
  for(let n=0;n<count;n++){
   const sample=random()*area;let low=0,high=areas.length-1;while(low<high){const mid=(low+high)>>>1;if(areas[mid]<sample)low=mid+1;else high=mid;}
   const i=low*3;a.fromBufferAttribute(position,index?index.getX(i):i).applyMatrix4(mesh.matrixWorld);b.fromBufferAttribute(position,index?index.getX(i+1):i+1).applyMatrix4(mesh.matrixWorld);c.fromBufferAttribute(position,index?index.getX(i+2):i+2).applyMatrix4(mesh.matrixWorld);
   const u=Math.sqrt(random()),v=random();a.multiplyScalar(1-u).addScaledVector(b,u*(1-v)).addScaledVector(c,u*v);points.push([a.x,a.y,a.z]);
  }
 }
 points.sort((a,b)=>a[0]-b[0]);const geometry=new T.BufferGeometry();geometry.setAttribute('position',new T.Float32BufferAttribute(points.flat(),3));
 const cloud=new T.Points(geometry,new T.PointsMaterial({color:'#619f86',size:.016,transparent:true,opacity:.8,sizeAttenuation:true,depthWrite:false}));cloud.name='LiDAR surface samples';return cloud;
}

export function HomeScene(props:HomeSceneProps){
 const host=useRef<HTMLDivElement>(null);const live=useRef(props);live.current=props;
 const [error,setError]=useState(false);const [loaded,setLoaded]=useState(false);const [attempt,setAttempt]=useState(0);
 useEffect(()=>{
  const container=host.current;if(!container)return;let disposed=false,frame=0,ready=false,loadSerial=0;const motionPreference=matchMedia('(prefers-reduced-motion: reduce)');let reduced=motionPreference.matches;const mobile=matchMedia('(max-width: 740px)').matches;
  let renderer:T.WebGLRenderer;try{renderer=new T.WebGLRenderer({alpha:true,antialias:true,powerPreference:'high-performance',preserveDrawingBuffer:false});}catch{setError(true);return;}
  renderer.setPixelRatio(Math.min(devicePixelRatio,mobile?1.35:1.8));renderer.setClearColor('#eaece6');renderer.outputColorSpace=T.SRGBColorSpace;renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=1.01;renderer.shadowMap.enabled=true;renderer.shadowMap.type=T.PCFShadowMap;renderer.shadowMap.autoUpdate=false;renderer.shadowMap.needsUpdate=true;renderer.localClippingEnabled=true;renderer.domElement.setAttribute('aria-label','Interactive 3D home; drag to rotate, scroll to zoom');container.appendChild(renderer.domElement);
  const scene=new T.Scene();const camera=new T.OrthographicCamera(-7,7,5,-5,.1,80);camera.up.set(0,1,0);camera.position.set(9.2,11.3,13.5);
  let controls=new OrbitControls(camera,renderer.domElement);controls.target.set(0,.35,0);controls.enableDamping=true;controls.dampingFactor=.075;controls.minPolarAngle=.2;controls.maxPolarAngle=1.3;controls.rotateSpeed=.65;controls.zoomSpeed=.85;controls.minZoom=.65;controls.maxZoom=3;controls.screenSpacePanning=true;
  const pmrem=new T.PMREMGenerator(renderer),room=new RoomEnvironment();const environmentTarget=pmrem.fromScene(room,.04);scene.environment=environmentTarget.texture;scene.environmentIntensity=.64;room.dispose();pmrem.dispose();
  const ambient=new T.HemisphereLight('#f4f5f0','#a1a292',1.05);scene.add(ambient);
  const fill=new T.DirectionalLight('#e3eaf0',.55);fill.position.set(7,8,-5);scene.add(fill);
  const sun=new T.DirectionalLight('#fff4e4',2.35);sun.position.set(-3,14,4);sun.castShadow=true;sun.shadow.mapSize.set(mobile?1024:2048,mobile?1024:2048);Object.assign(sun.shadow.camera,{left:-8,right:8,top:8,bottom:-8,near:.1,far:40});sun.shadow.normalBias=.012;sun.shadow.bias=-.00008;sun.shadow.radius=3.5;sun.shadow.intensity=.82;const rim=new T.DirectionalLight('#d9efe0',.28);rim.position.set(-8,5,-10);scene.add(sun,sun.target,rim);
  const ground=new T.Mesh(new T.PlaneGeometry(160,160),new T.ShadowMaterial({opacity:live.current.cinematic?.24:.18}));ground.rotation.x=-Math.PI/2;ground.position.y=live.current.mode==='vignette'?-.003:-.16;ground.receiveShadow=true;scene.add(ground);
  const lampIds=['F18','F11','F12','F15'];
  const warmLights=lampIds.map(()=>{const l=new T.PointLight('#ffcf91',0,3.5,2);scene.add(l);return l;});
  const surfaces=createSurfaceMaps(Math.min(renderer.capabilities.getMaxAnisotropy(),mobile?2:4));
  const lampMaterials=new Set<T.MeshStandardMaterial>();
  const contactMaterials=new Set<T.MeshBasicMaterial>();
  const lampPosition=new T.Vector3();
  const dayBackground=new T.Color('#e9e9e2'),nightBackground=new T.Color('#606c67'),heroBackground=new T.Color('#17271f');
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
  const loader=new GLTFLoader();let vignetteTime=0,revealStart=0;const phone=createIPhone();scene.add(phone);phone.visible=false;
  const sweep=new T.Mesh(new T.PlaneGeometry(6.6,2.75),new T.MeshBasicMaterial({color:'#90dfb6',transparent:true,opacity:.1,side:T.DoubleSide,depthWrite:false}));sweep.rotation.y=Math.PI/2;sweep.position.y=1.35;scene.add(sweep);sweep.visible=false;
  const rayGeo=new T.BufferGeometry();rayGeo.setAttribute('position',new T.BufferAttribute(new Float32Array(144),3));const scanRays=new T.LineSegments(rayGeo,new T.LineBasicMaterial({color:'#74c9a5',transparent:true,opacity:.3,depthWrite:false}));scene.add(scanRays);scanRays.visible=false;
  let activeRoot:T.Group|null=null,mode:SceneMode=live.current.mode,modeKey='',layoutKey='',viewKey='',wallKey='',selectionKey='',presentationKey='',showcaseKey=false,lastReplay=-1,selectedBox:T.Box3Helper|null=null,transitions:Transform[]=[],transitionStart=0,transitionEnd=0,lastFrame=0,lightBlend=0,foldBlend=0,productUserOrbit=false;
  let extractionBlend=0,galleryBlend=0,lastPointCount=-1;const furnitureLift=new Map<string,number>();
  const detectedGreen=new T.Color('#719c76'),selectionGlow=new T.Color('#fff5de');
  const center=new T.Vector3(-4.3,0,-2.9);
  let migration:{truck:T.Group;flights:{id:string;source:T.Object3D;carry:T.Object3D;start:T.Vector3;cargo:T.Vector3;cargoScale:number;oldYaw:number}[]}|null=null;
  async function buildMove(){
   const [old,empty]=await Promise.all([load('old'),load('empty')]);if(disposed)throw Error('Scene disposed');
   const g=new T.Group();g.name='A move, in three acts';const oldWrap=new T.Group(),newWrap=new T.Group();oldWrap.position.set(-2.8,0,-.7);newWrap.position.set(2.8,0,-.7);oldWrap.scale.setScalar(.42);newWrap.scale.setScalar(.42);const oldCopy=old.clone(true),newCopy=empty.clone(true);oldCopy.traverse(o=>{if(o.userData.layer==='architecture')o.visible=true;if(o.userData.selectable){const pose=oldPlacements.find(p=>p.id===o.userData.id);if(pose){o.position.set(pose.x,0,pose.z);o.rotation.set(0,pose.rotation*Math.PI/180,0);o.scale.setScalar(1);}}});oldCopy.visible=true;newCopy.visible=true;oldWrap.add(oldCopy);newWrap.add(newCopy);g.add(oldWrap,newWrap);scene.add(g);g.updateMatrixWorld(true);
   const truck=createMovingTruck();truck.position.set(-2.8,-.025,2.25);truck.scale.setScalar(.7);g.add(truck);const flights:{id:string;source:T.Object3D;carry:T.Object3D;start:T.Vector3;cargo:T.Vector3;cargoScale:number;oldYaw:number}[]=[];
   oldCopy.traverse(o=>{if(!o.userData.selectable)return;const copy=o.clone(true);copy.position.set(0,0,0);copy.scale.setScalar(1);const oldYaw=oldPlacements.find(p=>p.id===o.userData.id)?.rotation??0;copy.rotation.set(0,0,0);const carry=new T.Group();carry.add(copy);carry.userData={id:o.userData.id,origin:'existing',selectable:true};g.add(carry);const slot=cargoSlot(flights.length);flights.push({id:o.userData.id,source:o,carry,start:o.getWorldPosition(new T.Vector3()),cargo:new T.Vector3(slot.x,slot.y,slot.z),cargoScale:cargoScale(o.userData.dimensions),oldYaw:oldYaw*Math.PI/180});});
   migration={truck,flights};roots.set('move',new Map(flights.map(f=>[f.id,f.carry])));models.set('move',g);g.visible=false;
   g.traverse(o=>{if(o.userData.contactShadow){o.visible=false;return;}if(o instanceof T.Mesh){o.castShadow=!materialList(o).every(m=>m.name.includes('tailored seam'));o.receiveShadow=true;for(const m of materialList(o)){const base=bases.get(m);if(base){m.opacity=base.opacity;m.transparent=base.transparent;m.color.copy(base.color);}}}});
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
  function prepare(raw:T.Group,key:string){
   batchStatic(raw);raw.position.copy(key.startsWith('product')||key==='vignette'?new T.Vector3():center);const clip=new T.Plane(new T.Vector3(-1,0,0),100);clips.set(key,clip);const items=new Map<string,T.Object3D>();
   raw.traverse(o=>{if(o.userData.selectable)items.set(o.userData.id,o);if(o instanceof T.Mesh){o.castShadow=!materialList(o).every(m=>m.name.includes('tailored seam'));o.receiveShadow=true;const mats=materialList(o).map(m=>{const copy=m.clone();finishMaterial(copy,surfaces,o.name);if(copy.userData.lampGlow)lampMaterials.add(copy);copy.clippingPlanes=[clip];copy.clipShadows=true;bases.set(copy,{color:copy.color.clone(),opacity:copy.opacity,transparent:copy.transparent,emissive:copy.emissive.clone(),emissiveIntensity:copy.emissiveIntensity});allMaterials.add(copy);return copy;});o.material=mats.length===1?mats[0]:mats;allGeometry.add(o.geometry);}});
   for(const object of items.values())addContactShadow(object,clip);
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
    extras.forEach((gltf,index)=>{let object:T.Object3D|undefined;gltf.scene.traverse(o=>{if(o.userData.selectable)object=o;});if(!object)return;object.userData.id=extraIds[index];object.userData.origin='new';object.removeFromParent();raw.add(object);batchStatic(object);roots.get(key)!.set(object.userData.id,object);object.visible=false;object.traverse(o=>{if(o instanceof T.Mesh){o.castShadow=!materialList(o).every(m=>m.name.includes('tailored seam'));o.receiveShadow=true;const m=(o.material as T.MeshStandardMaterial).clone();finishMaterial(m,surfaces,o.name);if(m.userData.lampGlow)lampMaterials.add(m);m.clippingPlanes=[clips.get(key)!];m.clipShadows=true;bases.set(m,{color:m.color.clone(),opacity:m.opacity,transparent:m.transparent,emissive:m.emissive.clone(),emissiveIntensity:m.emissiveIntensity});o.material=m;allMaterials.add(m);allGeometry.add(o.geometry);}});addContactShadow(object,clips.get(key)!);});
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

  function resize(){const w=container!.clientWidth,h=container!.clientHeight;if(!w||!h)return;renderer.setSize(w,h,false);const ratio=w/h,baseSpan=mode==='product'?2.5:live.current.cinematic&&window.innerWidth<740?13.4:ratio<.9?15.8:mode==='move'?11.6:10.9,base=(mode==='old'||mode==='empty')&&!live.current.cinematic?Math.max(baseSpan,(live.current.scan!==undefined||live.current.readyToScan?15.2:13.4)/ratio):baseSpan,impact=live.current.presentation==='impact',span=live.current.editable?Math.max(11.9,(live.current.diyView==='3d'?13.8:9.9)/ratio):mode==='vignette'?Math.max(3.3,4.4/ratio):impact?Math.max(9.6,12/ratio):mode==='layout'&&mobile?Math.max(base,11.7/ratio):base,offset=0;camera.left=-span*ratio/2;camera.right=span*ratio/2;camera.top=span/2-offset;camera.bottom=-span/2-offset;camera.updateProjectionMatrix();}
  function observeCamera(){controls.addEventListener('change',()=>{container!.dataset.cameraYaw=String(controls.getAzimuthalAngle());container!.dataset.cameraUp=camera.up.toArray().join(',');});}
  function resyncControls(){const target=controls.target.clone();controls.dispose();controls=new OrbitControls(camera,renderer.domElement);controls.target.copy(target);controls.enableDamping=true;controls.dampingFactor=.075;controls.minPolarAngle=live.current.view==='top'?0:.2;controls.maxPolarAngle=1.3;controls.rotateSpeed=.65;controls.zoomSpeed=.85;controls.minZoom=.65;controls.maxZoom=3;controls.screenSpacePanning=true;controls.enableRotate=live.current.view!=='top';controls.mouseButtons.LEFT=live.current.view==='top'?T.MOUSE.PAN:T.MOUSE.ROTATE;controls.touches.ONE=live.current.view==='top'?T.TOUCH.PAN:T.TOUCH.ROTATE;observeCamera();controls.update();}
  observeCamera();
  const observer=new ResizeObserver(resize);observer.observe(container);resize();setView(true);
  function wallCut(){for(const model of models.values())model.traverse(o=>{if(o.userData.wall){const w=o.userData.wall,h=live.current.fullWalls?w.height:Math.max(0,Math.min(w.height,w.cutHeight-w.bottom));o.scale.y=h/w.height;o.position.y=w.bottom+h/2;o.visible=h>0;}if(o.userData.upper)o.visible=!!live.current.fullWalls||!!o.userData.rear;});renderer.shadowMap.needsUpdate=true;}
  let selectionHalo:ReturnType<typeof createSelectionHalo>|null=null;
  function clearBox(){selectionHalo?.dispose();selectionHalo=null;if(selectedBox){scene.remove(selectedBox);selectedBox.geometry.dispose();(selectedBox.material as T.Material).dispose();selectedBox=null;}}
  function selection(){clearBox();const key=mode==='product'?`product:${live.current.productId}`:mode;const object=roots.get(key)?.get(live.current.selectedId??'');if(object&&object.visible){object.updateWorldMatrix(true,true);if(mode==='old'){selectionHalo=createSelectionHalo();selectionHalo.update(new T.Box3().setFromObject(object));scene.add(selectionHalo.object);return;}selectedBox=new T.Box3Helper(new T.Box3().setFromObject(object),object.userData.origin==='new'?0xb78e59:0x5b8a70);scene.add(selectedBox);}}
  // GLTF may encode a 180° yaw as Euler X/Z rotations; set all axes when applying a floor-plan yaw.
  function applyLayout(now:number){
   const items=roots.get('layout');if(!items)return;const layout=studioLayouts.find(l=>l.id===(live.current.layout??'a'))!;const selected=new Set(live.current.selectedIds??allExistingIds);const targets=new Map((live.current.placements??layout.placements).filter(p=>p.origin==='new'||selected.has(p.id)).map(p=>[p.id,p]));const first=!layoutKey||(live.current.replay??0)!==lastReplay;transitions=[];
   let index=0;for(const [id,o]of items){const target=targets.get(id);if(target){if(live.current.editable){o.position.set(target.x,0,target.z);o.rotation.set(0,target.rotation*Math.PI/180,0);o.scale.setScalar(1);o.visible=true;continue;}if(first||!o.visible){const from=oldPlacements.find(p=>p.id===id);o.position.set(from?.x??target.x,0,from?.z??target.z);o.rotation.set(0,(from?.rotation??target.rotation)*Math.PI/180,0);o.scale.setScalar(.03);}const yaw=target.rotation*Math.PI/180;const delta=Math.atan2(Math.sin(yaw-o.rotation.y),Math.cos(yaw-o.rotation.y));transitions.push({object:o,from:o.position.clone(),to:new T.Vector3(target.x,0,target.z),fromYaw:o.rotation.y,toYaw:o.rotation.y+delta,fromScale:o.scale.x,show:true,delay:reduced?0:index++*38});o.visible=true;}else if(live.current.editable){o.visible=false;}else if(o.visible)transitions.push({object:o,from:o.position.clone(),to:o.position.clone().add(new T.Vector3(0,.3,0)),fromYaw:o.rotation.y,toYaw:o.rotation.y,fromScale:o.scale.x,show:false,delay:0});}
   transitionStart=now;transitionEnd=now+(reduced?1:2100);renderer.shadowMap.needsUpdate=true;selectionKey='';
  }
  async function ensureMode(){const key=live.current.mode==='product'?`product:${live.current.productId??'N01'}`:live.current.mode;if(modeKey===key)return;const serial=++loadSerial;modeKey=key;mode=live.current.mode;ready=false;setLoaded(false);setError(false);
   try{const next=await load(key);if(disposed||serial!==loadSerial)return;const hadActiveRoot=!!activeRoot;for(const m of models.values())m.visible=false;for(const c of clouds.values())c.visible=false;for(const w of wires.values())w.visible=false;activeRoot=next;activeRoot.visible=true;wallCut();layoutKey='';selectionKey='';viewKey=live.current.view??'orbit';resize();if(mode==='layout'&&live.current.reveal&&!reduced)camera.zoom=.86;setView(!hadActiveRoot||(mode!=='move'&&mode!=='layout'));
    if(mode==='old'||mode==='empty'){if(!clouds.has(key)){clouds.set(key,pointCloud(next,mobile?28000:65000));scene.add(clouds.get(key)!);const w=next.clone(true);const material=new T.MeshBasicMaterial({color:'#6caa91',wireframe:true,transparent:true,opacity:.18,depthWrite:false,clippingPlanes:[new T.Plane(new T.Vector3(-1,0,0),-4.55),new T.Plane(new T.Vector3(1,0,0),4.55)]});allMaterials.add(material);w.traverse(o=>{if(o instanceof T.Mesh){if(o.userData.contactShadow)o.visible=false;o.material=material;o.castShadow=false;o.receiveShadow=false;}});w.visible=false;scene.add(w);wires.set(key,w);}}
    if(renderer.extensions.has("KHR_parallel_shader_compile")) await renderer.compileAsync(scene,camera); else renderer.compile(scene,camera);if(disposed||serial!==loadSerial)return;renderer.shadowMap.needsUpdate=true;renderer.render(scene,camera);ready=true;revealStart=performance.now();setLoaded(true);live.current.onReady?.(mode);if(mode==='empty')void load('layout').catch(()=>{});
   }catch(e){if(!disposed&&serial===loadSerial){setError(true);console.error('Unable to load spatial model',e);}}
  }
  const raycaster=new T.Raycaster();let pointer:[number,number]|null=null;
  let dragged:T.Object3D|null=null,dragStart:T.Vector3|null=null,dragPointer:number|null=null;
  const dragOffset=new T.Vector3();let feedbackKey='';
  function feedback(value:DragFeedback|null){const key=JSON.stringify(value);if(key!==feedbackKey){feedbackKey=key;live.current.onDragFeedback?.(value);}}
  function aim(e:PointerEvent){const r=renderer.domElement.getBoundingClientRect();raycaster.setFromCamera(new T.Vector2((e.clientX-r.left)/r.width*2-1,-(e.clientY-r.top)/r.height*2+1),camera);}
  function floorPoint(e:PointerEvent){aim(e);return raycaster.ray.intersectPlane(new T.Plane(new T.Vector3(0,1,0),0),new T.Vector3());}
  function pick(e:PointerEvent){if(!activeRoot)return null;aim(e);for(const hit of raycaster.intersectObject(activeRoot,true)){if(hit.object.userData.contactShadow)continue;let visible=true;for(let o:T.Object3D|null=hit.object;o;o=o.parent)if(!o.visible)visible=false;if(!visible)continue;let object:T.Object3D|null=hit.object;while(object&&!object.userData.selectable)object=object.parent;if(object)return object;}return null;}
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
  const up=(e:PointerEvent)=>{if(dragged&&e.pointerId!==dragPointer)return;if(finishDrag())return;if(!pointer||!activeRoot||Math.hypot(e.clientX-pointer[0],e.clientY-pointer[1])>5||live.current.scan!==undefined)return;const r=renderer.domElement.getBoundingClientRect();raycaster.setFromCamera(new T.Vector2((e.clientX-r.left)/r.width*2-1,-(e.clientY-r.top)/r.height*2+1),camera);for(const hit of raycaster.intersectObject(activeRoot,true)){let visible=true;for(let o:T.Object3D|null=hit.object;o;o=o.parent)if(!o.visible)visible=false;if(!visible)continue;let o:T.Object3D|null=hit.object;while(o&&!o.userData.selectable)o=o.parent;if(o){live.current.onSelect?.(o.userData.id);return;}}};
  renderer.domElement.addEventListener('pointerdown',down,true);renderer.domElement.addEventListener('pointermove',move);renderer.domElement.addEventListener('pointercancel',cancel);renderer.domElement.addEventListener('pointerup',up);
  renderer.domElement.tabIndex=0;renderer.domElement.addEventListener('lostpointercapture',cancel);renderer.domElement.addEventListener('pointerleave',leave);window.addEventListener('keydown',escape);window.addEventListener('blur',blur);
  const lost=(e:Event)=>{e.preventDefault();setError(true);};renderer.domElement.addEventListener('webglcontextlost',lost);
  const api:SceneApi={capture(){renderer.render(scene,camera);const a=document.createElement('a');a.download=`renest-${mode}-${live.current.layout??'old'}-${live.current.view??'orbit'}.png`;a.href=renderer.domElement.toDataURL('image/png');a.click();},reset(){setView();},debug(){return{yaw:controls.getAzimuthalAngle(),up:camera.up.toArray(),calls:renderer.info.render.calls,visibleIds:[...(roots.get(mode)?.entries()??[])].filter(([,o])=>o.visible).map(([id])=>id),mode};}};if(live.current.apiRef)live.current.apiRef.current=api;
  function animate(now:number){if(disposed)return;frame=requestAnimationFrame(animate);if(document.hidden||live.current.paused){lastFrame=now;return;}const dt=Math.min(.05,(now-lastFrame)/1000||.016);lastFrame=now;void ensureMode();if(!ready||!activeRoot){renderer.render(scene,camera);return;}
   const p=live.current;mode=p.mode;const k=mode==='product'?`product:${p.productId}`:mode;
   if(dragged&&(!p.editable||mode!=='layout'))finishDrag(true);
   workbench.visible=mode==='layout'&&(!!p.editable||!!p.placements?.some(isStaged));if(workbench.visible&&benchLabel!==p.stagingLabel){benchLabel=p.stagingLabel??'TEMPORARY SPACE';drawWorkbench(benchLabel);}
   const framingKey=`${!!p.editable}|${p.diyView??'top'}|${p.presentation??''}|${p.scan!==undefined||!!p.readyToScan}`;if(presentationKey!==framingKey){presentationKey=framingKey;resize();}
   const nextViewKey=`${p.view??'orbit'}|${!!p.editable}|${p.diyView??'top'}`;if(viewKey!==nextViewKey){setView();viewKey=nextViewKey;renderer.domElement.setAttribute('aria-label',p.editable?`Furniture DIY workspace; fixed ${p.diyView==='3d'?'3D':'top'} view; drag furniture to move, Escape to cancel`:'Interactive 3D home; drag to rotate, scroll to zoom');}if(wallKey!==String(p.fullWalls)){wallCut();wallKey=String(p.fullWalls);}
   const key=`${p.layout}|${(p.selectedIds??allExistingIds).join(',')}|${p.replay??0}|${JSON.stringify(p.placements??[])}`;if(mode==='layout'&&key!==layoutKey){applyLayout(now);layoutKey=key;lastReplay=p.replay??0;}
   const transitioning=now<transitionEnd;
   if(transitions.length){for(const tr of transitions){const t=reduced?1:clamp((now-transitionStart-tr.delay)/1300),e=ease(t);tr.object.position.lerpVectors(tr.from,tr.to,e);tr.object.position.y+=reduced?0:Math.sin(Math.PI*t)*.42;tr.object.rotation.set(0,T.MathUtils.lerp(tr.fromYaw,tr.toYaw,e),0);tr.object.scale.setScalar(T.MathUtils.lerp(tr.fromScale,tr.show?1:.001,e));if(t===1&&!tr.show)tr.object.visible=false;}renderer.shadowMap.needsUpdate=true;if(!transitioning)transitions=[];}
   const scanning=p.scan!==undefined,progress=p.scan??1;const awaiting=!!p.readyToScan;
   const timeline=scanTimeline(awaiting?0:progress);
   for(const [name,cloud]of clouds){
    cloud.visible=name===k&&(scanning||awaiting);
    if(cloud.visible){const positions=cloud.geometry.getAttribute('position');
     const count=awaiting?positions.count:timeline.beamActive||progress>=.98?revealedPointCount(positions.array,timeline.beamX):0;
     cloud.geometry.setDrawRange(0,count);(cloud.material as T.PointsMaterial).opacity=awaiting?.12:timeline.pointOpacity;
     container!.dataset.scanPointCount=String(count);if(scanning&&count!==lastPointCount){lastPointCount=count;p.onScanSamples?.(count);}
     container!.dataset.scanPointMaxX=count?String(positions.getX(count-1)):'';
    }
   }
   for(const [name,w]of wires){w.visible=name===k&&scanning&&timeline.beamActive;if(w.visible)w.traverse(o=>{if(o instanceof T.Mesh){const material=o.material as T.MeshBasicMaterial;material.opacity=.22*timeline.pointOpacity/.8;material.clippingPlanes![0].constant=timeline.beamX;material.clippingPlanes![1].constant=-timeline.surfaceX;}});}
   const clip=clips.get(k),clipX=scanning?timeline.surfaceX:100;
   if(clip&&clip.constant!==clipX){clip.constant=clipX;renderer.shadowMap.needsUpdate=true;}
   const solidVisible=!awaiting&&(!scanning||timeline.surfaceActive);
   if(activeRoot.visible!==solidVisible)renderer.shadowMap.needsUpdate=true;
   activeRoot.visible=solidVisible;
   container!.dataset.scanClipX=String(clip?.constant??100);
   container!.dataset.scanSolidVisible=String(activeRoot.visible);
   container!.dataset.scanBeamX=String(timeline.beamX);
   container!.dataset.scanProgress=String(progress);
   phone.visible=(scanning||awaiting)&&mode!=='product';sweep.visible=scanning&&timeline.beamActive;scanRays.visible=sweep.visible;
   if(phone.visible){
    const travel=timeline.sweep;
    phone.position.set(-5.7-Math.sin(travel*Math.PI)*.25,1.4+Math.sin(travel*Math.PI*2)*.05,3.4-travel*5.6);
    const facing=new T.Object3D();facing.position.copy(phone.position);facing.lookAt(phone.position.clone().multiplyScalar(2).sub(camera.position));const front=facing.quaternion.clone();
    facing.lookAt(new T.Vector3(timeline.beamX,1.25,0));phone.quaternion.slerpQuaternions(front,facing.quaternion,timeline.turn);
    phone.rotateZ(Math.sin(travel*Math.PI*3)*.035);phone.scale.setScalar(1.75);phone.updateMatrixWorld(true);
    container!.dataset.scanPhonePosition=phone.position.toArray().map(n=>n.toFixed(4)).join(',');
    const origin=phone.localToWorld(lidarPosition.clone());sweep.position.x=timeline.beamX;
    const vertices=rayGeo.attributes.position as T.BufferAttribute;for(let i=0;i<24;i++){vertices.setXYZ(i*2,origin.x,origin.y,origin.z);vertices.setXYZ(i*2+1,timeline.beamX,.08+(i%6)*.5,-2.8+Math.floor(i/6)*1.9);}vertices.needsUpdate=true;
    phone.traverse(o=>{if(o.name==='LiDAR pulse'){const pulse=timeline.beamActive?1+(Math.sin(now*.007)+1)*.3:1;o.scale.setScalar(pulse);}});
   }
   if(mode==='move'&&migration){
    const progress=p.migrationProgress??0,drive=driveProgress(progress),truck=migration.truck;
    truck.position.set(T.MathUtils.lerp(-2.8,2.8,drive),-.025,2.25);truck.rotation.y=0;truck.updateMatrixWorld(true);
    for(const wheel of truck.userData.wheels as T.Group[])wheel.rotation.z=-drive*5.6/(.25*.7);
    (truck.userData.ramp as T.Group).rotation.z=T.MathUtils.lerp(-Math.PI/2,.72,tailgateOpen(progress));
    const chosen=new Set(p.selectedIds??allExistingIds),plan=studioLayouts.find(l=>l.id===(p.layout??'a'))!;let index=0;
    for(const f of migration.flights){
     if(!chosen.has(f.id)){f.source.visible=true;f.carry.visible=false;continue;}
     const order=index++,loadP=clamp((progress-.025-order*.011)/.14),unloadP=clamp((progress-.70-order*.009)/.14),target=plan.placements.find(t=>t.id===f.id);
     const cargo=truck.localToWorld(f.cargo.clone());f.source.visible=loadP===0;f.carry.visible=loadP>0;
     if(progress<.66||!target){
      const point=overheadTransfer(f.start.toArray(),cargo.toArray(),loadP);f.carry.position.set(point[0],point[1],point[2]);
      f.carry.scale.setScalar(T.MathUtils.lerp(.42,f.cargoScale,smoothMotion(loadP/.25)));
      f.carry.rotation.y=T.MathUtils.lerp(f.oldYaw,0,smoothMotion(loadP/.5));
     }else{
      const dest=new T.Vector3(2.8+(target.x-4.3)*.42,0,-.7+(target.z-2.9)*.42),point=overheadTransfer(cargo.toArray(),dest.toArray(),unloadP);
      f.carry.position.set(point[0],point[1],point[2]);
      f.carry.scale.setScalar(T.MathUtils.lerp(f.cargoScale,.42,smoothMotion((unloadP-.75)/.25)));
      f.carry.rotation.y=target.rotation*Math.PI/180*smoothMotion(unloadP/.75);
     }

    }renderer.shadowMap.needsUpdate=true;
   }

   if(scanning)renderer.shadowMap.needsUpdate=true;
   const detected=mode==='old'&&!!p.detectedFurniture&&!scanning&&!awaiting;
   extractionBlend=mode!=='old'?0:reduced?(detected?1:0):T.MathUtils.damp(extractionBlend,detected?1:0,7,dt);
   const gallery=detected&&!!p.furnitureOnly,previousGallery=galleryBlend;
   galleryBlend=mode!=='old'?0:reduced?(gallery?1:0):T.MathUtils.damp(galleryBlend,gallery?1:0,8,dt);
   if(Math.abs(galleryBlend-(gallery?1:0))<.002)galleryBlend=gallery?1:0;
   const galleryMoving=previousGallery!==galleryBlend;let liftMoving=false;
   if(roots.has('old')){let i=0;for(const [id,o]of roots.get('old')!){const original=oldPlacements.find(item=>item.id===id)!;const x=.72+(i%6)*1.44,z=.65+Math.floor(i/6)*2.05;i++;const before=furnitureLift.get(id)??0,target=detected&&p.selectedId===id?1:0,lift=reduced?target:T.MathUtils.damp(before,target,10,dt);furnitureLift.set(id,lift);if(Math.abs(before-lift)>.0001)liftMoving=true;o.position.set(T.MathUtils.lerp(original.x,x,galleryBlend),lift*.22,T.MathUtils.lerp(original.z,z,galleryBlend));o.rotation.set(0,T.MathUtils.lerp(original.rotation*Math.PI/180,0,galleryBlend),0);o.scale.setScalar(T.MathUtils.lerp(1,.58,galleryBlend)*(1+lift*T.MathUtils.lerp(.04,.16,galleryBlend)));}models.get('old')!.traverse(o=>{if(o.userData.layer==='architecture')o.visible=galleryBlend===0;});}
   if(galleryMoving||liftMoving)renderer.shadowMap.needsUpdate=true;
   container!.dataset.extractionMode=detected?(gallery?'gallery':'in-room'):'none';container!.dataset.highlightedFurniture=detected?(p.selectedId??''):'';
   if(selectedIds!==p.selectedIds){selectedIds=p.selectedIds;selectedSet=new Set(selectedIds??allExistingIds);}const set=selectedSet;for(const [id,obj]of roots.get(k)??[]){obj.traverse(o=>{if(o instanceof T.Mesh)for(const m of materialList(o)){const base=bases.get(m);if(!base)continue;const muted=mode==='old'&&!set.has(id)&&!scanning&&p.selectedId!==id;const color=obj.userData.origin==='new'?(p.highlightNew?newHighlight:base.color):(p.highlight?reuseHighlight:base.color);m.color.copy(color);const selectedLift=mode==='old'&&detected?(furnitureLift.get(id)??0):0;if(mode==='old'&&extractionBlend>0)m.color.lerp(detectedGreen,extractionBlend*(1-galleryBlend)*(1-selectedLift));m.color.multiplyScalar(1+selectedLift*.06);m.emissive.copy(base.emissive).lerp(selectionGlow,selectedLift*.022);m.emissiveIntensity=base.emissiveIntensity;m.opacity=muted?.24:base.opacity;const transparent=muted||base.transparent;if(m.transparent!==transparent){m.transparent=transparent;m.needsUpdate=true;}}});}
   const evening=p.lighting==='evening';
   lightBlend=reduced?(evening?1:0):T.MathUtils.damp(lightBlend,evening?1:0,3,dt);
   planBlend=reduced?(p.view==='top'?1:0):T.MathUtils.damp(planBlend,p.view==='top'?1:0,4,dt);
   // Plan mode is a softly lit architectural study; evening keeps cool fill and warm practicals.
   const night=lightBlend*(1-planBlend);
   background.copy(p.cinematic?heroBackground:dayBackground);if(!p.cinematic)background.lerp(nightBackground,night);
   renderer.setClearColor(background,p.cinematic?1:0);if(ground.material instanceof T.MeshStandardMaterial)ground.material.color.copy(background);
   sun.color.copy(daySun).lerp(nightSun,night);sun.intensity=T.MathUtils.lerp(2.15,.78,night)*(1-planBlend*.16);
   sun.position.set(T.MathUtils.lerp(-3,-.8,planBlend),T.MathUtils.lerp(14,19,planBlend),T.MathUtils.lerp(4,1.2,planBlend));
   sun.shadow.intensity=T.MathUtils.lerp(.86,.34,planBlend);sun.shadow.radius=T.MathUtils.lerp(3.5,2,planBlend);
   ambient.intensity=T.MathUtils.lerp(.82,.46,night)+planBlend*.16;fill.intensity=T.MathUtils.lerp(.42,.32,night);
   scene.environmentIntensity=T.MathUtils.lerp(.55,.3,night);
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
   if(mode!=='vignette'&&(mode==='product'||p.cinematic||p.showcase)&&!productUserOrbit&&p.view!=='top'&&!reduced&&!cameraTween){controls.autoRotate=true;controls.autoRotateSpeed=p.showcase?.18:p.cinematic?.22:.5;}else controls.autoRotate=false;controls.enabled=!p.editable&&!scanning&&!cameraTween&&!dragged;if(cameraTween){const t=clamp((now-cameraTween.start)/950),e=t*t*(3-2*t);controls.target.lerpVectors(cameraTween.fromTarget,cameraTween.toTarget,e);camera.position.setFromSphericalCoords(T.MathUtils.lerp(cameraTween.from.radius,cameraTween.to.radius,e),T.MathUtils.lerp(cameraTween.from.phi,cameraTween.to.phi,e),T.MathUtils.lerp(cameraTween.from.theta,cameraTween.to.theta,e)).add(controls.target);camera.zoom=T.MathUtils.lerp(cameraTween.fromZoom,1,e);camera.lookAt(controls.target);camera.updateProjectionMatrix();if(t===1){cameraTween=null;resyncControls();}}else if(mode==='vignette'){controls.enabled=false;if(p.showcase&&!reduced)vignetteTime+=dt;const angle=.648+Math.sin(vignetteTime*.16)*.065;camera.position.set(5.96*Math.sin(angle),2.8,5.96*Math.cos(angle)+.35);camera.lookAt(controls.target);}else if(!p.editable)controls.update();const visibleIds=[...(roots.get(k)?.entries()??[])].filter(([,o])=>o.visible).map(([id])=>id).join(',');if(container!.dataset.visibleFurniture!==visibleIds)container!.dataset.visibleFurniture=visibleIds;const pose=camera.position.toArray().map(n=>n.toFixed(4)).join(',');if(container!.dataset.cameraPosition!==pose)container!.dataset.cameraPosition=pose;renderer.render(scene,camera);
  }
  const onMotionPreference=()=>{reduced=motionPreference.matches;if(reduced){controls.autoRotate=false;resyncControls();if(cameraTween)setView(true);}};
  motionPreference.addEventListener('change',onMotionPreference);
  frame=requestAnimationFrame(animate);
  return()=>{disposed=true;motionPreference.removeEventListener('change',onMotionPreference);cancelAnimationFrame(frame);observer.disconnect();controls.dispose();benchTexture.dispose();window.removeEventListener('keydown',escape);window.removeEventListener('blur',blur);renderer.domElement.removeEventListener('lostpointercapture',cancel);renderer.domElement.removeEventListener('pointerleave',leave);renderer.domElement.removeEventListener('pointerdown',down,true);renderer.domElement.removeEventListener('pointermove',move);renderer.domElement.removeEventListener('pointercancel',cancel);renderer.domElement.removeEventListener('pointerup',up);renderer.domElement.removeEventListener('webglcontextlost',lost);clearBox();scene.traverse(o=>{if(o instanceof T.Mesh||o instanceof T.Points||o instanceof T.Line){allGeometry.add(o.geometry);const mats=Array.isArray(o.material)?o.material:[o.material];mats.forEach(m=>allMaterials.add(m));}});allGeometry.forEach(g=>g.dispose());const textures=new Set<T.Texture>();allMaterials.forEach(m=>{for(const value of Object.values(m))if(value instanceof T.Texture)textures.add(value);m.dispose();});textures.forEach(texture=>texture.dispose());surfaces.dispose();sun.shadow.dispose();environmentTarget.dispose();renderer.dispose();renderer.domElement.remove();if(live.current.apiRef)live.current.apiRef.current=null;};
 },[attempt]);
 return <div ref={host} className={styles.scene} data-editable={props.editable?'true':'false'} data-model-loaded={loaded?'true':'false'}>{(!loaded||error)&&<div className={styles.loading} role="status">{error?<><strong>Let’s reload this space.</strong><span>The 3D model could not be opened.</span><button onClick={()=>{setError(false);setAttempt(n=>n+1);}}>Try again</button></>:<><i/><span>Preparing your space…</span></>}</div>}</div>;
}
