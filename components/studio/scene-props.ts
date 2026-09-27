import * as T from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
const material=(color:string,metalness=0,roughness=.55)=>new T.MeshStandardMaterial({color,metalness,roughness});
function box(g:T.Object3D,size:[number,number,number],pos:[number,number,number],m:T.Material,r=.025){const mesh=new T.Mesh(new RoundedBoxGeometry(...size,3,Math.min(r,...size.map(n=>n*.45))),m);mesh.position.set(...pos);mesh.castShadow=true;mesh.receiveShadow=true;g.add(mesh);return mesh;}
function disc(g:T.Object3D,r:number,h:number,pos:[number,number,number],m:T.Material){const mesh=new T.Mesh(new T.CylinderGeometry(r,r,h,32),m);mesh.rotation.x=Math.PI/2;mesh.position.set(...pos);g.add(mesh);return mesh;}
function roundedPanel(g:T.Object3D,size:[number,number,number],pos:[number,number,number],m:T.Material,r:number){
 const [w,h,depth]=size,x=-w/2,y=-h/2;const shape=new T.Shape();shape.moveTo(x+r,y);shape.lineTo(x+w-r,y);shape.quadraticCurveTo(x+w,y,x+w,y+r);shape.lineTo(x+w,y+h-r);shape.quadraticCurveTo(x+w,y+h,x+w-r,y+h);shape.lineTo(x+r,y+h);shape.quadraticCurveTo(x,y+h,x,y+h-r);shape.lineTo(x,y+r);shape.quadraticCurveTo(x,y,x+r,y);const geo=new T.ExtrudeGeometry(shape,{depth,bevelEnabled:true,bevelThickness:.002,bevelSize:.002,bevelSegments:2,curveSegments:10});geo.translate(0,0,-depth/2);const mesh=new T.Mesh(geo,m);mesh.position.set(...pos);mesh.castShadow=true;g.add(mesh);return mesh;
}
export const lidarPosition=new T.Vector3(.065,.386,.097);
export function createIPhone(){
 const g=new T.Group();g.name='iPhone Pro · LiDAR study';const titanium=material('#92998f',.86,.28),back=material('#c3c8bd',.32,.44),black=material('#101b18',.65,.18),edge=material('#515d56',.85,.22),glass=material('#233e41',.82,.12);
 roundedPanel(g,[.69,1.39,.075],[0,0,0],titanium,.112);roundedPanel(g,[.658,1.355,.017],[0,0,.041],back,.1);roundedPanel(g,[.654,1.345,.011],[0,0,-.044],black,.1);
 roundedPanel(g,[.384,.397,.038],[-.106,.429,.068],titanium,.065);
 for(const [x,y]of [[-.2,.525],[-.031,.433],[-.2,.337]]){disc(g,.069,.02,[x,y,.092],edge);disc(g,.058,.024,[x,y,.105],black);disc(g,.038,.005,[x,y,.119],glass);disc(g,.016,.006,[x-.009,y+.009,.123],material('#457680',.55,.15));disc(g,.006,.002,[x-.025,y+.031,.124],material('#cedbd7',.1,.15));}
 disc(g,.028,.013,[.066,.543,.096],material('#f4f0d5',.1,.38));disc(g,.028,.016,lidarPosition.toArray() as [number,number,number],black);disc(g,.012,.004,[lidarPosition.x,lidarPosition.y,.108],material('#306c64',.7,.15));disc(g,.006,.006,[.064,.303,.093],black);
 const sensorHalo=new T.Mesh(new T.TorusGeometry(.043,.003,8,32),new T.MeshBasicMaterial({color:'#9ee9c6',transparent:true,opacity:.85}));sensorHalo.position.copy(lidarPosition).add(new T.Vector3(0,0,.015));sensorHalo.name='LiDAR pulse';g.add(sensorHalo);
 box(g,[.018,.175,.033],[.351,.205,0],edge,.009);for(const y of [.34,.1])box(g,[.018,.105,.03],[-.351,y,0],edge,.008);box(g,[.018,.048,.027],[-.351,.526,0],edge,.006);
 for(const x of [-.25,.25])for(const y of [-.66,.66])box(g,[.025,.016,.077],[x,y,0],material('#c5cdc2'),.002);
 const display=document.createElement('canvas');display.width=480;display.height=1000;const d=display.getContext('2d')!;
 d.fillStyle='#102d25';d.fillRect(0,0,480,1000);d.strokeStyle='#86caaa35';d.lineWidth=1;for(let i=0;i<480;i+=28){d.beginPath();d.moveTo(i,0);d.lineTo(i,1000);d.stroke();}for(let i=0;i<1000;i+=28){d.beginPath();d.moveTo(0,i);d.lineTo(480,i);d.stroke();}
 d.fillStyle='#edf6e4';d.font='22px sans-serif';d.fillText('9:41',32,65);d.fillRect(387,47,42,18);d.fillStyle='#a7d2b8';d.font='18px sans-serif';d.fillText('LiDAR CAPTURE',33,148);d.fillStyle='#e9f4df';d.font='34px Georgia';d.fillText('Find the shape',32,226);d.fillText('of your home.',32,268);
 d.strokeStyle='#c4f6d2';d.lineWidth=3;for(const [x,y,sx,sy]of [[64,366,1,1],[416,366,-1,1],[64,718,1,-1],[416,718,-1,-1]]){d.beginPath();d.moveTo(x+sx*35,y);d.lineTo(x,y);d.lineTo(x,y+sy*35);d.stroke();}d.strokeStyle='#9be4bf55';for(let i=0;i<6;i++){d.strokeRect(108+i*9,422+i*12,211-i*13,164-i*8);}d.fillStyle='#80b79a';d.font='18px sans-serif';d.fillText('Move slowly around the room',96,791);d.beginPath();d.arc(240,875,36,0,Math.PI*2);d.fillStyle='#e9f6df';d.fill();d.beginPath();d.arc(240,875,26,0,Math.PI*2);d.fillStyle='#688c72';d.fill();
 d.globalCompositeOperation='destination-in';d.fillStyle='#fff';d.beginPath();d.roundRect(0,0,480,1000,64);d.fill();
 const screenTexture=new T.CanvasTexture(display);screenTexture.colorSpace=T.SRGBColorSpace;const screen=new T.Mesh(new T.PlaneGeometry(.618,1.285),new T.MeshStandardMaterial({map:screenTexture,emissive:'#b4e6c9',emissiveMap:screenTexture,emissiveIntensity:.35,roughness:.23,metalness:.1,transparent:true,alphaTest:.3}));screen.rotation.y=Math.PI;screen.position.z=-.056;g.add(screen);
 roundedPanel(g,[.228,.044,.009],[0,.56,-.063],black,.021);disc(g,.009,.003,[.075,.56,-.071],glass);box(g,[.14,.006,.005],[0,-.608,-.06],material('#deecdc'),.003);
 const emblem=new T.Mesh(new T.SphereGeometry(1,20,12),material('#9ba697',.6,.4));emblem.scale.set(.058,.071,.005);emblem.position.set(0,-.05,.056);g.add(emblem);const leaf=new T.Mesh(new T.SphereGeometry(1,12,8),edge);leaf.scale.set(.012,.027,.004);leaf.rotation.z=-.45;leaf.position.set(.018,.041,.057);g.add(leaf);
 g.scale.setScalar(1.75);return g;
}
export function createMovingTruck(){
 const g=new T.Group();g.name='ReNest moving truck';const sage=material('#819475',.12,.48),ivory=material('#e8e8d9',.05,.7),tire=material('#303833',.1,.9),chrome=material('#a6b3a2',.75,.3),glass=material('#345c54',.5,.19),wood=material('#b79b71',0,.85);
 box(g,[2.52,.13,1.02],[0,.32,0],tire);box(g,[1.66,.09,1.06],[-.43,.43,0],wood);box(g,[1.69,.07,.14],[-.43,1.57,-.47],ivory);box(g,[1.67,.45,.045],[-.43,.68,.52],ivory);box(g,[.055,1.1,1.04],[.4,1,0],ivory);box(g,[1.69,.065,.07],[-.43,.56,-.51],chrome);
 // Open near-side cargo bay makes the selected furniture visible during loading.
 for(const x of [-1.27,.4])box(g,[.045,1.1,.045],[x,1,-.52],chrome);box(g,[1.68,.045,.045],[-.43,1.55,-.52],chrome);
 box(g,[.91,.72,1.04],[.88,.8,0],sage,.085);box(g,[.66,.38,1.0],[.9,1.29,0],sage,.085);box(g,[.032,.3,.88],[1.245,1.3,0],glass,.025);for(const z of [-.513,.513]){box(g,[.55,.29,.023],[.89,1.31,z],glass,.035);box(g,[.16,.035,.03],[.77,1.04,z*1.03],chrome,.01);box(g,[.15,.085,.05],[1.27,1.28,z*1.13],sage,.022);}
 box(g,[.09,.1,.98],[1.37,.5,0],chrome,.015);box(g,[.025,.15,.48],[1.357,.74,0],tire,.008);for(const z of [-.37,.37])box(g,[.025,.14,.17],[1.37,.88,z],new T.MeshStandardMaterial({color:'#fff4cf',emissive:'#ffc980',emissiveIntensity:.65}),.025);
 const wheels:T.Group[]=[];for(const x of [-.88,.88])for(const z of [-.56,.56]){const w=new T.Group();w.position.set(x,.29,z);disc(w,.25,.14,[0,0,0],tire);disc(w,.14,.149,[0,0,0],chrome);disc(w,.065,.157,[0,0,0],sage);g.add(w);wheels.push(w);}
 const ramp=box(g,[.61,.035,.89],[-1.59,.255,0],wood,.008);ramp.rotation.z=.49;
 const canvas=document.createElement('canvas');canvas.width=512;canvas.height=200;const ctx=canvas.getContext('2d')!;ctx.fillStyle='#e8e8d9';ctx.fillRect(0,0,512,200);ctx.fillStyle='#3f5e43';ctx.font='58px Georgia';ctx.textAlign='center';ctx.fillText('ReNest',256,100);ctx.font='14px sans-serif';ctx.letterSpacing='3px';ctx.fillText('MOVE WHAT MATTERS',256,144);const texture=new T.CanvasTexture(canvas);texture.colorSpace=T.SRGBColorSpace;const sign=new T.Mesh(new T.PlaneGeometry(1.18,.37),new T.MeshStandardMaterial({map:texture,roughness:1}));sign.position.set(-.43,.7,.547);g.add(sign);
 g.userData.wheels=wheels;g.userData.ramp=ramp;return g;
}
