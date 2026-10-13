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
