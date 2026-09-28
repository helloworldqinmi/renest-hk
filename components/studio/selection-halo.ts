import * as T from 'three';

// A floor-level cue leaves the furniture silhouette and its materials readable.
export function createSelectionHalo(){
 const canvas=document.createElement('canvas');canvas.width=512;canvas.height=512;
 const c=canvas.getContext('2d')!;
 c.shadowColor='rgba(201,166,93,.85)';c.shadowBlur=25;c.lineWidth=5;c.strokeStyle='rgba(182,140,63,.95)';
 c.beginPath();c.roundRect(45,45,422,422,28);c.stroke();
 c.shadowBlur=0;c.lineWidth=2;c.strokeStyle='rgba(255,245,218,.95)';c.beginPath();c.roundRect(50,50,412,412,25);c.stroke();
 const texture=new T.CanvasTexture(canvas);texture.colorSpace=T.SRGBColorSpace;
 const material=new T.MeshBasicMaterial({map:texture,transparent:true,depthWrite:false,opacity:.9,side:T.DoubleSide});
 const mesh=new T.Mesh(new T.PlaneGeometry(1,1),material);mesh.rotation.x=-Math.PI/2;mesh.renderOrder=2;
 mesh.name='Selected furniture · soft footprint';
 const size=new T.Vector3(),center=new T.Vector3();
 return {object:mesh,update(bounds:T.Box3){bounds.getSize(size);bounds.getCenter(center);mesh.position.set(center.x,.038,center.z);mesh.scale.set((size.x+.22)/.82,(size.z+.22)/.82,1);},dispose(){mesh.removeFromParent();mesh.geometry.dispose();material.dispose();texture.dispose();}};
}
