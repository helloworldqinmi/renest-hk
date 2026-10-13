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
