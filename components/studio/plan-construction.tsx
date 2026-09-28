'use client';

import {useEffect,useRef,useState} from 'react';
import Image from 'next/image';
import {FileImage,ScanLine} from 'lucide-react';
import * as T from 'three';
import {demoBlueprint,constructionFrame} from '@/lib/floor-plan-blueprints';
import {useLocale} from '@/components/locale-provider';
import type {HomeInputChoice} from '@/lib/home-input';
import styles from './plan-construction.module.css';

type Props={progress?:number;choice:HomeInputChoice;reduced:boolean;onReady:()=>void};
export function PlanConstruction(props:Props){
 const {tr}=useLocale();const host=useRef<HTMLDivElement>(null),live=useRef(props);live.current=props;
 const [failed,setFailed]=useState(false);const placeholder=props.progress===undefined&&props.choice.method!=='library';
 useEffect(()=>{
  const container=host.current;if(!container)return;let renderer:T.WebGLRenderer;
  try{renderer=new T.WebGLRenderer({antialias:true,alpha:true});}catch{setFailed(true);live.current.onReady();return;}
  let disposed=false,frameId=0,last=0,displayed=0;
  renderer.setPixelRatio(Math.min(devicePixelRatio,1.65));renderer.setClearColor('#e9e9e2');renderer.shadowMap.enabled=true;renderer.shadowMap.type=T.PCFShadowMap;
  renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=1.1;
  renderer.domElement.setAttribute('aria-label','Floor plan reconstruction: flat wall lines rise into a three-dimensional home');container.appendChild(renderer.domElement);
  const scene=new T.Scene(),camera=new T.OrthographicCamera(-7,7,6,-6,.1,80);
  const root=new T.Group();root.position.set(-4.3,0,-2.9);scene.add(root);
  scene.add(new T.HemisphereLight('#fffaf0','#acb6a7',2.2));
  const sun=new T.DirectionalLight('#fff7e9',3);sun.position.set(-4,12,5);sun.castShadow=true;sun.shadow.mapSize.set(1024,1024);Object.assign(sun.shadow.camera,{left:-9,right:9,top:9,bottom:-9,near:.1,far:40});sun.shadow.normalBias=.015;sun.shadow.intensity=.35;scene.add(sun);
  const ground=new T.Mesh(new T.PlaneGeometry(26,26),new T.MeshStandardMaterial({color:'#e9e9e2',roughness:1}));ground.rotation.x=-Math.PI/2;ground.position.y=-.07;ground.receiveShadow=true;scene.add(ground);
  const grid=new T.GridHelper(22,44,'#cdd4c8','#dce0d5');grid.position.y=-.045;(grid.material as T.Material).transparent=true;(grid.material as T.Material).opacity=.55;scene.add(grid);
  const texture=new T.TextureLoader().load('/plans/northern-demo-a-2d.svg',()=>{if(disposed){texture.dispose();return;}live.current.onReady();},undefined,()=>{if(!disposed){setFailed(true);live.current.onReady();}});texture.colorSpace=T.SRGBColorSpace;texture.anisotropy=Math.min(4,renderer.capabilities.getMaxAnisotropy());
  const paperMaterial=new T.MeshBasicMaterial({map:texture,transparent:true,side:T.DoubleSide});
  const paper=new T.Mesh(new T.PlaneGeometry(demoBlueprint.width+1.3,demoBlueprint.depth+1.7),paperMaterial);paper.rotation.x=-Math.PI/2;paper.position.set(demoBlueprint.width/2,-.018,demoBlueprint.depth/2);paper.receiveShadow=true;root.add(paper);
  const wallMaterial=new T.MeshStandardMaterial({color:'#e6eadd',roughness:.86});
  const edgeMaterial=new T.LineBasicMaterial({color:'#6c9a84',transparent:true,opacity:.6});
  const glassMaterial=new T.MeshStandardMaterial({color:'#a6c7c4',transparent:true,opacity:.28,roughness:.18,side:T.DoubleSide});
  const frameMaterial=new T.MeshStandardMaterial({color:'#b5c5b6',roughness:.7});
  const walls:{group:T.Group;parts:{mesh:T.Mesh;bottom:number;height:number;cut:number}[];windows:T.Group[];rear:boolean}[]=[];
  for(const w of demoBlueprint.walls){
   const dx=w.b[0]-w.a[0],dz=w.b[1]-w.a[1],length=Math.hypot(dx,dz),rear=!!w.exterior&&w.a[1]===w.b[1]&&w.a[1]<=.48;
   const group=new T.Group();group.position.set((w.a[0]+w.b[0])/2,0,(w.a[1]+w.b[1])/2);group.rotation.y=-Math.atan2(dz,dx);group.visible=false;root.add(group);
   const parts:{mesh:T.Mesh;bottom:number;height:number;cut:number}[]=[],windows:T.Group[]=[];
   function part(width:number,height:number,x:number,bottom:number){if(width<=0)return;const mesh=new T.Mesh(new T.BoxGeometry(width,height,.12),wallMaterial);mesh.position.set(x,bottom+height/2,0);mesh.castShadow=true;mesh.receiveShadow=true;group.add(mesh);mesh.add(new T.LineSegments(new T.EdgesGeometry(mesh.geometry),edgeMaterial));parts.push({mesh,bottom,height,cut:rear?2.55:.7});}
   if(w.door){const [at,width]=w.door,left=at-width/2,right=at+width/2;part(left,2.55,-length/2+left/2,0);part(length-right,2.55,-length/2+(right+length)/2,0);part(width,.42,-length/2+at,2.13);}
   else if(w.window&&length>1.2){const width=length-.38;part(.19,2.55,-length/2+.095,0);part(.19,2.55,length/2-.095,0);part(width,.84,0,0);part(width,.32,0,2.23);
    const window=new T.Group();group.add(window);windows.push(window);
    const pane=new T.Mesh(new T.BoxGeometry(width,1.36,.02),glassMaterial);pane.position.y=1.52;window.add(pane);
    for(let i=0;i<=Math.ceil(width/.8);i++){const bar=new T.Mesh(new T.BoxGeometry(.026,1.4,.05),frameMaterial);bar.position.set(-width/2+i*width/Math.ceil(width/.8),1.52,0);window.add(bar);}
    for(const y of [.82,2.22]){const bar=new T.Mesh(new T.BoxGeometry(width,.03,.06),frameMaterial);bar.position.y=y;window.add(bar);}
   }else part(length,2.55,0,0);
   walls.push({group,parts,windows,rear});
  }
  const vertices=new Float32Array(demoBlueprint.walls.flatMap(w=>[w.a[0],.008,w.a[1],w.b[0],.008,w.b[1]]));
  const traceGeometry=new T.BufferGeometry();traceGeometry.setAttribute('position',new T.BufferAttribute(vertices,3));
  const traceMaterial=new T.LineBasicMaterial({color:'#4b9674',transparent:true,opacity:1});const trace=new T.LineSegments(traceGeometry,traceMaterial);root.add(trace);
  const sweepMaterial=new T.MeshBasicMaterial({color:'#6cad8c',transparent:true,opacity:.16,depthWrite:false,side:T.DoubleSide});const sweep=new T.Mesh(new T.PlaneGeometry(.075,7.1),sweepMaterial);sweep.rotation.x=-Math.PI/2;sweep.position.y=.012;root.add(sweep);
  let ratio=1,width=1,height=1;
  function resize(){width=container!.clientWidth;height=container!.clientHeight;if(!width||!height)return;ratio=width/height;renderer.setSize(width,height,false);}
  const observer=new ResizeObserver(resize);observer.observe(container);resize();
  function animate(now:number){
   if(disposed)return;frameId=requestAnimationFrame(animate);const dt=Math.min(.05,(now-last)/1000||.016);last=now;if(document.hidden)return;
   const target=live.current.progress??0;displayed=live.current.reduced?target:T.MathUtils.damp(displayed,target,16,dt);if(target===0)displayed=0;
   const state=constructionFrame(displayed);let maxHeight=0;
   walls.forEach((w,index)=>{const rise=state.rise(index,walls.length);w.group.visible=rise>.001;w.group.scale.y=Math.max(.001,rise);
    for(const p of w.parts){const cut=Math.max(0,Math.min(p.height,p.cut-p.bottom));const h=T.MathUtils.lerp(p.height,cut,state.settle);p.mesh.visible=h>.002;p.mesh.scale.y=Math.max(.001,h/p.height);p.mesh.position.y=p.bottom+h/2;maxHeight=Math.max(maxHeight,(p.bottom+h)*rise);}
    for(const window of w.windows)window.visible=rise>.3&&(w.rear||state.settle<.75);
   });
   edgeMaterial.opacity=.62*(1-state.settle);wallMaterial.color.set('#e6eadd').lerp(new T.Color('#eeeae0'),state.settle);
   paperMaterial.opacity=1-state.settle*.2;(grid.material as T.Material).opacity=.55*(1-state.settle*.65);
   traceGeometry.setDrawRange(0,Math.floor(state.trace*vertices.length/6)*2);traceMaterial.opacity=(live.current.progress===undefined?0:1)*(1-state.tilt*.65);
   sweep.visible=target>0&&displayed<.24;sweep.position.set(-.3+state.trace*9,.012,3.05);
   const span=T.MathUtils.lerp(Math.max(13.7,11/ratio),Math.max(10.9,13.4/ratio),state.tilt);
   camera.left=-span*ratio/2;camera.right=span*ratio/2;camera.top=span/2;camera.bottom=-span/2;camera.updateProjectionMatrix();
   const targetPoint=new T.Vector3(0,state.tilt*.35,T.MathUtils.lerp(-.65,0,state.tilt));
   const finish=new T.Spherical().setFromVector3(new T.Vector3(9.2,10.95,13.5));
   camera.position.setFromSphericalCoords(T.MathUtils.lerp(20,finish.radius,state.tilt),T.MathUtils.lerp(.00005,finish.phi,state.tilt),finish.theta*state.tilt).add(targetPoint);camera.lookAt(targetPoint);
   container!.dataset.progress=displayed.toFixed(3);container!.dataset.maxWallHeight=maxHeight.toFixed(3);container!.dataset.view=state.tilt===0?'2d':'rising';renderer.render(scene,camera);
  }
  frameId=requestAnimationFrame(animate);
  return()=>{disposed=true;cancelAnimationFrame(frameId);observer.disconnect();const geometries=new Set<T.BufferGeometry>(),materials=new Set<T.Material>();scene.traverse(o=>{if(o instanceof T.Mesh||o instanceof T.LineSegments){geometries.add(o.geometry);(Array.isArray(o.material)?o.material:[o.material]).forEach(m=>materials.add(m));}});geometries.forEach(g=>g.dispose());materials.forEach(m=>m.dispose());texture.dispose();sun.shadow.dispose();renderer.dispose();renderer.domElement.remove();};
 },[]);
 return <div className={styles.experience} data-converting={props.progress!==undefined}>
  <div ref={host} className={styles.canvas} hidden={placeholder||failed}/>
  {failed&&!placeholder&&<div className={styles.fallback}><Image src="/plans/northern-demo-a-2d.svg" alt={tr('Demo floor plan','示例平面图','範例平面圖')} width={900} height={720}/><p>{tr('3D animation is unavailable on this device. The floor plan is still available.','此设备暂时无法播放 3D 动画，可继续查看平面图。','此裝置暫時無法播放 3D 動畫，可繼續查看平面圖。')}</p></div>}
  {placeholder?<div className={styles.placeholder}>{props.choice.method==='floorplan-upload'?<FileImage size={42} strokeWidth={1}/>:<ScanLine size={42} strokeWidth={1}/>}<h3>{props.choice.method==='floorplan-upload'?tr('Start with your floor plan','从你的平面图开始','從你的平面圖開始'):tr('Your new home, yet to be captured','等待记录你的新家','等待記錄你的新居')}</h3><p>{tr('Choose a source on the right. The model appears after reconstruction.','先选择空间资料，完成重建后才显示立体模型。','先選擇空間資料，完成重建後才顯示立體模型。')}</p></div>:<div className={styles.caption}><span>{props.progress===undefined?tr('01 / TWO-DIMENSIONAL PLAN','01 / 二维平面图','01 / 二維平面圖'):props.progress<.23?tr('TRACE / FINDING THE WALLS','描摹 / 识别墙线','描摹 / 識別牆線'):props.progress<.84?tr('EXTRUDE / WALLS TAKING SHAPE','立起 / 墙体逐渐成形','立起 / 牆體逐漸成形'):tr('REVEAL / YOUR SPACE IN 3D','呈现 / 立体空间','呈現 / 立體空間')}</span><p>{props.progress===undefined?tr('A floor plan first. A home takes shape next.','先看平面图，再让空间立起来。','先看平面圖，再讓空間立起來。'):tr('Wall lines become volume. Openings become light.','墙线变成体积，门窗引入光线。','牆線變成體積，門窗引入光線。')}</p></div>}
 </div>;
}
