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
