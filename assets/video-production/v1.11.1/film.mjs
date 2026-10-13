import * as THREE from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {RoomEnvironment} from 'three/addons/environments/RoomEnvironment.js';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';
const canvas=document.getElementById('film'),ctx=canvas.getContext('2d',{alpha:false});
const W=1920,H=1080,CREAM='#f3f0e7',INK='#153b32',MINT='#c5d7b3',GOLD='#c8ac79',MUTED='#6f8076';
const shots=await fetch('narration.json').then(r=>r.json());
const captions=await fetch('captions.json').then(r=>r.json());
const map=await fetch('/lib/hong-kong-map.json').then(r=>r.json());
const paths=map.paths.map(d=>new Path2D(d));
await Promise.all([document.fonts.load('48px Geist'),document.fonts.load('100px Editorial'),document.fonts.load('20px Mono')]);
const img=async src=>{const i=new Image();i.src=src;await i.decode();return i};
const [home,qr]=await Promise.all([img('../v1.4-commercial/evidence/home.png'),img('../v1.4-commercial/graphics/qr.png')]);
const videos={};window.filmVideos=videos;
for(const n of ['capture','pieces','newhome','brief','migration','layouts','adjust','report','shop']){
 const v=document.createElement('video');v.src=URL.createObjectURL(await fetch(`../v1.4-commercial/clips/${n}.mp4`).then(r=>r.blob()));v.muted=true;v.playsInline=true;v.preload='auto';
 await new Promise((resolve,reject)=>{v.onloadeddata=resolve;v.onerror=()=>{window.missingVideos=(window.missingVideos||[]).concat(n);resolve()}});videos[n]=v;
}
const renderer=new THREE.WebGLRenderer({antialias:true,alpha:true,preserveDrawingBuffer:true});renderer.setSize(1920,1080);renderer.setPixelRatio(1);renderer.setClearColor(0x000000,0);renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFShadowMap;renderer.toneMapping=THREE.AgXToneMapping;renderer.toneMappingExposure=1.1;
const scene=new THREE.Scene(),camera=new THREE.PerspectiveCamera(36,1920/1080,.01,100);
const pmrem=new THREE.PMREMGenerator(renderer);scene.environment=pmrem.fromScene(new RoomEnvironment(),.05).texture;
scene.add(new THREE.HemisphereLight(0xfffcf0,0x647669,2));const light=new THREE.DirectionalLight(0xffedcb,4);light.position.set(3,8,5);light.castShadow=true;light.shadow.mapSize.set(2048,2048);Object.assign(light.shadow.camera,{left:-8,right:8,top:8,bottom:-8,near:.1,far:30});light.shadow.normalBias=.02;light.shadow.bias=-.0002;scene.add(light);
const floor=new THREE.Mesh(new THREE.PlaneGeometry(100,100),new THREE.ShadowMaterial({opacity:.14}));floor.rotation.x=-Math.PI/2;floor.position.y=-.01;floor.receiveShadow=true;scene.add(floor);
const source=(await new GLTFLoader().loadAsync('/public/models/v2/old-home.glb')).scene;
const houseSource=(await new GLTFLoader().loadAsync('/public/models/v2/new-home-b.glb')).scene;
const partnerSource=(await new GLTFLoader().loadAsync('/public/models/v2/new-home-b.glb')).scene;
function batch(root){root.updateMatrixWorld(true);const buckets=new Map();root.traverse(n=>{if(!n.isMesh)return;let g=n.geometry.clone();if(g.index)g=g.toNonIndexed();g.applyMatrix4(n.matrixWorld);for(const k of Object.keys(g.attributes))if(!['position','normal','uv'].includes(k))g.deleteAttribute(k);if(!g.attributes.uv)g.setAttribute('uv',new THREE.Float32BufferAttribute(new Float32Array(g.attributes.position.count*2),2));const key=n.material.uuid;if(!buckets.has(key))buckets.set(key,{m:n.material,g:[]});buckets.get(key).g.push(g)});const group=new THREE.Group();for(const {m,g}of buckets.values()){const geo=mergeGeometries(g);if(geo){const mesh=new THREE.Mesh(geo,m);mesh.castShadow=true;mesh.receiveShadow=true;group.add(mesh)}}const box=new THREE.Box3().setFromObject(group),center=box.getCenter(new THREE.Vector3());group.position.set(-center.x,-box.min.y,-center.z);const outer=new THREE.Group();outer.add(group);return outer;}
function piece(id,origin=source){let node;origin.traverse(n=>{if(n.name.startsWith(id+' ' )||n.name.startsWith(id+'_')||n.name===id)node=n});if(!node)throw new Error('Missing '+id);const clone=node.clone(true);clone.position.set(0,0,0);clone.rotation.set(0,0,0);clone.updateMatrixWorld(true);return batch(clone)}
const sofa=piece('F01'),desk=piece('F15'),chair=piece('F16'),table=piece('N02',partnerSource);const house=batch(houseSource);const objects=[sofa,desk,chair,table,house];objects.forEach(o=>scene.add(o));

// ReNest director's cut. All motion is a deterministic function of timeline time.
const clamp=(v,a=0,b=1)=>Math.max(a,Math.min(b,v));
const mix=(a,b,p)=>a+(b-a)*p;
const expo=v=>1-Math.pow(2,-10*clamp(v));
const smooth=v=>{v=clamp(v);return v*v*(3-2*v)};
const spring=v=>{v=clamp(v);return v===1?1:1-Math.exp(-8*v)*Math.cos(10*v)};
const beat=60/128;
const catalogue=await fetch('products.json').then(r=>r.json());
const productImages=await Promise.all(catalogue.map(p=>img('/public'+p.image)));
const roomPhotos=await Promise.all(['a','b','c'].map(k=>img(`/public/models/v2/previews/new-home-${k}.png`)));
const productPage=await img('../v1.4-commercial/evidence/product.png');
const floorPlan=await img('/public/plans/northern-demo-a-2d.svg');
const oldHouse=batch(source);scene.add(oldHouse);objects.push(oldHouse);
const oldBox=new THREE.Box3().setFromObject(source),oldCenter=oldBox.getCenter(new THREE.Vector3()),oldPins={};
source.traverse(n=>{const m=n.name.match(/^(F\d{2})(?:_| |$)/);if(m){const c=new THREE.Box3().setFromObject(n).getCenter(new THREE.Vector3());oldPins[m[1]]=c.sub(new THREE.Vector3(oldCenter.x,oldBox.min.y,oldCenter.z))}});
const conflictTable=piece('F04');scene.add(conflictTable);objects.push(conflictTable);
const rawLayouts=await fetch('/v2-home-models/data/layouts.json').then(r=>r.json());
let architectureNode;houseSource.traverse(n=>{if(n.name==='Architecture')architectureNode=n});
const shell=batch(architectureNode||houseSource);scene.add(shell);objects.push(shell);
const houseBox=new THREE.Box3().setFromObject(houseSource),houseCenter=houseBox.getCenter(new THREE.Vector3());
const assembly=[];const seen=new Set();
houseSource.traverse(n=>{const m=n.name.match(/^([FN]\d{2})(?:_| |$)/);if(!m||seen.has(m[1]))return;seen.add(m[1]);
 if(['F02','F04'].includes(m[1]))return;
 const box=new THREE.Box3().setFromObject(n),c=box.getCenter(new THREE.Vector3());
 const o=batch(n);o.traverse(x=>{if(x.isMesh)x.material=x.material.clone()});scene.add(o);objects.push(o);
 assembly.push({id:m[1],o,target:new THREE.Vector3(c.x-houseCenter.x,box.min.y-houseBox.min.y,c.z-houseCenter.z)});
});
const inventory=Array.from({length:18},(_,i)=>{const id=`F${String(i+1).padStart(2,'0')}`,o=piece(id);scene.add(o);objects.push(o);return {id,o}});
const pts=[];oldHouse.updateMatrixWorld(true);oldHouse.traverse(n=>{if(!n.isMesh)return;const a=n.geometry.attributes.position;for(let i=0;i<a.count;i+=17){const v=new THREE.Vector3().fromBufferAttribute(a,i).applyMatrix4(n.matrixWorld);pts.push(v.x,v.y,v.z)}});
const scanGeometry=new THREE.BufferGeometry();scanGeometry.setAttribute('position',new THREE.Float32BufferAttribute(pts,3));
const scanPoints=new THREE.Points(scanGeometry,new THREE.PointsMaterial({color:0xb7d7a5,size:.023,transparent:true,opacity:.85}));scene.add(scanPoints);objects.push(scanPoints);
const scanSheet=new THREE.Mesh(new THREE.PlaneGeometry(12,3.5),new THREE.MeshBasicMaterial({color:0xd2dba5,transparent:true,opacity:.12,side:THREE.DoubleSide,depthWrite:false}));scene.add(scanSheet);objects.push(scanSheet);
const boxLine=new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(2.3,.95,1)),new THREE.LineBasicMaterial({color:0xd3b479}));scene.add(boxLine);objects.push(boxLine);
const productCards=catalogue.map((p,i)=>{const c=document.createElement('canvas');c.width=520;c.height=600;const g=c.getContext('2d');g.fillStyle='#fffdf6';g.fillRect(0,0,520,600);g.drawImage(productImages[i],0,0,520,390);g.fillStyle=INK;g.font='27px Geist';let line='',y=431;for(const w of p.name.split(' ')){if(g.measureText(line+' '+w).width>460){g.fillText(line,26,y);y+=33;line=w}else line+=(line?' ':'')+w}g.fillText(line,26,y);g.font='22px Mono';g.fillStyle=MUTED;g.fillText(p.dimensions,26,531);g.fillStyle=INK;g.font='34px Geist';g.fillText('HK$'+p.price.toLocaleString(),26,579);return c});
function rect(x,y,w,h,col,r=0){ctx.fillStyle=col;ctx.beginPath();ctx.roundRect(x,y,w,h,r);ctx.fill()}
function text(s,x,y,size=34,col=INK,font='Geist',align='left',weight=400){ctx.font=`${weight} ${size}px ${font}`;ctx.fillStyle=col;ctx.textAlign=align;ctx.textBaseline='alphabetic';ctx.fillText(s,x,y)}
function lines(s,x,y,size=100,col=INK,width=950,font='Geist',weight=600){ctx.font=`${weight} ${size}px ${font}`;let row='',dy=0;for(const w of s.split(' ')){if(ctx.measureText(row+' '+w).width>width&&row){text(row,x,y+dy,size,col,font,'left',weight);dy+=size*1.02;row=w}else row+=(row?' ':'')+w}if(row)text(row,x,y+dy,size,col,font,'left',weight);return dy+size}
function line(x,y,xx,yy,col=GOLD,width=2,p=1){ctx.strokeStyle=col;ctx.lineWidth=width;ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(mix(x,xx,p),mix(y,yy,p));ctx.stroke()}
function tag(s,x,y,dark=false){ctx.font='20px Mono';const w=ctx.measureText(s).width+32;rect(x,y,w,40,dark?'#153b32e8':'#fffdf3eb',20);text(s,x+16,y+27,20,dark?CREAM:INK,'Mono');return w}
function bg(dark=false){rect(0,0,W,H,dark?'#102d27':CREAM);const g=ctx.createRadialGradient(1190,410,40,1190,410,1400);g.addColorStop(0,dark?'#2b5546':'#fffdf6');g.addColorStop(1,dark?'#09251f':'#dadfce');ctx.fillStyle=g;ctx.fillRect(0,0,W,H)}
function label(s,dark=false,status){text('ReNest',62,59,36,dark?CREAM:INK,'Editorial');text(s,1858,54,18,dark?MINT:MUTED,'Mono','right');if(status)tag(status,62,84,dark)}
function headline(s,u,{x=65,y=233,size=102,width=850,dark=false}={}){const p=expo(u/.55);ctx.save();ctx.globalAlpha*=p;ctx.translate(0,(1-p)*55);lines(s,x,y,size,dark?CREAM:INK,width);ctx.restore()}
function border(x,y,w,h,c=GOLD){ctx.strokeStyle=c;ctx.lineWidth=3;ctx.strokeRect(x,y,w,h)}
function pin(label,x,y,xx,yy,u,col=GOLD){line(x,y,xx,yy,col,2,expo(u/.55));ctx.beginPath();ctx.arc(x,y,6,0,Math.PI*2);ctx.fillStyle=col;ctx.fill();tag(label,xx,yy-20,true)}
function fitImage(im,x,y,w,h,mode='contain'){const iw=im.naturalWidth||im.videoWidth||im.width,ih=im.naturalHeight||im.videoHeight||im.height;const scale=(mode==='cover'?Math.max:Math.min)(w/iw,h/ih);ctx.drawImage(im,x+(w-iw*scale)/2,y+(h-ih*scale)/2,iw*scale,ih*scale)}
function photo(im,x,y,w,h,r=14){ctx.save();ctx.beginPath();ctx.roundRect(x,y,w,h,r);ctx.clip();rect(x,y,w,h,'#f6f5ef');fitImage(im,x,y,w,h);ctx.restore()}
function stage(mode,t){objects.forEach(o=>{o.visible=false;o.position.set(0,0,0);o.rotation.set(0,0,0);o.scale.setScalar(1)});renderer.clippingPlanes=[];scene.background=null;camera.zoom=1;camera.up.set(0,1,0);floor.visible=true;
 const look=new THREE.Vector3(0,.35,0);let pos=new THREE.Vector3(8,9,11);
 if(mode==='sofa'||mode==='sofa-close'){sofa.visible=true;sofa.rotation.y=-.25;const p=expo(t/1.2);pos.set(mix(1.8,3.1,p),mix(1,2.5,p),mix(2.8,5.2,p));camera.zoom=mode==='sofa-close'?1.6:1.05;look.set(0,.35,0);}
 else if(mode==='inventory'){inventory.forEach(({id,o},i)=>{o.visible=true;const p=expo((t-i*.045)/.85),v=oldPins[id]||new THREE.Vector3();const col=i%6,row=Math.floor(i/6);o.scale.setScalar(mix(1,.73,p));o.position.set(mix(v.x,(col-2.5)*2.15,p),mix(v.y,0,p)+Math.sin(Math.PI*p)*.6,mix(v.z,(row-1)*2.65,p));o.rotation.y=mix(-.25,0,p)});const p=expo(t/1.1);pos.set(mix(6,7,p),mix(10,12,p),mix(11,14,p));camera.zoom=1.06;}
 else if(mode==='scan'){scanPoints.visible=true;scanGeometry.setDrawRange(0,Math.floor(scanGeometry.attributes.position.count*clamp(t/2.3)));scanSheet.visible=true;scanSheet.position.set(0,1,mix(-4,4,clamp(t/4)));const p=smooth(t/4);pos.set(mix(9,6,p),mix(7,10,p),11);camera.zoom=1.05;if(t>3){oldHouse.visible=true;renderer.clippingPlanes=[new THREE.Plane(new THREE.Vector3(0,-1,0),1.4)];}}
 else {
  shell.visible=true;renderer.clippingPlanes=[new THREE.Plane(new THREE.Vector3(0,-1,0),1.22)];
  const orbit=mode==='home'?mix(-.35,-.15,expo(t/.9)):mode==='geometry'?mix(.15,-.38,expo(t/.9)):mix(-.32,0,expo(t/.8));
  pos.set(9*Math.cos(orbit)+10*Math.sin(orbit),mode==='geometry'?15:10,10*Math.cos(orbit)-9*Math.sin(orbit));camera.zoom=1.12;
  if(mode==='plan'||mode==='rise'){const p=mode==='plan'?0:smooth(t/3.5);shell.scale.y=mode==='plan'?.012:mix(.012,1,p);pos.set(mix(.01,9,p),mix(21,10,p),mix(.01,10,p));renderer.clippingPlanes=[];camera.zoom=1.05;}
  else {
   assembly.forEach(({o,target,id},i)=>{o.visible=true;o.position.copy(target);const p=expo((t-i*.045)/1.1);
    if(mode==='assemble'){o.position.x=mix((i%5-2)*3.4,target.x,p);o.position.z=mix(Math.floor(i/5)*2-4,target.z,p);o.position.y=mix(3.5+i*.1,target.y,p);o.rotation.y=(1-p)*.75;}
    if(mode==='candidates'){const step=Math.min(2,Math.floor(t/1.85)),q=expo((t%1.85)/.58),seq=[1,3,2],base=rawLayouts[2].placements.find(p=>p.id===id),to=rawLayouts[seq[step]].placements.find(p=>p.id===id),from=rawLayouts[seq[Math.max(0,step-1)]].placements.find(p=>p.id===id);if(id!=='F01'&&base&&to){o.position.x+=mix((from?.x??base.x)-base.x,to.x-base.x,q);o.position.z+=mix((from?.z??base.z)-base.z,to.z-base.z,q);o.position.y+=Math.sin(Math.PI*q)*.2;o.rotation.y=mix((from?.rotation??base.rotation)-base.rotation,to.rotation-base.rotation,q)*Math.PI/180;}}
    if(mode==='checks'&&id==='F15'){const p=expo((t-1.6)/.5);o.position.x+=mix(1.7,0,p);o.position.y=.15*Math.sin(Math.PI*p);}
    if(mode==='conflict'&&id==='N02'){o.visible=false;const p=expo(t/.75);conflictTable.visible=true;conflictTable.position.copy(target);conflictTable.position.x+=mix(-3,.95,p);conflictTable.position.z+=.8;conflictTable.rotation.y=.5;}
   });
   if(mode==='home'){pos.set(6.7,7.8,11);camera.zoom=1.23;}
  }
 }
 camera.position.copy(pos);camera.lookAt(look);camera.updateProjectionMatrix();renderer.render(scene,camera);
}
function model(mode,t,x=0,y=0,w=1920,h=1080){stage(mode,t);ctx.drawImage(renderer.domElement,x,y,w,h)}
function project(p,x=0,y=0,w=1920,h=1080){const v=p.clone().project(camera);return [x+(v.x+1)*w/2,y+(1-v.y)*h/2]}
function smallPlan(x,y,w,h,u,dark=false){const c=dark?MINT:INK;ctx.save();ctx.strokeStyle=c;ctx.lineWidth=3;ctx.setLineDash([1600]);ctx.lineDashOffset=1600*(1-expo(u/1));ctx.strokeRect(x,y,w,h);ctx.setLineDash([]);line(x+w*.61,y,x+w*.61,y+h*.75,c,3);line(x+w*.61,y+h*.46,x+w,y+h*.46,c,3);line(x,y+h*.72,x+w*.38,y+h*.72,c,3);rect(x+w*.1,y+h*.18,w*.3,h*.17,GOLD,4);rect(x+w*.69,y+h*.13,w*.23,h*.22,MINT,4);ctx.restore()}
function metric(value,caption,x,y,u,dark=false){const p=expo(u/.5);ctx.save();ctx.globalAlpha=p;ctx.translate(0,(1-p)*35);text(value,x,y,94,dark?CREAM:INK,'Geist','left',650);text(caption,x,y+45,23,dark?MINT:MUTED);ctx.restore()}
function flowCard(i,x,y,scale,angle=0,alpha=1){ctx.save();ctx.globalAlpha=alpha;ctx.translate(x,y);ctx.rotate(angle);ctx.scale(scale,scale);ctx.shadowColor='#001b2433';ctx.shadowBlur=30;ctx.shadowOffsetY=20;photo(productCards[i%productCards.length],-260,-300,520,600,18);ctx.restore()}
function gallery(u,filter=false){const indices=[0,4,6,2,1,3,7,8,9];
 indices.forEach((i,j)=>{const p=filter?1:expo((u-j*.07)/.7);const x=320+(j%3)*635,y=260+Math.floor(j/3)*360;let xx=mix(x+1900,x,p),yy=y,sc=.69,a=1,rot=mix(.18,[-.035,.025,-.02][j%3],p);
 if(filter){const q=expo((u-.65)/.65);const keep=[1,3,4].includes(i);if(keep){const k=[4,1,3].indexOf(i);xx=mix(x,365+k*605,q);yy=mix(y,540,q);sc=mix(.69,.97,q);rot*=1-q}else{xx+=q*(j%2?2400:-2400);a=1-q}}
 if(filter&&u>4.65){const z=expo((u-4.65)/.9);if(i===1){xx=mix(xx,960,z);sc=mix(sc,1.35,z)}else{xx+=z*(xx<960?-1600:1600);a*=1-z}}
 flowCard(i,xx,yy,sc,rot,a);
 });
}

// v1.11: distinct subjects and a shared settle curve, authored against paragraph speech.
import {createNativePlan} from './native-plan.mjs';
import {createSurfaceMaps,finishMaterial} from './native-finish.mjs';
const nativePlan=createNativePlan();
const scanVideo=document.createElement('video');scanVideo.src=URL.createObjectURL(await fetch('../v1.8-refined/clips/native-scan.mp4').then(r=>r.blob()));scanVideo.muted=true;scanVideo.preload='auto';await new Promise(r=>scanVideo.onloadeddata=r);videos.native=scanVideo;
const resaleVideo=document.createElement('video');resaleVideo.src=URL.createObjectURL(await fetch('../v1.8-refined/clips/resale.mp4').then(r=>r.blob()));resaleVideo.muted=true;await new Promise(r=>resaleVideo.onloadeddata=r);videos.resale=resaleVideo;
const oldPhoto=await img('/public/models/v2/previews/old-home.png');
const tops=await Promise.all(['a','b','c'].map(n=>img(`/public/models/v2/previews/new-home-${n}-top.png`)));
const mats=createSurfaceMaps(4),products3d=[];
for(const id of ['N02','N01','N03']){const raw=(await new GLTFLoader().loadAsync(`/public/models/v2/furniture/${id}.glb`)).scene;raw.updateMatrixWorld(true);const b=new THREE.Box3().setFromObject(raw),c=b.getCenter(new THREE.Vector3());raw.position.set(-c.x,-b.min.y,-c.z);raw.traverse(o=>{if(o.isMesh){o.material=o.material.clone();finishMaterial(o.material,mats,o.name);o.castShadow=true;o.receiveShadow=true}});const wrap=new THREE.Group();wrap.add(raw);scene.add(wrap);products3d.push(wrap);objects.push(wrap);}
const settle=x=>{x=clamp(x);return x*x*x*(x*(x*6-15)+10)};
const lerpPose=(a,b,p)=>a.map((n,i)=>mix(n,b[i],p));
function hero(u,{id=0,close=false,fold=0,placed=false,angle=0,choices=false}={}){
 objects.forEach(o=>{o.visible=false;o.position.set(0,0,0);o.rotation.set(0,0,0);o.scale.setScalar(1)});renderer.clippingPlanes=[];scene.background=null;floor.visible=true;camera.zoom=1;camera.up.set(0,1,0);
 products3d.forEach(v=>v.traverse(n=>{if(n.isMesh){n.material.opacity=1;n.material.transparent=false}}));const o=products3d[id];o.visible=true;o.rotation.y=angle;
 o.traverse(n=>{if(n.userData.foldAxis)n.rotation[n.userData.foldAxis]=n.userData.foldAngle*fold});
 let pos=close?lerpPose([1.15,.92,1.4],[1.9,1.55,2.5],settle(u/5)):[1.9,1.55,2.5],target=close?lerpPose([.12,.64,0],[0,.43,0],settle(u/5)):[0,.43,0];
 if(choices){const spread=settle(u/1.2)*(1-settle((u-2.6)/1.4));pos=lerpPose([1.9,1.55,2.5],[1,2.4,4.8],spread);products3d.slice(1).forEach((v,i)=>{v.visible=true;v.traverse(n=>{if(n.isMesh){n.material.transparent=true;n.material.opacity=settle(u/.55)*(1-settle((u-3.3)/.7))}});v.position.set(i===0?-1.75:1.75,0,-.65);v.traverse(n=>{if(n.userData.foldAxis)n.rotation[n.userData.foldAxis]=n.userData.foldAngle*.3})});}
 if(placed){const p=settle(u/2.7),fade=settle(u/.7);shell.visible=true;const apply=v=>v.traverse(n=>{if(n.isMesh){n.material.transparent=fade<1;n.material.opacity=fade;n.castShadow=fade>.8}});apply(shell);assembly.forEach(a=>{a.o.visible=a.id!=='N02';a.o.position.copy(a.target);apply(a.o)});const anchor=assembly.find(x=>x.id==='N02')?.target??new THREE.Vector3();o.position.copy(anchor);pos=lerpPose([anchor.x+1.9,anchor.y+1.55,anchor.z+2.5],[8.5,10,12],p);target=lerpPose([anchor.x,anchor.y+.43,anchor.z],[0,.35,0],p);renderer.clippingPlanes=[new THREE.Plane(new THREE.Vector3(0,-1,0),1.35)];}
 camera.position.set(...pos);camera.lookAt(...target);camera.updateProjectionMatrix();renderer.render(scene,camera);ctx.drawImage(renderer.domElement,0,0,W,H);
}
function cover(im,p=1,cx=960,cy=540){ctx.save();ctx.translate(cx,cy);ctx.scale(p,p);ctx.drawImage(im,-960,-540,1920,1080);ctx.restore()}
function native(p){nativePlan.render(clamp(p));ctx.drawImage(nativePlan.canvas,0,0,1920,1080)}
function footer(s){text(s,64,899,22,MUTED,'Mono')}
function status(s,dark=false){tag(s,60,38,dark)}
function overTitle(a,b,u,dark=false){const q=settle(u/.65);ctx.save();ctx.globalAlpha=q;ctx.translate(0,28*(1-q));text(a,64,182,25,dark?MINT:MUTED,'Mono');lines(b,60,278,88,dark?CREAM:INK,1550,'Geist',600);ctx.restore()}
function city(u){bg(true);ctx.save();const p=settle(u/1.1);ctx.translate(mix(950,700,p),-60);ctx.scale(1.7,1.7);ctx.fillStyle='#36574f';paths.forEach(p=>ctx.fill(p));ctx.restore();
 for(let i=0;i<38;i++){const x=760+(i%10)*81,y=410+Math.floor(i/10)*67,h=28+(i*47%110),p=settle((u-.8-i*.025)/.55);rect(x,y-h*p,36,h*p,'#cad6bd');rect(x+36,y-h*p+6,12,h*p-6,'#8dafa0');}
 text('A CITY IS MAKING ROOM.',65,178,27,MINT,'Mono');text('~500,000',60,336,137,CREAM,'Geist','left',600);text('additional homes planned',65,402,39,CREAM);text('Northern Metropolis · Upon full development',65,835,25,MINT);text('Source: HKSAR Government · 28 May 2025',65,875,21,MINT);text('Map data © OpenStreetMap contributors',1855,880,17,MINT,'Mono','right');}
function pipeline(u){bg(true);overTitle('PROPOSED GENAI WORKFLOW','A brief becomes a set of constraints.',u,true);
 const items=[['01  HOUSEHOLD INTENT','Keep the sofa. Work from home.'],['02  STRUCTURED REQUIREMENTS','Budget · Furniture IDs · Activities'],['03  SPATIAL CHECKS','Room geometry · Dimensions · Overlaps']];
 items.forEach((a,i)=>{const p=settle((u-i*.9)/.6),x=65+i*600;ctx.save();ctx.globalAlpha=p;rect(x,412,552,305,'#23473e',16);text(a[0],x+26,462,21,MINT,'Mono');lines(a[1],x+26,541,43,CREAM,486,'Geist',500);line(x+30,684,x+515,684,GOLD,2,p);ctx.restore();if(i<2)line(x+554,561,x+598,561,GOLD,3,settle((u-i*.9-.5)/.6))});
 const p=settle((u-3)/.6);ctx.save();ctx.globalAlpha=p;text('Candidates → explanation → resident approval',66,831,35,CREAM);ctx.restore();status('Planned integration · Not a live model call',true);}
function candidates(u){bg(true);const current=Math.min(2,Math.floor(u/1.65));
 tops.forEach((im,i)=>{const x=64+i*600,p=settle((u-i*.15)/.6);ctx.save();ctx.globalAlpha=p*(current===i?1:.55);rect(x,220,560,548,CREAM,18);ctx.drawImage(im,x+12,275,536,360);text(['Familiar comforts','Room to gather','A place to focus'][i],x+25,710,29,INK);if(i===current)border(x,220,560,548,GOLD);ctx.restore()});
 text('THREE TRADE-OFFS. ONE SET OF FURNITURE.',65,154,37,CREAM,'Geist','left',550);text('Existing demo arrangements · AI selection shown as a proposed workflow',65,836,24,MINT);}
function partner(u){bg(true);overTitle('PROPOSED BUSINESS MODEL','A useful preview. A qualified introduction.',u,true);
 const a=[['Models','Sellers supply product data'],['Preview','Residents check the fit'],['Referral','Visit the seller to buy']];a.forEach((v,i)=>{const p=settle((u-i*.4)/.7),x=76+i*600;ctx.save();ctx.globalAlpha=p;ctx.beginPath();ctx.arc(x+240,543,112,0,Math.PI*2);ctx.strokeStyle=GOLD;ctx.lineWidth=2;ctx.stroke();text(String(i+1).padStart(2,'0'),x+240,569,74,CREAM,'Editorial','center');text(v[0],x+240,728,39,CREAM,'Geist','center');text(v[1],x+240,782,21,MINT,'Geist','center');ctx.restore();if(i<2)line(x+352,543,x+488,543,GOLD,2,settle((u-i*.4-.3)/.6))});text('Proposed revenue: qualified referrals + sales commissions',76,885,24,MINT);}
function pilot(u){bg();overTitle('START SMALL. TEST THE WHOLE JOURNEY.','One neighbourhood, three signals.',u);
 const ys=[420,570,720];['Completed plans','Seller visits','Confirmed purchases'].forEach((s,i)=>{const p=settle((u-i*.6)/.8);rect(70,ys[i],1600*p,108,i===1?'#c5d7b3':INK,8);text(`0${i+1}`,100,ys[i]+70,43,i===1?INK:CREAM,'Mono');text(s,230,ys[i]+71,45,i===1?INK:CREAM);text('TO VALIDATE',1610,ys[i]+66,18,i===1?INK:MINT,'Mono','right')});}
function impact(u){bg();text('REUSE, MEASURED IN REAL OBJECTS.',65,153,26,MUTED,'Mono');text('16 / 18',63,370,171,INK,'Geist','left',600);lines('existing pieces retained in this example',74,459,49,INK,640);text('Verify transfers before carbon claims.',74,768,32,INK);
 for(let i=0;i<18;i++){const x=1000+i%6*132,y=340+Math.floor(i/6)*153,p=settle((u-i*.065)/.55);ctx.beginPath();ctx.arc(x,y,42*p,0,Math.PI*2);ctx.fillStyle=i<16?INK:'#d4d5c8';ctx.fill();if(p>.7)text(String(i+1).padStart(2,'0'),x,y+10,23,i<16?CREAM:MUTED,'Mono','center');}footer('Actual Gather example · Reuse and transfers require follow-up');}
function trust(u,type){bg(true);const privacy=type==='privacy';overTitle(privacy?'YOUR HOME DATA':'RECOMMENDATIONS YOU CAN QUESTION',privacy?'Local now. Consent before AI.':'Disclose. Measure. Inspect.',u,true);
 if(privacy){rect(96,400,680,330,'#2c5145',24);rect(125,427,622,270,'#102d27',12);smallPlan(240,463,373,201,u,true);text('ROOM FILES ON THIS DEVICE',440,789,23,MINT,'Mono','center');line(820,560,1130,560,GOLD,3,settle((u-.5)/.6));rect(1170,444,600,216,'#e5ecd9',18);text('YOUR CONSENT',1470,531,37,INK,'Geist','center');text('Required for future AI processing',1470,589,22,INK,'Geist','center');}
 else{['Sponsored placement: label it','Dimensions: verify the fit','Condition: inspect the item'].forEach((a,i)=>{const p=settle((u-i*.4)/.6);ctx.save();ctx.globalAlpha=p;line(72,432+i*142,1740,432+i*142,MUTED,1);text(a,95,509+i*142,45,CREAM);ctx.restore()});}}
const videoMap={keep:{n:'pieces',a:0,b:7},brief:{n:'brief',a:3.8,b:8},compare:{n:'layouts',a:3.3,b:6.8},drag:{n:'diy',a:0,b:10},fold:{n:'shop',a:0,b:4.7},report:{n:'report',a:0,b:2.7},resale:{n:'resale',a:0,b:5},scan:{n:'native',a:1.5,b:19.5},migration:{n:'migrationNative',a:0,b:14}};
function mediaRef(s,t){if(s.kind==='recap')return recapMedia(t-s.start);const m=videoMap[s.kind];if(!m)return null;const time= mix(m.a,m.b,clamp((t-s.start)/(s.end-s.start)));return {n:m.n,time:s.kind==='migration'?Math.min(time,824/60):time}}
async function seekMedia(s,t){const m=mediaRef(s,t);if(!m)return;const v=videos[m.n],target=clamp(m.time,0,v.duration-.025);if(Math.abs(v.currentTime-target)<.004)return;await new Promise(r=>{v.addEventListener('seeked',r,{once:true});v.currentTime=target});}
function realUI(s,u){const v=videos[videoMap[s.kind].n];ctx.drawImage(v,0,0,1920,1080);status({keep:'Your furniture · Your choice',brief:'Two people · HK$3,000',compare:'Compare options for this couple',drag:'Working prototype · Select, drag, review',fold:'Working prototype · Actual folding preview',report:'Moving report · Review and export',resale:'Editable resale draft · Nothing published automatically',migration:'Moving journey · Product visualization'}[s.kind]);if(s.kind==='resale')tag('Illustrative prices · Not a confirmed sale value',60,88,true);if(s.kind==='drag'){rect(1360,106,505,100,'#153b32ef',16);text('16 / 18 retained',1390,171,46,CREAM)}}
function subtitle(t){const c=captions.find(c=>t>=c.start&&t<c.end);if(!c)return;ctx.font='39px Geist';let a='',rows=[];for(const w of c.text.split(' ')){if(ctx.measureText(a+' '+w).width>1610&&a){rows.push(a);a=w}else a+=(a?' ':'')+w}if(a)rows.push(a);const widest=Math.max(...rows.map(r=>ctx.measureText(r).width)),bottom=1020,top=bottom-rows.length*46-19;rect((1920-widest)/2-25,top,widest+50,bottom-top,'rgba(12,31,26,.89)',10);rows.forEach((r,i)=>text(r,960,top+43+i*46,39,'#fffdf6','Geist','center'));}
function shotFrame(s,t){const u=t-s.start;bg();if(storyFrame(s,t))return;if(['keep','brief','compare','drag','fold','report','resale','migration'].includes(s.kind)){realUI(s,u);return;}
 switch(s.kind){
 case 'opening':{
  if(t<2){cover(oldPhoto,mix(1.3,1.07,settle(t/2)));text('A HOME, IN TRANSITION.',65,118,25,INK,'Mono');}
  else if(t<5){cover(scanVideo);status('Simulated capture · Product montage',true);}
  else if(t<8){native((t-5)/3);status('Sample floor plan · Product montage');}
  else if(t<9){cover(roomPhotos[1],mix(1.02,1.2,settle(t-8)));}
  else{model('sofa',2.2,530,-60,1540,1050);const p=settle((t-9)/.55);ctx.save();ctx.globalAlpha=p;text('ReNest',68,452,192,INK,'Editorial');text('The next life of home.',81,561,55,INK);ctx.restore();text('renest-hk.vercel.app',83,846,29,INK,'Mono');}
  // A matching diagonal sweep crosses the frame at the spatial transition, then clears.
  for(const cut of [2,5,8,9])if(t>=cut&&t<cut+.23){const q=(t-cut)/.23;ctx.save();ctx.translate(mix(-1100,2300,q),0);ctx.rotate(.17);rect(0,-200,500,1500,cut===5?CREAM:INK);ctx.restore();}break;}
 case 'city':city(u);break;
 case 'decisions':{bg();text('THE HOUSEHOLD DECISION',65,150,27,MUTED,'Mono');const p=settle(u/.8);model('sofa',2,760,70,1250,850);text('What fits?',65,339,102,INK,'Geist','left',600);text('What is missing?',65,475,83,INK,'Geist','left',600);text('What lives on?',65,611,83,INK,'Geist','left',600);line(70,705,660,705,GOLD,3,p);text('Space + spending + reuse',70,790,31,INK);break;}
 case 'scan':{cover(scanVideo);const labels=u<1.1?'ALIGN SENSOR':u<7.2?'CAPTURE DEPTH':u<12.6?'RECONSTRUCT TRIANGLES':u<16.3?'RECOVER SURFACES':'IDENTIFY FURNITURE';status('Simulated LiDAR capture · Website native animation',u<11);tag(labels,60,90,u<11);const p=u/18;rect(60,875,1800,3,'#778b7a60');rect(60,875,1800*p,3,u<11?MINT:INK);break;}
 case 'plan':{native(u/10);status('Conversion preview · Example floor plan');text(u<2.2?'TRACE THE PLAN':u<8.4?'WALLS BECOME VOLUME':'DOORS. WINDOWS. SPACE.',65,845,34,INK,'Mono');break;}
 case 'plan-note':{native(1);rect(1050,225,790,440,'#153b32ef',16);lines('Preview your file. Explore the sample.',1090,330,67,CREAM,690);text('Automatic reconstruction: planned',1090,597,25,MINT);status('Prototype input boundaries');break;}
 case 'pipeline':pipeline(u);break;
 case 'candidates':candidates(u);break;
 case 'product-macro':{hero(u,{close:true,fold:.7,angle:-.16});status('Drop-leaf dining table · Catalogue model');text('Room for more.',65,831,92,INK,'Editorial');break;}
 case 'product-fold':{const f=u<2?.7*(1-settle(u/2)):u<3.7?0:settle((u-3.7)/2);hero(u,{fold:f,angle:mix(-.16,0,settle(u/6))});text(u<3.7?'Open for dinner.':'Fold for everyday.',65,175,83,INK,'Editorial');footer('Preview the mechanism. Check the space.');break;}
 case 'alternatives':{hero(u,{choices:true,fold:1-settle((u-2.6)/1.4)});text('Choose the missing function.',65,191,71,INK,'Editorial');footer('Dining · Preparation · Work  /  Existing catalogue options');break;}
 case 'product-fit':{hero(u,{placed:true,fold:0});status('The selected product, in the example home');if(u>2){rect(63,183,600,245,'#153b32ed',18);text('A model, in context.',93,255,48,CREAM,'Editorial');text('Dining function · Actual dimensions',96,321,25,MINT);text('Compare before you buy.',96,379,29,CREAM);}break;}
 case 'commerce':{const p=settle(u/1);cover(productPage,mix(1.1,1,p));status('Actual product page · Demo catalogue prices');break;}
 case 'partner':partner(u);break;
 case 'pilot':pilot(u);break;
 case 'impact':impact(u);break;
 case 'privacy':trust(u,'privacy');break;
 case 'ethics':trust(u,'ethics');break;
 case 'home':{cover(roomPhotos[1],mix(1,1.1,settle(u/3)));text('Some things come with you.',65,179,83,INK,'Editorial');break;}
 case 'closing':{model('sofa',2.2,440,-35,1540,1010);text('ReNest',75,340,167,INK,'Editorial');lines('Make room for what matters.',82,508,80,INK,800,'Editorial',400);text('renest-hk.vercel.app',85,792,37,INK,'Mono');rect(1590,742,240,240,'#fff',14);ctx.drawImage(qr,1600,752,220,220);break;}
 }
}
window.renderAt=async(t)=>{t=clamp(t,0,222.999);const s=shots.find(s=>t>=s.start&&t<s.end);await seekMedia(s,t);shotFrame(s,t);subtitle(t);window.filmTime=t;window.currentShot=s.id;return {time:t,shot:s.id}};
window.renderSequence=async({from=0,to=223,fps=60,job='master',scale=1}={})=>{window.exportState={job,status:'running',frame:0,total:Math.round((to-from)*fps)};await fetch('/begin',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({job,fps})});const target=scale===1?canvas:document.createElement('canvas');if(scale!==1){target.width=1920*scale;target.height=1080*scale}try{for(let i=0;i<window.exportState.total;i++){await window.renderAt(from+i/fps);if(target!==canvas)target.getContext('2d').drawImage(canvas,0,0,target.width,target.height);const blob=await new Promise(r=>target.toBlob(r,'image/jpeg',.97));const res=await fetch('/frame',{method:'POST',headers:{'X-Frame-Index':String(i)},body:blob});const body=await res.text();if(!res.ok)throw new Error(body);window.exportState.frame=i+1;}await fetch('/finish',{method:'POST'});window.exportState.status='done';}catch(e){window.exportState.status='error';window.exportState.error=String(e);throw e}};


// v1.11: case-led direction; all supplementary graphics are editorial, not simulated UI.
const lived=await Promise.all(['a-living-evening','a-study-day','a-dining-evening','b-living-evening'].map(n=>img(`/public/films/interior/${n}.jpg`)));
const diyVideo=document.createElement('video');diyVideo.src=URL.createObjectURL(await fetch('../v1.8-refined/clips/diy.mp4').then(r=>r.blob()));diyVideo.muted=true;await new Promise(r=>diyVideo.onloadeddata=r);videos.diy=diyVideo;
const migrationNative=document.createElement('video');migrationNative.src=URL.createObjectURL(await fetch('../v1.8-refined/clips/migration-native.mp4').then(r=>r.blob()));migrationNative.muted=true;await new Promise(r=>migrationNative.onloadeddata=r);videos.migrationNative=migrationNative;
const uploadPreview=await img('../v1.8-refined/qa/upload.png');const uploadedPlan=await img('../v1.8-refined/qa/new-home-plan.png');
const beforeDiy=await img('../v1.8-refined/qa/diy-before.png');
function shade(side='left',strength=.85){const g=ctx.createLinearGradient(side==='left'?0:1920,0,side==='left'?1920:0,800);g.addColorStop(0,`rgba(6,26,22,${strength})`);g.addColorStop(.6,'rgba(6,26,22,.23)');g.addColorStop(1,'rgba(6,26,22,.04)');ctx.fillStyle=g;ctx.fillRect(0,0,1920,1080)}
function cinematic(u,closing=false){
 const z=closing?1.03:mix(1.3,1.04,settle(u/9));cover(lived[!closing&&u>=4&&u<7.6?2:0],z,960+28*Math.sin(u*.13),540);shade('left',.87);
 // A near door-jamb drifts across the frame; the room remains the subject.
 if(!closing){const p=settle(u/3.7);rect(-150,0,260*(1-p),1080,'#10291fee');}
 const glow=ctx.createRadialGradient(1510,270,5,1510,270,750);glow.addColorStop(0,'#ffe6ae24');glow.addColorStop(1,'#ffe6ae00');ctx.fillStyle=glow;ctx.fillRect(0,0,1920,1080);
 if(closing){text('ReNest',74,308,162,CREAM,'Editorial');lines('Make room for what matters.',82,463,79,CREAM,760,'Editorial',400);text('Explore your next home',87,787,26,MINT);text('renest-hk.vercel.app',85,850,33,CREAM,'Mono');rect(1590,736,250,250,'#fff',16);ctx.drawImage(qr,1602,748,226,226);return;}
 const p=settle((u-.7)/.8);ctx.save();ctx.globalAlpha=p;text('THE NIGHT BEFORE A NEW ADDRESS.',77,136,23,MINT,'Mono');
 if(u<7.6){const q=settle((u-2.5)/.7);lines('What makes a home\nstays with you.'.replace('\n',' '),74,635,99,CREAM,900,'Editorial',400);line(80,854,570,854,GOLD,3,q);text('A familiar corner. A new chapter.',80,909,29,CREAM);}
 else{ctx.globalAlpha*=settle((u-7.6)/.75);text('ReNest',72,694,178,CREAM,'Editorial');text('Easier moves. Less waste. Better value.',82,776,40,CREAM);text('renest-hk.vercel.app',83,886,26,MINT,'Mono');}ctx.restore();
}
function houseIcon(x,y,scale=1,col=CREAM){ctx.save();ctx.translate(x,y);ctx.scale(scale,scale);ctx.strokeStyle=col;ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(-28,0);ctx.lineTo(0,-24);ctx.lineTo(28,0);ctx.moveTo(-21,-4);ctx.lineTo(-21,28);ctx.lineTo(21,28);ctx.lineTo(21,-4);ctx.moveTo(-6,28);ctx.lineTo(-6,10);ctx.lineTo(7,10);ctx.lineTo(7,28);ctx.stroke();ctx.restore()}
function people(x,y,s=1,col=MINT){ctx.save();ctx.translate(x,y);ctx.scale(s,s);for(const a of [-12,12]){ctx.fillStyle=col;ctx.beginPath();ctx.arc(a,0,7,0,Math.PI*2);ctx.fill();rect(a-7,12,14,30,col,6)}ctx.restore()}
function geography(u){bg(true);text('HONG KONG / THE NEXT CHAPTER',64,112,24,MINT,'Mono');
 ctx.save();ctx.translate(-90,125);ctx.scale(1.46,1.18);ctx.fillStyle='#426b5a';paths.forEach(p=>ctx.fill(p));
 // Northern focus is schematic, explicitly not a development boundary.
 const q=settle((u-.5)/1);ctx.globalAlpha=.18*q;ctx.fillStyle=GOLD;ctx.beginPath();ctx.ellipse(380,168,132,66,-.25,0,Math.PI*2);ctx.fill();ctx.globalAlpha=1;
 ctx.strokeStyle=GOLD;ctx.lineWidth=3;ctx.setLineDash([8,7]);ctx.stroke(new Path2D(map.route));ctx.setLineDash([]);
 for(const [x,y] of [map.start,map.end]){ctx.beginPath();ctx.arc(x,y,7,0,Math.PI*2);ctx.fillStyle=CREAM;ctx.fill()}ctx.restore();
 tag('Northern Metropolis',295,224,true);text('Yuen Long + North District',260,289,22,MINT);tag('Kowloon',500,605,true);text('Location schematic',68,883,19,MINT,'Mono');
 text('~500,000',1034,268,112,CREAM,'Geist','left',600);text('additional homes planned',1041,328,37,CREAM);text('Upon full development',1044,376,24,MINT);
 // Recognisable apartment buildings: facade, windows, street and households.
 for(let i=0;i<5;i++){let x=1053+i*158,h=200+(i%3)*50,p=settle((u-.6-i*.16)/.8);rect(x,699-h*p,127,h*p,'#6d8f78',2);rect(x+127,709-h*p,18,h*p-10,'#365849');for(let r=0;r<5;r++)for(let c=0;c<3;c++){const wy=699-h*p+27+r*39;if(wy<685)rect(x+18+c*34,wy,16,21,(r+c+i)%4===0?GOLD:'#c4d4bd');}}
 line(1038,719,1846,719,MINT,2,settle((u-1)/1));
 const p=settle((u-3.5)/1.3);people(mix(1110,1220,p),760,1.15);line(1280,784,1430,784,GOLD,3,p);houseIcon(1515,778,1.15);text('Homes → household decisions',1040,875,29,CREAM);
 text('HKSAR Government · 28 May 2025',65,940,21,MINT);text('Map © OpenStreetMap contributors',1850,940,17,MINT,'Mono','right');
}
function lifeDecisions(u){bg(true);const ims=[lived[0],lived[1],lived[2]],xs=[40,685,1270],ws=[615,555,610],titles=['Keep what matters','Make space to work','Bring friends together'];
 for(let i=0;i<3;i++){let p=settle((u-i*.18)/.75);ctx.save();ctx.beginPath();ctx.roundRect(xs[i],230+50*(1-p),ws[i],630,16);ctx.clip();const z=1+.025*Math.sin(u*.5+i);fitImage(ims[i],xs[i]-(ws[i]*z-ws[i])/2,230,ws[i]*z,630,'cover');const g=ctx.createLinearGradient(0,540,0,890);g.addColorStop(0,'#102d2700');g.addColorStop(1,'#102d27ed');ctx.fillStyle=g;ctx.fillRect(xs[i],400,ws[i],470);text('0'+(i+1),xs[i]+26,718,23,GOLD,'Mono');lines(titles[i],xs[i]+26,774,48,CREAM,ws[i]-60,'Editorial',400);ctx.restore();}
 text('One move. Three decisions.',65,151,76,CREAM,'Editorial');text('A two-person household · An example journey',65,918,28,MINT);}
function briefOverlay(u){const v=videos.brief;ctx.drawImage(v,0,0,1920,1080);const p=settle(u/.6);ctx.save();ctx.globalAlpha=p;rect(76,188,910,684,'#10352ef2',24);text('MEET THIS HOUSEHOLD',113,250,23,MINT,'Mono');people(857,255,1.6);text('Two people.',109,371,85,CREAM,'Editorial');text('HK$3,000',111,488,90,CREAM,'Geist','left',600);text('Furniture budget',115,532,27,MINT);const a=['Keep the linen sofa','A comfortable work corner','Dinner with friends'];a.forEach((v,i)=>{const q=settle((u-.7-i*.7)/.5);line(116,597+i*79,153,597+i*79,GOLD,3,q);ctx.save();ctx.globalAlpha=q;text(v,173,607+i*79,34,CREAM);ctx.restore()});ctx.restore();status('Example brief · Actual household and budget controls');}
function intent(u){bg(true);text('GENAI / FROM INTENT TO ARRANGEMENT',65,126,25,MINT,'Mono');lines('“Keep our sofa. Make room for work and friends.”',65,253,72,CREAM,1500,'Editorial',400);
 const labels=[['02 PEOPLE','HOUSEHOLD'],['HK$3,000','BUDGET'],['F01 / KEEP','FURNITURE'],['WORK + HOST','ACTIVITIES']];labels.forEach((v,i)=>{let x=64+i*465,p=settle((u-.3-i*.25)/.6);ctx.save();ctx.globalAlpha=p;rect(x,449,438,195,'#31594b',16);text(v[1],x+25,497,20,MINT,'Mono');text(v[0],x+25,577,42,CREAM,'Geist','left',550);ctx.restore()});
 line(84,711,1816,711,GOLD,3,settle((u-1.8)/1));['Room geometry','Existing furniture','Partner product models'].forEach((v,i)=>{const x=86+i*615;houseIcon(x+28,795,.55);text(v,x+71,808,28,CREAM)});status('GenAI workflow · Planned integration',true);}
function aiPlanning(u){bg();const cycle=Math.min(2,Math.floor(u/.65)),q=settle((u% .65)/.5),seq=[1,3,2];stage('home',1);camera.position.set(7.2,12,13);camera.zoom=1.22;camera.lookAt(0,.3,0);camera.updateProjectionMatrix();
 for(const {o,target,id} of assembly){o.position.copy(target);const base=rawLayouts[2].placements.find(p=>p.id===id),from=rawLayouts[seq[Math.max(0,cycle-1)]].placements.find(p=>p.id===id),to=rawLayouts[seq[cycle]].placements.find(p=>p.id===id);if(base&&to){o.position.x+=mix((from?.x??base.x)-base.x,to.x-base.x,q);o.position.z+=mix((from?.z??base.z)-base.z,to.z-base.z,q);o.rotation.y=mix((from?.rotation??base.rotation)-base.rotation,to.rotation-base.rotation,q)*Math.PI/180;o.position.y+=.08*Math.sin(q*Math.PI);}}
 renderer.render(scene,camera);ctx.drawImage(renderer.domElement,-265,60,1850,1040);rect(1370,151,492,703,'#153b32f5',22);text('EXPLORE',1406,211,22,MINT,'Mono');text('Check the fit.',1405,293,46,CREAM,'Editorial');const criteria=['Keep the sofa','Allocate workspace','Make room to gather','Check dimensions'];criteria.forEach((a,i)=>{const active=Math.min(3,Math.floor(u/.45));line(1408,368+i*97,1438,368+i*97,i<=active?GOLD:MUTED,4);text(a,1457,379+i*97,27,CREAM)});text('Compare → refine',1407,795,27,MINT);status('GenAI planning visualization · Planned integration');text('Candidate changes use the project’s actual furniture and layouts.',65,906,23,INK);}
function diy(u){const v=videos.diy;const z=1.28;ctx.save();ctx.beginPath();ctx.rect(0,0,1430,1080);ctx.clip();ctx.drawImage(v,30,-140,1920*z,1080*z);ctx.restore();rect(0,0,1430,96,'#e9eae1');rect(48,358,286,326,'#153b32ef',18);text('BEFORE',72,405,20,MINT,'Mono');ctx.drawImage(beforeDiy,307,282,507,378,65,434,252,188);text('Same sofa. New position.',72,656,17,CREAM);rect(1430,0,490,1080,INK);text('YOUR TURN',1465,185,23,MINT,'Mono');text('Manual DIY',1462,273,57,CREAM,'Editorial');const steps=['Select the sofa','Park it outside','Choose a new place','Confirm the move'];let active=u<.8?0:u<3.6?1:u<6.8?2:3;steps.forEach((v,i)=>{const y=394+i*110;rect(1465,y-37,38,38,i===active?GOLD:'#436457',19);text(String(i+1),1484,y-10,20,i===active?INK:CREAM,'Mono','center');text(v,1520,y-9,26,i===active?CREAM:MINT)});text('Actual website operation',1465,879,20,MINT);status('Select → drag → place → confirm');}
function recommend(u){bg(true);const step=Math.min(2,Math.floor(u/2.25)),ids=[3,13,1],id=ids[step],local=u-step*2.25,p=settle(local/.6),item=catalogue[id];
 text('PARTNER MODELS / LESS SEARCHING',65,127,23,MINT,'Mono');lines('Find the missing function.',64,252,84,CREAM,720,'Editorial',400);
 const labels=['Work comfortably','Consider pre-owned','Make room for guests'];labels.forEach((v,i)=>{const y=528+i*105;line(69,y-13,103,y-13,i===step?GOLD:'#4b7060',4);text(v,126,y,35,i===step?CREAM:MUTED);});text('Function + dimensions + budget',69,905,28,MINT);
 ctx.save();ctx.translate(850+70*(1-p),180);ctx.globalAlpha=.65+.35*p;ctx.beginPath();ctx.roundRect(0,0,995,675,22);ctx.clip();rect(0,0,995,675,'#f4f3ee');fitImage(productImages[id],0,0,995,585);const g=ctx.createLinearGradient(0,400,0,675);g.addColorStop(0,'#102d2700');g.addColorStop(1,'#102d27');ctx.fillStyle=g;ctx.fillRect(0,350,995,325);text(item.name,37,580,42,CREAM,'Editorial');text(item.dimensions,40,636,25,MINT,'Mono');text('HK$'+item.price,946,636,30,CREAM,'Geist','right');ctx.restore();
 [0,1,2].forEach(i=>{rect(850+i*333,884,307,3,i===step?GOLD:'#476656');});status('Recommendation illustration · Actual catalogue data',true);}
function shortlist(u){bg();const p=settle(u/1);const id=1;photo(productImages[id],mix(705,72,p),184,mix(548,810,p),567,18);rect(952,187,890,638,INK,20);text('A SHORTLIST YOU CAN EVALUATE',994,247,22,MINT,'Mono');lines('Dinner with friends. Room for everyday.',991,346,65,CREAM,787,'Editorial',400);const item=catalogue[id];text(item.name,995,511,29,CREAM);text(item.dimensions,995,569,27,MINT,'Mono');text('HK$'+item.price+' · Catalogue reference',995,631,30,CREAM);line(994,677,1765,677,GOLD,2,settle((u-1)/.7));text('Preview in 3D → check your arrangement',995,756,29,CREAM);status('Illustrative recommendation · Real catalogue product');text('Less searching. A clearer decision.',76,881,56,INK,'Editorial');}
function ecosystem(u){bg(true);text('PARTNER MODELS / A PRACTICAL ADVANTAGE',64,123,23,MINT,'Mono');text('Reuse more. Use space better.',63,222,76,CREAM,'Editorial');
 const a=[['Second-hand','Keep products in use',13],['Folding furniture','Make compact rooms work',1]];a.forEach(([name,sub,id],i)=>{const x=65+i*548,p=settle((u-i*.35)/.8);ctx.save();ctx.globalAlpha=p;photo(productImages[id],x,302,510,382.5,16);rect(x,684,510,151,'#355a4d');text(name,x+24,745,37,CREAM,'Editorial');text(sub,x+24,800,23,MINT);ctx.restore()});line(1135,540,1275,540,GOLD,4,settle((u-.8)/.7));rect(1305,308,550,446,'#e9eedf',20);text('Shared product models',1340,381,34,INK);['Plan around dimensions','Preview in the new home','Explore the seller’s product'].forEach((a,i)=>text(a,1340,463+i*85,26,INK));text('Proposed revenue: qualified referrals + sales commissions',65,889,29,MINT);}
function recapMedia(u){if(u<1.8)return {n:'native',time:5+u*7};if(u>=3.7&&u<5.8)return {n:'layouts',time:Math.min(6.8,(u-3.7)*5.23)};return null;}
function endSequence(u){
 if(u<1.8){cover(scanVideo);status('LOOK BACK / CAPTURE',true);return;}
 if(u<3.7){native((u-1.8)/1.9);status('LOOK BACK / UNDERSTAND');return;}
 if(u<5){cover(videos.layouts);status('LOOK BACK / CHOOSE');return;}
 const dissolve=settle((u-5)/.8),cameraP=settle((u-5)/3);
 if(dissolve<1)cover(videos.layouts);
 ctx.save();ctx.globalAlpha=dissolve;cover(lived[0],mix(1.11,1.03,cameraP),mix(998,960,cameraP),540);shade('left',.87);
 const brand=settle((u-6.3)/.9);ctx.globalAlpha*=brand;const dy=22*(1-brand);
 text('ReNest',74,302+dy,162,CREAM,'Editorial');
 ['Easier moves.','Less waste.','Better value.'].forEach((v,i)=>text(v,83,445+i*91+dy,76,CREAM,'Editorial'));
 const end=settle((u-7)/.7);ctx.globalAlpha=dissolve*end;text('Explore your next home',87,787,26,MINT);text('renest-hk.vercel.app',85,850,33,CREAM,'Mono');rect(1590,736,250,250,'#fff',16);ctx.drawImage(qr,1602,748,226,226);ctx.restore();
}
function upload(u){cover(uploadPreview);rect(0,78,1533,1002,CREAM);text('YOUR NEW HOME / START WITH A FLOOR PLAN',64,155,24,MUTED,'Mono');text('Upload. Understand. Arrange.',63,252,68,INK,'Editorial');const p=settle(u/.8);ctx.save();ctx.translate(0,22*(1-p));ctx.globalAlpha=p;photo(uploadedPlan,130,303,1240,588,18);ctx.restore();status('Actual local file preview');tag('Automatic conversion planned · Example shown next',69,909);}
function storyFrame(s,t){const u=t-s.start;switch(s.kind){case'opening':cinematic(u);return true;case'upload':upload(u);return true;case'city':geography(u);return true;case'decisions':lifeDecisions(u);return true;case'brief':briefOverlay(u);return true;case'pipeline':intent(u);return true;case'candidates':aiPlanning(u);return true;case'drag':diy(u);return true;case'recommend':recommend(u);return true;case'shortlist':shortlist(u);return true;case'partner':ecosystem(u);return true;case'recap':case'closing':endSequence(t-211);return true;}return false;}


const originalStoryFrame=storyFrame;
function stepHeader(n,title,dark=false){status(`STEP ${n} / ${title}`,dark)}
function checkMark(x,y,p=1){line(x,y,x+10,y+11,GOLD,4,p);if(p>.4)line(x+10,y+11,x+30,y-16,GOLD,4,(p-.4)/.6)}
function family19(u){cover(lived[0],1.04);shade('left',.94);stepHeader('01','ONE HOUSEHOLD. REAL NEEDS.',true);text('Meet our couple.', 70,241,90,CREAM,'Editorial');people(1690,210,2.8);text('A new home in the Northern Metropolis',76,312,31,MINT);const needs=['Keep our favourite sofa','Work comfortably from home','Welcome a parent using a wheelchair'];needs.forEach((v,i)=>{const p=settle((u-i*1.25)/.7);ctx.save();ctx.globalAlpha=p;checkMark(80,436+i*109,p);text(v,136,445+i*109,36,CREAM);ctx.restore()});tag('18 existing pieces',76,813,true);tag('HK$3,000 furniture budget',360,813,true)}
function questionnaire19(u){bg(true);stepHeader('04','PLAN NEEDS',true);text('Plan needs. Meet this couple.',65,205,75,CREAM,'Editorial');text('One brief for budget, access, work and guests.',70,270,30,MINT);const qs=[['Wheelchair access needed?','Yes — a parent visits'],['Where do you work?','At home — keep our desk'],['How do you host?','A dining table that opens for friends']];qs.forEach(([q,a],i)=>{const y=350+i*148,p=settle((u-1-i*2.1)/.65);rect(65,y,1200,125,'#274b40',16);text(q,96,y+48,31,CREAM);ctx.save();ctx.globalAlpha=p;checkMark(101,y+90,p);text(a,151,y+96,29,MINT);ctx.restore()});rect(1320,350,530,421,'#e8ecdf',20);text('THEIR BRIEF',1354,406,22,MUTED,'Mono');text('2 people',1353,485,53,INK,'Editorial');text('HK$3,000',1353,577,61,INK);text('Keep sofa + desk',1357,653,27,INK);text('Accessibility + work + guests',1357,714,21,MUTED);text('Other needs?',71,853,26,MINT);tag('Cats / dogs',300,823,true);tag('Instrument space',520,823,true);text('Example questionnaire · Proposed personalization workflow',70,914,21,MINT,'Mono')}
function phone19(u){bg();stepHeader('02','ADD THE FURNITURE YOU OWN');text('Phone photos. Familiar tools.',65,193,78,INK,'Editorial');rect(100,279,376,571,INK,42);rect(114,294,348,540,'#fbfaf5',30);rect(230,309,114,19,INK,10);photo(lived[0],132,374,312,283,8);text('Your sofa',287,707,27,INK,'Geist','center');const cap=settle((u-.8)/.5);ctx.fillStyle=GOLD;ctx.beginPath();ctx.arc(287,776,29+4*Math.sin(cap*Math.PI),0,Math.PI*2);ctx.fill();text('01 / TAKE PHOTOS',146,358,18,INK,'Mono');const p=settle((u-3)/1);line(517,551,740,551,GOLD,4,p);rect(770,365,443,355,'#dfe7d4',22);text('02 / CONFIRM',804,424,22,MUTED,'Mono');text('Dimensions',801,495,45,INK,'Editorial');text('Photo → 3D tool',804,563,28,INK);text('or scan-app model import',804,618,24,INK);text('Review once. Reuse in your plan.',804,676,19,MUTED);line(1240,551,1370,551,GOLD,4,settle((u-6)/1));ctx.save();ctx.globalAlpha=settle((u-7)/1);model('sofa',u-7,1200,275,760,510);text('03 / READY TO PLACE',1400,840,22,INK,'Mono');ctx.restore();text('Photo-to-3D / app import: proposed integration · Confirm real dimensions',70,900,20,MUTED,'Mono')}
function inputPlan19(u){bg();stepHeader('03','ADD YOUR NEW HOME');text('Two easy ways to begin.',65,197,84,INK,'Editorial');rect(66,289,856,534,'#fffdf6',18);photo(uploadedPlan,110,365,768,348,12);text('Upload your floor plan',106,774,36,INK,'Editorial');rect(974,289,876,534,INK,18);photo(floorPlan,1010,365,800,348,12);text('Choose a built-in example',1015,774,36,CREAM,'Editorial');text('Northern Metropolis · Example layouts',1020,853,25,INK);text('Upload preview available · Automatic 3D conversion planned',70,915,22,MUTED,'Mono')}
function intent19(u){bg(true);stepHeader('04','EXISTING FURNITURE FIRST / AI WORKFLOW',true);text('Needs become layout decisions.',65,213,76,CREAM,'Editorial');const data=[['YOUR NEED','AI ACTION','WHY IT HELPS'],['Parent uses a wheelchair','Keep a continuous route','Make movement easier'],['Work from home','Place the existing desk','Keep a useful work corner'],['Keep our sofa','Reuse it along the wall','Free the centre of the room']];data.forEach((r,i)=>{const y=335+i*132,p=i?settle((u-.5-(i-1)*1.5)/.8):1;ctx.save();ctx.globalAlpha=p;line(70,y+43,1845,y+43,'#49695b',1);r.forEach((v,j)=>text(v,76+j*606,y,i?29:22,i?CREAM:MINT,i?'Geist':'Mono'));ctx.restore()});text('PLACE → CHECK → EXPLAIN → REVIEW',75,883,30,MINT,'Mono')}
function layout19(u,selected=false){stage('home',1);assembly.forEach(({o,id,target})=>{o.visible=selected||!id.startsWith('N');o.position.copy(target);o.traverse(n=>{if(n.isMesh){n.material.opacity=1;n.material.transparent=false}});if(!selected&&id==='F01')o.position.x+=.9*(1-settle(u/4));if(!selected&&id==='F15')o.position.z+=.7*(1-settle((u-7.5)/4))});camera.position.set(7.2,12,13);camera.zoom=1.18;camera.lookAt(0,.3,0);camera.updateProjectionMatrix();renderer.render(scene,camera);ctx.drawImage(renderer.domElement,-305,133,1740,979)}
function solve19(u){bg();layout19(u);stepHeader('04','AI PLANNING / PROPOSED WORKFLOW');const k=u<7.5?0:u<12.5?1:2;const tt=['Keep the sofa.','Create the work corner.','Review the route.'];const detail=['Place it along the wall to open up the centre.','Use their existing desk. Keep the work area together.','Check movement through the living area for their parent.'];rect(1275,171,583,687,INK,22);text('WHY THIS LAYOUT?',1310,226,23,MINT,'Mono');lines(tt[k],1310,316,58,CREAM,510,'Editorial',400);lines(detail[k],1312,491,32,CREAM,484,'Geist',400);['Sofa retained','Workspace allocated','Access route considered'].forEach((v,i)=>{text((i<=k?'✓  ':'○  ')+v,1313,681+i*61,25,i<=k?MINT:MUTED)});const id=k===0?'F01':k===1?'F15':'F01',ob=assembly.find(a=>a.id===id);if(ob){const [x,y]=project(ob.o.position.clone().add(new THREE.Vector3(0,.5,0)),-305,133,1740,979);ctx.strokeStyle=GOLD;ctx.lineWidth=4;ctx.beginPath();ctx.ellipse(x,y,75+7*Math.sin(u*2),35,0,0,Math.PI*2);ctx.stroke()}
if(k===2){rect(72,725,940,142,'#fffdf3ed',16);text('ACCESS REVIEW',98,764,20,MUTED,'Mono');for(let i=0;i<5;i++)line(109+i*171,812,248+i*171,812,GOLD,8,settle((u-13-i*.35)/.5));text('Entry',106,851,19,INK);text('Living',441,851,19,INK);text('Work / dining',738,851,19,INK)}text('Planning illustration · Measure clearances and turning space before moving',68,920,21,MUTED,'Mono')}
function gaps19(u){bg();layout19(20);stepHeader('05','FIND THE MISSING FUNCTIONS');rect(1200,195,660,652,INK,22);text('What is still missing?',1238,283,54,CREAM,'Editorial');const a=[['Work chair','Support the existing desk'],['Folding dining set','Host friends, then reclaim space']];a.forEach(([v,d],i)=>{const p=settle((u-.6-i*1.4)/.7);ctx.save();ctx.globalAlpha=p;text('0'+(i+1),1240,397+i*203,26,GOLD,'Mono');text(v,1300,397+i*203,36,CREAM);text(d,1240,463+i*203,26,MINT);ctx.restore()});text('Existing furniture first. Fill only the gaps.',72,897,35,INK,'Editorial')}
function shopping19(u){bg(true);stepHeader('05','COMPARE SECOND-HAND AND NEW',true);text('Buy only what is missing.',65,202,80,CREAM,'Editorial');const data=[[13,'SECOND-HAND','Example source: Xianyu'],[1,'NEW / FOLDING','Example source: Taobao']];data.forEach(([id,title,source],i)=>{const x=68+i*923,p=settle((u-i*.7)/.7);ctx.save();ctx.globalAlpha=p;photo(productImages[id],x,291,852,389,18);rect(x,660,852,185,'#315347',14);text(title,x+25,704,21,MINT,'Mono');text(catalogue[id].name,x+25,756,33,CREAM,'Editorial');text('HK$'+catalogue[id].price+'  ·  '+catalogue[id].dimensions,x+25,812,25,CREAM);text(source,x+25,870,25,MINT);ctx.restore()});text('Illustrative sources · Catalogue reference prices · Platform integration planned',70,908,20,MINT,'Mono')}
function delivery19(u){bg();stepHeader('05','COMPARE THE COST TO YOUR DOOR');text('Nearby can mean better value.',65,199,79,INK,'Editorial');const rows=[['Seller A','3 km','HK$120','HK$60','HK$180'],['Seller B','18 km','HK$100','HK$180','HK$280']];const xx=[91,445,717,1065,1440];['SELLER','DISTANCE','ITEM','DELIVERY EST.','TOTAL EST.'].forEach((s,i)=>text(s,xx[i],329,22,MUTED,'Mono'));rows.forEach((r,i)=>{const y=374+i*172;rect(65,y,1789,143,i?'#e0e5d8':INK,15);r.forEach((s,j)=>text(s,xx[j],y+91,j?43:35,i?INK:CREAM));if(i===0&&u>2)checkMark(1777,y+77,settle((u-2)/.5))});text('Compare fit + condition + distance + delivered cost',73,823,35,INK);text('Illustrative distances and delivery estimates · Not live listings or quotes',72,910,23,MUTED,'Mono')}
function updated19(u){bg();layout19(u,true);stepHeader('06','YOUR CHOICE UPDATES THE WHOLE PLAN');const p=settle(u/2);rect(1265,204,594,617,INK,22);text('Selected → updated',1298,286,43,CREAM,'Editorial');['Add selected furniture','Recheck remaining space','Review access routes','Confirm the total cost'].forEach((s,i)=>{const q=settle((u-.5-i*.9)/.5);ctx.save();ctx.globalAlpha=q;checkMark(1305,379+i*101,q);text(s,1355,391+i*101,26,CREAM);ctx.restore()});text('Furniture models in the example home · Proposed AI update',67,919,22,MUTED,'Mono')}
function results19(u){cover(lived[u<5?0:2],1.04);shade('left',.96);stepHeader('07','THE SAME FAMILY. A COMPLETE PLAN.',true);text('A home that fits their life.',68,202,81,CREAM,'Editorial');const rs=['16 of 18 existing pieces kept','Sofa retained. Work corner ready.','Table opens for friends, folds for space.','Access needs included in the plan.'];rs.forEach((v,i)=>{const q=settle((u-.1-i*.6)/.5);ctx.save();ctx.globalAlpha=q;checkMark(79,322+i*112,q);text(v,129,336+i*112,31,CREAM);ctx.restore()});rect(1260,302,599,518,'#eaf0e1f5',22);text('ILLUSTRATIVE PURCHASE PLAN',1294,356,20,MUTED,'Mono');text('1 pre-owned chair',1295,426,27,INK);text('HK$120',1809,426,27,INK,'Geist','right');text('1 new folding dining set',1295,489,27,INK);text('HK$890',1809,489,27,INK,'Geist','right');text('Estimated delivery',1295,552,27,INK);text('HK$180',1809,552,27,INK,'Geist','right');line(1295,590,1819,590,MUTED,1);text('HK$1,190',1292,675,69,INK);text('of HK$3,000 budget',1297,731,28,INK);text('HK$1,810 remaining',1297,782,25,MUTED);text('2 pieces available for resale · Reuse continues with the next household',75,904,27,MINT)}
// Override editorial scenes while retaining the original visual language and source footage.
storyFrame=function(s,t){const u=t-s.start;switch(s.kind){case'opening':cinematic(u);return true;case'family':family19(u);return true;case'questionnaire':questionnaire19(u);return true;case'phone':phone19(u);return true;case'input-plan':inputPlan19(u);return true;case'plan':native(u/10);stepHeader('03','PREVIEW YOUR SPACE');text('Example floor plan · Automatic conversion planned',70,893,25,INK);return true;case'intent-v19':intent19(u);return true;case'solve':solve19(u);return true;case'gaps':gaps19(u);return true;case'shopping':shopping19(u);return true;case'delivery':delivery19(u);return true;case'updated':updated19(u);return true;case'results':results19(u);return true;case'drag':diy(u);return true;case'partner':ecosystem(u);text('Consent before future AI processing · Verify sizes, condition and sponsored labels',70,923,20,MINT);return true;default:return originalStoryFrame(s,t)}};



// One narrative purpose per chapter: needs, actions, then outcomes.
const beforeFlow=storyFrame;
function trustFlow(u){
 bg(true);status('RESPONSIBLE PLANNING',true);
 text('Private plans. Informed choices.',65,218,77,CREAM,'Editorial');
 const cards=[['YOUR ROOM DATA',['Room files stay local','Consent for future AI processing']],['YOUR DECISIONS',['Check dimensions and condition','Sponsored recommendations labelled']]];
 cards.forEach(([title,items],i)=>{const x=65+i*920;rect(x,350,870,410,'#274b40',20);text(title,x+36,420,23,MINT,'Mono');items.forEach((v,j)=>{checkMark(x+40,509+j*116);lines(v,x+91,520+j*116,34,CREAM,720)})});
}
function outcomeFlow(u){
 if(u>=8){impact(u-8);return}
 cover(lived[u<4?0:2],1.04);shade('left',.96);status('THEIR PLAN, READY.',true);
 text('A home that fits their life.',68,202,81,CREAM,'Editorial');
 ['Their sofa stays','A dedicated workspace','A table that opens for friends','Access needs included'].forEach((v,i)=>{const p=settle((u-i*.45)/.5);ctx.save();ctx.globalAlpha=p;checkMark(79,334+i*115,p);text(v,129,349+i*115,36,CREAM);ctx.restore()});
 rect(1260,302,599,518,'#eaf0e1f5',22);text('ILLUSTRATIVE PURCHASE PLAN',1294,356,20,MUTED,'Mono');
 [['1 pre-owned chair','HK$120'],['1 new folding dining set','HK$890'],['Estimated delivery','HK$180']].forEach(([a,b],i)=>{text(a,1295,426+i*63,27,INK);text(b,1809,426+i*63,27,INK,'Geist','right')});
 line(1295,590,1819,590,MUTED,1);text('HK$1,190',1292,675,69,INK);text('of HK$3,000 budget',1297,731,28,INK);text('HK$1,810 remaining',1297,782,25,MUTED);
}
storyFrame=function(s,t){if(s.kind==='trust-combined'){trustFlow(t-s.start);return true}if(s.kind==='outcome'){outcomeFlow(t-s.start);return true}return beforeFlow(s,t)};
window.filmReady=true;await window.renderAt(0);
