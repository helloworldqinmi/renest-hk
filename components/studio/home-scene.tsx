'use client';

import { useEffect, useRef, useState, type RefObject } from 'react';
import * as T from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { createIPhone, createMovingTruck, lidarPosition } from './scene-props';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { allExistingIds, oldPlacements, studioLayouts, type LayoutId } from '@/lib/studio-data';
import styles from './studio.module.css';

export type SceneMode='old'|'empty'|'layout'|'product'|'move';
export type SceneApi={capture:()=>void;reset:()=>void;debug:()=>{yaw:number;up:number[];calls:number;visibleIds:string[];mode:SceneMode}};
export type HomeSceneProps={mode:SceneMode;layout?:LayoutId;scan?:number;migrationProgress?:number;readyToScan?:boolean;selectedIds?:string[];selectedId?:string|null;view?:'orbit'|'top';lighting?:'day'|'evening';fullWalls?:boolean;highlight?:boolean;detectedFurniture?:boolean;furnitureOnly?:boolean;fold?:boolean;autoFold?:boolean;productId?:string;cinematic?:boolean;paused?:boolean;onInteract?:()=>void;replay?:number;apiRef?:RefObject<SceneApi|null>;onSelect?:(id:string)=>void;onReady?:()=>void};
type Transform={object:T.Object3D;from:T.Vector3;to:T.Vector3;fromYaw:number;toYaw:number;fromScale:number;show:boolean;delay:number};
const clamp=(n:number)=>Math.max(0,Math.min(1,n));
const ease=(n:number)=>1-Math.pow(1-clamp(n),3);
const materialList=(o:T.Mesh)=>(Array.isArray(o.material)?o.material:[o.material]) as T.MeshStandardMaterial[];
function batchStatic(root:T.Object3D){
 const parents:T.Object3D[]=[];root.traverse(o=>{if(o.children.length)parents.push(o);});
 for(const parent of parents){const buckets=new Map<T.Material,T.Mesh[]>();for(const o of [...parent.children]){if(!(o instanceof T.Mesh)||o.children.length||o.userData.wall||o.userData.upper||Array.isArray(o.material))continue;const bucket=buckets.get(o.material)??[];bucket.push(o);buckets.set(o.material,bucket);}
  for(const [material,objects]of buckets){if(objects.length<3)continue;const geometries=objects.map(o=>{o.updateMatrix();const g=o.geometry.index?o.geometry.toNonIndexed():o.geometry.clone();return g.applyMatrix4(o.matrix);});const merged=mergeGeometries(geometries);geometries.forEach(g=>g.dispose());if(!merged)continue;const m=new T.Mesh(merged,material);m.name=material.name+' details';objects.forEach(o=>o.removeFromParent());parent.add(m);}
 }
}
function pointCloud(root:T.Object3D){
 root.updateMatrixWorld(true);const meshes:T.Mesh[]=[];root.traverse(o=>{if(o instanceof T.Mesh)meshes.push(o);});const points:number[][]=[];const v=new T.Vector3();let seed=42;const random=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;};
 for(const m of meshes){const a=m.geometry.getAttribute('position');const count=Math.min(170,Math.max(8,Math.round(a.count/20)));for(let n=0;n<count;n++){v.fromBufferAttribute(a,Math.floor(random()*a.count)).applyMatrix4(m.matrixWorld);points.push([v.x,v.y,v.z]);}}
 points.sort((a,b)=>a[0]-b[0]);const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(points.flat(),3));const cloud=new T.Points(g,new T.PointsMaterial({color:'#69bca0',size:.021,transparent:true,opacity:.8,sizeAttenuation:true,depthWrite:false}));cloud.name='LiDAR depth samples';return cloud;
}

export function HomeScene(props:HomeSceneProps){
 const host=useRef<HTMLDivElement>(null);const live=useRef(props);live.current=props;
 const [error,setError]=useState(false);const [loaded,setLoaded]=useState(false);const [attempt,setAttempt]=useState(0);
 useEffect(()=>{
  const container=host.current;if(!container)return;let disposed=false,frame=0,ready=false,loadSerial=0;const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
  let renderer:T.WebGLRenderer;try{renderer=new T.WebGLRenderer({antialias:true,powerPreference:'high-performance',preserveDrawingBuffer:true});}catch{setError(true);return;}
  renderer.setPixelRatio(Math.min(devicePixelRatio,1.6));renderer.setClearColor('#eaece6');renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=1.06;renderer.shadowMap.enabled=true;renderer.shadowMap.type=T.PCFShadowMap;renderer.shadowMap.autoUpdate=false;renderer.localClippingEnabled=true;renderer.domElement.setAttribute('aria-label','Interactive 3D home; drag to rotate, scroll to zoom');container.appendChild(renderer.domElement);
  const scene=new T.Scene();const camera=new T.OrthographicCamera(-7,7,5,-5,.1,80);camera.up.set(0,1,0);camera.position.set(9.2,11.3,13.5);
  let controls=new OrbitControls(camera,renderer.domElement);controls.target.set(0,.35,0);controls.enableDamping=true;controls.dampingFactor=.075;controls.minPolarAngle=.2;controls.maxPolarAngle=1.3;controls.rotateSpeed=.65;controls.zoomSpeed=.85;controls.minZoom=.65;controls.maxZoom=3;controls.screenSpacePanning=true;
  const pmrem=new T.PMREMGenerator(renderer),room=new RoomEnvironment();scene.environment=pmrem.fromScene(room,.04).texture;scene.environmentIntensity=.42;room.dispose();pmrem.dispose();
  const ambient=new T.HemisphereLight('#fffaf1','#b7b9aa',1.3);scene.add(ambient);
  const sun=new T.DirectionalLight('#fff0d8',2.8);sun.position.set(-6,12,5);sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);Object.assign(sun.shadow.camera,{left:-8,right:8,top:8,bottom:-8,near:.1,far:40});sun.shadow.normalBias=.025;sun.shadow.bias=-.00008;sun.shadow.radius=4;scene.add(sun,sun.target);
  const ground=new T.Mesh(new T.PlaneGeometry(160,160),live.current.cinematic?new T.ShadowMaterial({opacity:.24}):new T.MeshStandardMaterial({color:'#eaece6',roughness:1}));ground.rotation.x=-Math.PI/2;ground.position.y=-.16;ground.receiveShadow=true;scene.add(ground);
  const warmLights=[[-1.65,1.5,1.1],[.6,1.1,-2],[2.6,1.1,-2]].map(([x,y,z])=>{const l=new T.PointLight('#ffbd6a',0,6,2);l.position.set(x,y,z);scene.add(l);return l;});
  const models=new Map<string,T.Group>();const pending=new Map<string,Promise<T.Group>>();const roots=new Map<string,Map<string,T.Object3D>>();const clips=new Map<string,T.Plane>();const clouds=new Map<string,T.Points>();const wires=new Map<string,T.Object3D>();const allMaterials=new Set<T.Material>();const allGeometry=new Set<T.BufferGeometry>();const bases=new WeakMap<T.Material,{color:T.Color;opacity:number;transparent:boolean}>();
  const loader=new GLTFLoader();const phone=createIPhone();scene.add(phone);phone.visible=false;
  const sweep=new T.Mesh(new T.PlaneGeometry(6.6,2.75),new T.MeshBasicMaterial({color:'#90dfb6',transparent:true,opacity:.1,side:T.DoubleSide,depthWrite:false}));sweep.rotation.y=Math.PI/2;sweep.position.y=1.35;scene.add(sweep);sweep.visible=false;
  const rayGeo=new T.BufferGeometry();rayGeo.setAttribute('position',new T.BufferAttribute(new Float32Array(144),3));const scanRays=new T.LineSegments(rayGeo,new T.LineBasicMaterial({color:'#74c9a5',transparent:true,opacity:.3,depthWrite:false}));scene.add(scanRays);scanRays.visible=false;
  let activeRoot:T.Group|null=null,mode:SceneMode=live.current.mode,modeKey='',layoutKey='',viewKey='',wallKey='',selectionKey='',lightKey='',lastReplay=-1,selectedBox:T.Box3Helper|null=null,transitions:Transform[]=[],transitionStart=0,transitionEnd=0,lastFrame=0,lightBlend=0,foldBlend=0,productUserOrbit=false;
  let extractionBlend=0,galleryBlend=0;const furnitureLift=new Map<string,number>();
  const detectedGreen=new T.Color('#719c76');
  const center=new T.Vector3(-4.3,0,-2.9);
  let migration:{truck:T.Group;flights:{id:string;source:T.Object3D;carry:T.Object3D;start:T.Vector3;cargo:T.Vector3}[]}|null=null;
  async function buildMove(){
   const [old,empty]=await Promise.all([load('old'),load('empty')]);if(disposed)throw Error('Scene disposed');
   const g=new T.Group();g.name='A move, in three acts';const oldWrap=new T.Group(),newWrap=new T.Group();oldWrap.position.set(-2.8,0,-.7);newWrap.position.set(2.8,0,-.7);oldWrap.scale.setScalar(.42);newWrap.scale.setScalar(.42);const oldCopy=old.clone(true),newCopy=empty.clone(true);oldCopy.traverse(o=>{if(o.userData.layer==='architecture')o.visible=true;if(o.userData.selectable){const pose=oldPlacements.find(p=>p.id===o.userData.id);if(pose){o.position.set(pose.x,0,pose.z);o.rotation.y=pose.rotation*Math.PI/180;o.scale.setScalar(1);}}});oldCopy.visible=true;newCopy.visible=true;oldWrap.add(oldCopy);newWrap.add(newCopy);g.add(oldWrap,newWrap);scene.add(g);g.updateMatrixWorld(true);
   const truck=createMovingTruck();truck.position.set(-2.8,0,2.25);truck.scale.setScalar(.7);g.add(truck);const flights:{id:string;source:T.Object3D;carry:T.Object3D;start:T.Vector3;cargo:T.Vector3}[]=[];
   oldCopy.traverse(o=>{if(!o.userData.selectable)return;const copy=o.clone(true);copy.position.set(0,0,0);copy.scale.setScalar(1);const carry=new T.Group();carry.add(copy);carry.userData={id:o.userData.id,origin:'existing',selectable:true};g.add(carry);const i=flights.length;flights.push({id:o.userData.id,source:o,carry,start:o.getWorldPosition(new T.Vector3()),cargo:new T.Vector3(-.98+(i%3)*.47,.49+Math.floor(i/6)*.28,-.27+(Math.floor(i/3)%2)*.52)});});
   migration={truck,flights};roots.set('move',new Map(flights.map(f=>[f.id,f.carry])));models.set('move',g);g.visible=false;
   g.traverse(o=>{if(o instanceof T.Mesh){o.castShadow=true;o.receiveShadow=true;for(const m of materialList(o)){const base=bases.get(m);if(base){m.opacity=base.opacity;m.transparent=base.transparent;m.color.copy(base.color);}}}});
   return g;
  }

  function prepare(raw:T.Group,key:string){
   batchStatic(raw);raw.position.copy(key.startsWith('product')?new T.Vector3():center);const clip=new T.Plane(new T.Vector3(-1,0,0),100);clips.set(key,clip);const items=new Map<string,T.Object3D>();
   raw.traverse(o=>{if(o.userData.selectable)items.set(o.userData.id,o);if(o instanceof T.Mesh){o.castShadow=true;o.receiveShadow=true;const mats=materialList(o).map(m=>{const copy=m.clone();copy.clippingPlanes=[clip];bases.set(copy,{color:copy.color.clone(),opacity:copy.opacity,transparent:copy.transparent});allMaterials.add(copy);return copy;});o.material=mats.length===1?mats[0]:mats;allGeometry.add(o.geometry);}});
   roots.set(key,items);raw.visible=false;scene.add(raw);models.set(key,raw);return raw;
  }
  async function load(key:string):Promise<T.Group>{
   if(models.has(key))return models.get(key)!;if(pending.has(key))return pending.get(key)!;if(key==='move'){const task=buildMove();pending.set(key,task);return task;}
   const task=(async()=>{const url=key==='old'?'/models/v2/old-home.glb':key==='empty'?'/models/v2/new-home-empty.glb':key.startsWith('product')?`/models/v2/furniture/${key.split(':')[1]}.glb`:'/models/v2/new-home-a.glb';const gltf=await loader.loadAsync(url);if(disposed){gltf.scene.traverse(o=>{if(o instanceof T.Mesh){o.geometry.dispose();materialList(o).forEach(m=>m.dispose());}});throw new Error('Scene disposed');}const raw=prepare(gltf.scene,key);
   if(key==='layout'){
    const extras=await Promise.all(['N02','N03','N04'].map(id=>loader.loadAsync(`/models/v2/furniture/${id}.glb`)));
    if(disposed)throw new Error('Scene disposed');
    extras.forEach(gltf=>{let object:T.Object3D|undefined;gltf.scene.traverse(o=>{if(o.userData.selectable)object=o;});if(!object)return;object.removeFromParent();raw.add(object);batchStatic(object);roots.get(key)!.set(object.userData.id,object);object.visible=false;object.traverse(o=>{if(o instanceof T.Mesh){o.castShadow=true;o.receiveShadow=true;const m=(o.material as T.MeshStandardMaterial).clone();m.clippingPlanes=[clips.get(key)!];bases.set(m,{color:m.color.clone(),opacity:m.opacity,transparent:m.transparent});o.material=m;allMaterials.add(m);allGeometry.add(o.geometry);}});});
   }
   if(key.startsWith('product')){const bounds=new T.Box3().setFromObject(raw);const c=bounds.getCenter(new T.Vector3());raw.position.set(-c.x,-bounds.min.y,-c.z);}
   return raw;})();pending.set(key,task);return task;
  }
  let cameraTween:{start:number;from:T.Vector3;to:T.Vector3;fromTarget:T.Vector3;toTarget:T.Vector3;fromZoom:number}|null=null;
  function setView(instant=false){
   const top=live.current.view==='top';controls.enableDamping=false;controls.update();controls.enableDamping=true;
   // Keep world-up invariant. Changing camera.up after OrbitControls construction causes roll.
   camera.up.set(0,1,0);controls.minPolarAngle=0;controls.enableRotate=!top;controls.mouseButtons.LEFT=top?T.MOUSE.PAN:T.MOUSE.ROTATE;controls.touches.ONE=top?T.TOUCH.PAN:T.TOUCH.ROTATE;
   const to=new T.Vector3(...(top?[0,20,.001]:mode==='product'?[2.5,2.1,3.1]:[9.2,11.3,13.5]) as [number,number,number]),target=new T.Vector3(0,mode==='product'?.45:.35,0);
   if(instant||reduced){cameraTween=null;camera.position.copy(to);controls.target.copy(target);camera.zoom=1;camera.lookAt(target);controls.update();camera.updateProjectionMatrix();}
   else cameraTween={start:performance.now(),from:camera.position.clone(),to,fromTarget:controls.target.clone(),toTarget:target,fromZoom:camera.zoom};
  }

  function resize(){const w=container!.clientWidth,h=container!.clientHeight;if(!w||!h)return;renderer.setSize(w,h,false);const ratio=w/h,span=mode==='product'?2.5:live.current.cinematic&&window.innerWidth<740?13.4:ratio<.9?15.8:mode==='move'?11.6:10.9;camera.left=-span*ratio/2;camera.right=span*ratio/2;camera.top=span/2;camera.bottom=-span/2;camera.updateProjectionMatrix();}
  function observeCamera(){controls.addEventListener('change',()=>{container!.dataset.cameraYaw=String(controls.getAzimuthalAngle());container!.dataset.cameraUp=camera.up.toArray().join(',');});}
  function resyncControls(){const target=controls.target.clone();controls.dispose();controls=new OrbitControls(camera,renderer.domElement);controls.target.copy(target);controls.enableDamping=true;controls.dampingFactor=.075;controls.minPolarAngle=live.current.view==='top'?0:.2;controls.maxPolarAngle=1.3;controls.rotateSpeed=.65;controls.zoomSpeed=.85;controls.minZoom=.65;controls.maxZoom=3;controls.screenSpacePanning=true;controls.enableRotate=live.current.view!=='top';controls.mouseButtons.LEFT=live.current.view==='top'?T.MOUSE.PAN:T.MOUSE.ROTATE;controls.touches.ONE=live.current.view==='top'?T.TOUCH.PAN:T.TOUCH.ROTATE;observeCamera();controls.update();}
  observeCamera();
  const observer=new ResizeObserver(resize);observer.observe(container);resize();setView(true);
  function wallCut(){for(const model of models.values())model.traverse(o=>{if(o.userData.wall){const w=o.userData.wall,h=live.current.fullWalls?w.height:Math.max(0,Math.min(w.height,w.cutHeight-w.bottom));o.scale.y=h/w.height;o.position.y=w.bottom+h/2;o.visible=h>0;}if(o.userData.upper)o.visible=!!live.current.fullWalls||!!o.userData.rear;});renderer.shadowMap.needsUpdate=true;}
  function clearBox(){if(selectedBox){scene.remove(selectedBox);selectedBox.geometry.dispose();(selectedBox.material as T.Material).dispose();selectedBox=null;}}
  function selection(){clearBox();const key=mode==='product'?`product:${live.current.productId}`:mode;const object=roots.get(key)?.get(live.current.selectedId??'');if(object&&object.visible){object.updateWorldMatrix(true,true);selectedBox=new T.Box3Helper(new T.Box3().setFromObject(object),object.userData.origin==='new'?0xb78e59:0x5b8a70);scene.add(selectedBox);}}
  function applyLayout(now:number){
   const items=roots.get('layout');if(!items)return;const layout=studioLayouts.find(l=>l.id===(live.current.layout??'a'))!;const selected=new Set(live.current.selectedIds??allExistingIds);const targets=new Map(layout.placements.filter(p=>p.origin==='new'||selected.has(p.id)).map(p=>[p.id,p]));const first=!layoutKey||(live.current.replay??0)!==lastReplay;transitions=[];
   let index=0;for(const [id,o]of items){const target=targets.get(id);if(target){if(first||!o.visible){const from=oldPlacements.find(p=>p.id===id);o.position.set(from?.x??target.x,0,from?.z??target.z);o.rotation.y=(from?.rotation??target.rotation)*Math.PI/180;o.scale.setScalar(.03);}const yaw=target.rotation*Math.PI/180;const delta=Math.atan2(Math.sin(yaw-o.rotation.y),Math.cos(yaw-o.rotation.y));transitions.push({object:o,from:o.position.clone(),to:new T.Vector3(target.x,0,target.z),fromYaw:o.rotation.y,toYaw:o.rotation.y+delta,fromScale:o.scale.x,show:true,delay:reduced?0:index++*38});o.visible=true;}else if(o.visible)transitions.push({object:o,from:o.position.clone(),to:o.position.clone().add(new T.Vector3(0,.3,0)),fromYaw:o.rotation.y,toYaw:o.rotation.y,fromScale:o.scale.x,show:false,delay:0});}
   transitionStart=now;transitionEnd=now+(reduced?1:2100);renderer.shadowMap.needsUpdate=true;selectionKey='';
  }
  async function ensureMode(){const key=live.current.mode==='product'?`product:${live.current.productId??'N01'}`:live.current.mode;if(modeKey===key)return;const serial=++loadSerial;modeKey=key;mode=live.current.mode;ready=false;setLoaded(false);setError(false);
   try{const next=await load(key);if(disposed||serial!==loadSerial)return;for(const m of models.values())m.visible=false;for(const c of clouds.values())c.visible=false;for(const w of wires.values())w.visible=false;activeRoot=next;activeRoot.visible=true;wallCut();layoutKey='';selectionKey='';viewKey=live.current.view??'orbit';resize();setView(true);
    if(mode==='old'||mode==='empty'){if(!clouds.has(key)){clouds.set(key,pointCloud(next));scene.add(clouds.get(key)!);const w=next.clone(true);const material=new T.MeshBasicMaterial({color:'#6caa91',wireframe:true,transparent:true,opacity:.08,depthWrite:false,clippingPlanes:[clips.get(key)!]});allMaterials.add(material);w.traverse(o=>{if(o instanceof T.Mesh){o.material=material;o.castShadow=false;o.receiveShadow=false;}});w.visible=false;scene.add(w);wires.set(key,w);}}
    if(renderer.extensions.has("KHR_parallel_shader_compile")) await renderer.compileAsync(scene,camera); else renderer.compile(scene,camera);if(disposed||serial!==loadSerial)return;renderer.shadowMap.needsUpdate=true;renderer.render(scene,camera);ready=true;setLoaded(true);live.current.onReady?.();if(mode==='empty')void load('layout').catch(()=>{});
   }catch(e){if(!disposed&&serial===loadSerial){setError(true);console.error('Unable to load spatial model',e);}}
  }
  const raycaster=new T.Raycaster();let pointer:[number,number]|null=null;
  const down=(e:PointerEvent)=>{pointer=[e.clientX,e.clientY];productUserOrbit=true;live.current.onInteract?.();};
  const up=(e:PointerEvent)=>{if(!pointer||!activeRoot||Math.hypot(e.clientX-pointer[0],e.clientY-pointer[1])>5||live.current.scan!==undefined)return;const r=renderer.domElement.getBoundingClientRect();raycaster.setFromCamera(new T.Vector2((e.clientX-r.left)/r.width*2-1,-(e.clientY-r.top)/r.height*2+1),camera);for(const hit of raycaster.intersectObject(activeRoot,true)){let visible=true;for(let o:T.Object3D|null=hit.object;o;o=o.parent)if(!o.visible)visible=false;if(!visible)continue;let o:T.Object3D|null=hit.object;while(o&&!o.userData.selectable)o=o.parent;if(o){live.current.onSelect?.(o.userData.id);return;}}};
  renderer.domElement.addEventListener('pointerdown',down);renderer.domElement.addEventListener('pointerup',up);
  const lost=(e:Event)=>{e.preventDefault();setError(true);};renderer.domElement.addEventListener('webglcontextlost',lost);
  const api:SceneApi={capture(){renderer.render(scene,camera);const a=document.createElement('a');a.download=`renest-${mode}-${live.current.layout??'old'}-${live.current.view??'orbit'}.png`;a.href=renderer.domElement.toDataURL('image/png');a.click();},reset(){setView();},debug(){return{yaw:controls.getAzimuthalAngle(),up:camera.up.toArray(),calls:renderer.info.render.calls,visibleIds:[...(roots.get(mode)?.entries()??[])].filter(([,o])=>o.visible).map(([id])=>id),mode};}};if(live.current.apiRef)live.current.apiRef.current=api;
  function animate(now:number){if(disposed)return;frame=requestAnimationFrame(animate);if(document.hidden||live.current.paused)return;const dt=Math.min(.05,(now-lastFrame)/1000||.016);lastFrame=now;void ensureMode();if(!ready||!activeRoot){renderer.render(scene,camera);return;}
   const p=live.current;mode=p.mode;const k=mode==='product'?`product:${p.productId}`:mode;
   if(viewKey!==(p.view??'orbit')){setView();viewKey=p.view??'orbit';}if(wallKey!==String(p.fullWalls)){wallCut();wallKey=String(p.fullWalls);}
   const key=`${p.layout}|${(p.selectedIds??allExistingIds).join(',')}|${p.replay??0}`;if(mode==='layout'&&key!==layoutKey){applyLayout(now);layoutKey=key;lastReplay=p.replay??0;}
   const transitioning=now<transitionEnd;
   if(transitions.length){for(const tr of transitions){const t=reduced?1:clamp((now-transitionStart-tr.delay)/1300),e=ease(t);tr.object.position.lerpVectors(tr.from,tr.to,e);tr.object.position.y+=reduced?0:Math.sin(Math.PI*t)*.42;tr.object.rotation.y=T.MathUtils.lerp(tr.fromYaw,tr.toYaw,e);tr.object.scale.setScalar(T.MathUtils.lerp(tr.fromScale,tr.show?1:.001,e));if(t===1&&!tr.show)tr.object.visible=false;}renderer.shadowMap.needsUpdate=true;if(!transitioning)transitions=[];}
   const scanning=p.scan!==undefined,progress=p.scan??1;const awaiting=!!p.readyToScan;
   for(const [name,cloud]of clouds){cloud.visible=mode!=='old'&&name===k&&(scanning||awaiting);if(cloud.visible){const amount=awaiting?1:clamp(progress/.7);cloud.geometry.setDrawRange(0,Math.floor(cloud.geometry.getAttribute('position').count*amount));(cloud.material as T.PointsMaterial).opacity=awaiting?.12:.8*(1-clamp((progress-.65)/.3));}}
   for(const [name,w]of wires){w.visible=mode!=='old'&&name===k&&(scanning||awaiting);if(w.visible)w.traverse(o=>{if(o instanceof T.Mesh)(o.material as T.MeshBasicMaterial).opacity=awaiting?.008:.065*(1-clamp((progress-.62)/.3));});}
   const clip=clips.get(k);if(clip)clip.constant=scanning&&mode!=='old'?-4.55+clamp((progress-.34)/.59)*9.2:100;
   activeRoot.visible=mode==='old'||(!awaiting&&(!scanning||progress>.34));
   phone.visible=(scanning||awaiting)&&mode!=='product';sweep.visible=scanning&&progress>.12;scanRays.visible=scanning&&progress>.12;
   if(phone.visible){const amount=awaiting?0:progress;const smooth=amount*amount*(3-2*amount);const presentation=new T.Vector3(-4.2,1.4,3.4),sweepPose=new T.Vector3(-4.95+Math.sin(amount*Math.PI)*.2,1.4+Math.sin(amount*Math.PI*4)*.08,-2.9+smooth*5.2);phone.position.lerpVectors(presentation,sweepPose,awaiting?0:ease(clamp(amount/.12)));const facing=new T.Object3D();facing.position.copy(phone.position);facing.lookAt(phone.position.clone().multiplyScalar(2).sub(camera.position));const front=facing.quaternion.clone();facing.lookAt(new T.Vector3(-4.5+amount*9,1.25,0));phone.quaternion.slerpQuaternions(front,facing.quaternion,awaiting?0:ease(clamp(amount/.12)));phone.rotateZ(Math.sin(amount*Math.PI*3)*.035);phone.scale.setScalar(awaiting?1.85:1.65);phone.updateMatrixWorld(true);const origin=phone.localToWorld(lidarPosition.clone());sweep.position.x=-4.5+amount*9;const vertices=rayGeo.attributes.position as T.BufferAttribute;for(let i=0;i<24;i++){vertices.setXYZ(i*2,origin.x,origin.y,origin.z);vertices.setXYZ(i*2+1,sweep.position.x,.08+(i%6)*.5,-2.8+Math.floor(i/6)*1.9);}vertices.needsUpdate=true;phone.traverse(o=>{if(o.name==='LiDAR pulse'){const pulse=1+(Math.sin(now*.007)+1)*.3;o.scale.setScalar(pulse);}});}
   if(mode==='move'&&migration){
    const progress=p.migrationProgress??0;const moving=clamp((progress-.36)/.3),drive=ease(moving);const truck=migration.truck;truck.position.set(T.MathUtils.lerp(-2.8,2.8,drive),Math.sin(moving*Math.PI*8)*.008,2.25-Math.sin(moving*Math.PI)*.18);truck.rotation.y=Math.sin(moving*Math.PI*2)*.045;truck.updateMatrixWorld(true);for(const wheel of truck.userData.wheels as T.Group[])wheel.rotation.z=-drive*24;(truck.userData.ramp as T.Mesh).visible=progress<.37||progress>.66;
    const chosen=new Set(p.selectedIds??allExistingIds);const plan=studioLayouts.find(l=>l.id===(p.layout??'a'))!;let index=0;
    for(const f of migration.flights){if(!chosen.has(f.id)){f.source.visible=true;f.carry.visible=false;continue;}const order=index++;const loadP=clamp((progress-.045-order*.012)/.1),unloadP=clamp((progress-.69-order*.01)/.115);const target=plan.placements.find(t=>t.id===f.id);const cargo=truck.localToWorld(f.cargo.clone());f.source.visible=loadP===0;f.carry.visible=loadP>0;
     if(progress<.65||!target){const e=ease(loadP);f.carry.position.lerpVectors(f.start,cargo,e);f.carry.position.y+=Math.sin(loadP*Math.PI)*.65;f.carry.scale.setScalar(T.MathUtils.lerp(.42,.115,e));}
     else{const dest=new T.Vector3(2.8+(target.x-4.3)*.42,0,-.7+(target.z-2.9)*.42),e=ease(unloadP);f.carry.position.lerpVectors(cargo,dest,e);f.carry.position.y+=Math.sin(unloadP*Math.PI)*.65;f.carry.scale.setScalar(T.MathUtils.lerp(.115,.42,e));f.carry.children[0].rotation.y=target.rotation*Math.PI/180;}
    }renderer.shadowMap.needsUpdate=true;
   }

   if(scanning)renderer.shadowMap.needsUpdate=true;
   const detected=mode==='old'&&!!p.detectedFurniture&&!scanning&&!awaiting;
   extractionBlend=mode!=='old'?0:reduced?(detected?1:0):T.MathUtils.damp(extractionBlend,detected?1:0,7,dt);
   const gallery=detected&&!!p.furnitureOnly,previousGallery=galleryBlend;
   galleryBlend=mode!=='old'?0:reduced?(gallery?1:0):T.MathUtils.damp(galleryBlend,gallery?1:0,8,dt);
   if(Math.abs(galleryBlend-(gallery?1:0))<.002)galleryBlend=gallery?1:0;
   const galleryMoving=previousGallery!==galleryBlend;let liftMoving=false;
   if(roots.has('old')){let i=0;for(const [id,o]of roots.get('old')!){const original=oldPlacements.find(item=>item.id===id)!;const x=.72+(i%6)*1.44,z=.65+Math.floor(i/6)*2.05;i++;const before=furnitureLift.get(id)??0,target=detected&&p.selectedId===id?1:0,lift=reduced?target:T.MathUtils.damp(before,target,10,dt);furnitureLift.set(id,lift);if(Math.abs(before-lift)>.0001)liftMoving=true;o.position.set(T.MathUtils.lerp(original.x,x,galleryBlend),lift*.22,T.MathUtils.lerp(original.z,z,galleryBlend));o.rotation.y=T.MathUtils.lerp(original.rotation*Math.PI/180,0,galleryBlend);o.scale.setScalar(T.MathUtils.lerp(1,.58,galleryBlend)*(1+lift*T.MathUtils.lerp(.04,.16,galleryBlend)));}models.get('old')!.traverse(o=>{if(o.userData.layer==='architecture')o.visible=galleryBlend===0;});}
   if(galleryMoving||liftMoving)renderer.shadowMap.needsUpdate=true;
   container!.dataset.extractionMode=detected?(gallery?'gallery':'in-room'):'none';
   const set=new Set(p.selectedIds??allExistingIds);for(const [id,obj]of roots.get(k)??[]){obj.traverse(o=>{if(o instanceof T.Mesh)for(const m of materialList(o)){const base=bases.get(m);if(!base)continue;const muted=mode==='old'&&!set.has(id)&&!scanning;const color=p.highlight?(obj.userData.origin==='new'?new T.Color('#c6a06b'):new T.Color('#829b72')):base.color;m.color.copy(color);if(mode==='old'&&extractionBlend>0)m.color.lerp(detectedGreen,extractionBlend);m.opacity=muted?.24:base.opacity;const transparent=muted||base.transparent;if(m.transparent!==transparent){m.transparent=transparent;m.needsUpdate=true;}}});}
   const evening=p.lighting==='evening';lightBlend=T.MathUtils.damp(lightBlend,evening?1:0,3,dt);const bg=p.cinematic?new T.Color('#17271f'):new T.Color('#eaece6').lerp(new T.Color('#bbc1b5'),lightBlend);renderer.setClearColor(bg);if(ground.material instanceof T.MeshStandardMaterial)ground.material.color.copy(bg);sun.color.set('#fff0d8').lerp(new T.Color('#ffc18b'),lightBlend);sun.intensity=T.MathUtils.lerp(2.8,1.1,lightBlend);ambient.intensity=T.MathUtils.lerp(1.3,.6,lightBlend);scene.environmentIntensity=T.MathUtils.lerp(.42,.24,lightBlend);warmLights.forEach(l=>{l.intensity=lightBlend*12;});
   if(lightKey!==p.lighting){renderer.shadowMap.needsUpdate=true;lightKey=p.lighting??'day';}
   const auto=(mode==='layout'||mode==='product')&&p.autoFold&&!reduced&&!transitioning;const desiredFold=auto?(1-Math.cos(now*.00075))*0.5:p.fold?1:0;foldBlend=reduced?desiredFold:T.MathUtils.damp(foldBlend,desiredFold,6,dt);let movingFold=false;activeRoot.traverse(o=>{if(o.userData.foldAxis){const axis=o.userData.foldAxis as 'x'|'y'|'z';const target=o.userData.foldAngle*foldBlend;if(Math.abs(o.rotation[axis]-target)>.0001)movingFold=true;o.rotation[axis]=target;}});if(movingFold)renderer.shadowMap.needsUpdate=true;
   const selectKey=`${p.selectedId}|${mode}|${p.layout}`;if(selectionKey!==selectKey){selection();selectionKey=selectKey;}if(selectedBox&&(transitioning||movingFold||galleryMoving||liftMoving)){const obj=roots.get(k)?.get(p.selectedId??'');if(obj){obj.updateWorldMatrix(true,true);selectedBox.box.setFromObject(obj);}}
   if((mode==='product'||p.cinematic)&&!productUserOrbit&&!reduced&&!cameraTween){controls.autoRotate=true;controls.autoRotateSpeed=p.cinematic?.22:.5;}else controls.autoRotate=false;controls.enabled=!scanning&&!cameraTween;if(cameraTween){const t=clamp((now-cameraTween.start)/950),e=t*t*(3-2*t);camera.position.lerpVectors(cameraTween.from,cameraTween.to,e);controls.target.lerpVectors(cameraTween.fromTarget,cameraTween.toTarget,e);camera.zoom=T.MathUtils.lerp(cameraTween.fromZoom,1,e);camera.lookAt(controls.target);camera.updateProjectionMatrix();if(t===1){cameraTween=null;resyncControls();}}else controls.update();const visibleIds=[...(roots.get(k)?.entries()??[])].filter(([,o])=>o.visible).map(([id])=>id).join(',');if(container!.dataset.visibleFurniture!==visibleIds)container!.dataset.visibleFurniture=visibleIds;const pose=camera.position.toArray().map(n=>n.toFixed(4)).join(',');if(container!.dataset.cameraPosition!==pose)container!.dataset.cameraPosition=pose;renderer.render(scene,camera);
  }
  frame=requestAnimationFrame(animate);
  return()=>{disposed=true;cancelAnimationFrame(frame);observer.disconnect();controls.dispose();renderer.domElement.removeEventListener('pointerdown',down);renderer.domElement.removeEventListener('pointerup',up);renderer.domElement.removeEventListener('webglcontextlost',lost);clearBox();scene.traverse(o=>{if(o instanceof T.Mesh||o instanceof T.Points||o instanceof T.Line){allGeometry.add(o.geometry);const mats=Array.isArray(o.material)?o.material:[o.material];mats.forEach(m=>allMaterials.add(m));}});allGeometry.forEach(g=>g.dispose());allMaterials.forEach(m=>{if(m instanceof T.MeshStandardMaterial)m.map?.dispose();m.dispose();});scene.environment?.dispose();renderer.dispose();renderer.domElement.remove();if(live.current.apiRef)live.current.apiRef.current=null;};
 },[attempt]);
 return <div ref={host} className={styles.scene} data-model-loaded={loaded?'true':'false'}>{(!loaded||error)&&<div className={styles.loading} role="status">{error?<><strong>Let’s reload this space.</strong><span>The 3D model could not be opened.</span><button onClick={()=>{setError(false);setAttempt(n=>n+1);}}>Try again</button></>:<><i/><span>Preparing your space…</span></>}</div>}</div>;
}
