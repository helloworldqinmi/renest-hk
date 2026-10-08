import * as T from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { TessellateModifier } from 'three/addons/modifiers/TessellateModifier.js';

export const captureItemIndex = (id?: string) => id ? Number(id.slice(1)) + (id.startsWith('N') ? 100 : 0) : 0;

/** Precompute fine surface triangles once; density and fusion are cheap uniforms. */
export function createCaptureMesh(root: T.Object3D, mobile: boolean) {
  root.updateMatrixWorld(true);
  const parts: T.BufferGeometry[] = [];
  let triangles = 0, seed = 7349;
  const random = () => { seed = (Math.imul(seed,1664525)+1013904223)>>>0; return seed/4294967296; };
  const modifier = new TessellateModifier(mobile ? .28 : .18, 7);
  const boundedModifier = new TessellateModifier(mobile ? .4 : .28, 5);
  root.traverse(object => {
    if (!(object instanceof T.Mesh) || object.userData.contactShadow || Array.isArray(object.material)) return;
    let item=0;
    for(let parent:T.Object3D|null=object;parent;parent=parent.parent){if(!parent.visible)return;if(parent.userData.selectable)item=captureItemIndex(parent.userData.id);}
    const source = object.material as T.MeshStandardMaterial;
    if (/glazing|glass/i.test(source.name)) return;
    const base = object.geometry.index ? object.geometry.toNonIndexed() : object.geometry.clone();
    for(const name of Object.keys(base.attributes))if(name!=='position')base.deleteAttribute(name);
    base.applyMatrix4(object.matrixWorld);
    let geometry = base;
    if(base.getAttribute('position').count < 18000) {
      geometry = modifier.modify(base);
      // Bound each object, not traversal order: later furniture must still refine.
      if(geometry.getAttribute('position').count>(mobile?30000:60000)){
        geometry.dispose();geometry=boundedModifier.modify(base);
      }
      base.dispose();
    }
    const position=geometry.getAttribute('position'), count=position.count;
    triangles+=count/3;
    const barycentric=new Float32Array(count*3), ranks=new Float32Array(count), colors=new Float32Array(count*3), items=new Float32Array(count).fill(item);
    const tint=source.color?.clone()??new T.Color('#9cb6b2');
    for(let i=0;i<count;i+=3){
      const rank=random(),shade=.82+random()*.18;
      for(let vertex=0;vertex<3;vertex++){
        barycentric[(i+vertex)*3+vertex]=1;ranks[i+vertex]=rank;
        colors.set([tint.r*shade,tint.g*shade,tint.b*shade],(i+vertex)*3);
      }
    }
    geometry.setAttribute('captureBarycentric',new T.BufferAttribute(barycentric,3));
    geometry.setAttribute('captureRank',new T.BufferAttribute(ranks,1));
    geometry.setAttribute('captureColor',new T.BufferAttribute(colors,3));parts.push(geometry);
    geometry.setAttribute('captureItem',new T.BufferAttribute(items,1));
  });
  const geometry=parts.length?mergeGeometries(parts)!:new T.BufferGeometry();parts.forEach(part=>part.dispose());
  const density={value:0},fusion={value:0},extraction={value:0},selected={value:0},kept={value:new Float32Array(19).fill(1)};
  const material=new T.MeshBasicMaterial({color:'#ffffff',transparent:true,opacity:1,depthWrite:true,toneMapped:false});
  material.userData.captureDensity=density;material.userData.captureFusion=fusion;
  material.userData.captureExtraction=extraction;material.userData.captureSelected=selected;
  const reveal={value:new Float32Array(19).fill(-100)},emphasis={value:new Float32Array(19)};
  material.userData.captureReveal=reveal;material.userData.captureEmphasis=emphasis;
  material.userData.captureKept=kept;
  material.onBeforeCompile=shader=>{
    shader.uniforms.uCaptureReveal=reveal;shader.uniforms.uCaptureEmphasis=emphasis;
    shader.uniforms.uCaptureDensity=density;shader.uniforms.uCaptureFusion=fusion;shader.uniforms.uCaptureExtraction=extraction;shader.uniforms.uCaptureSelected=selected;shader.uniforms.uCaptureKept=kept;
    shader.vertexShader='attribute vec3 captureBarycentric; attribute float captureRank; attribute vec3 captureColor; varying vec3 vCaptureBarycentric; varying float vCaptureRank; varying vec3 vCaptureColor;\n'+shader.vertexShader;
    shader.vertexShader=shader.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\nvCaptureBarycentric=captureBarycentric;vCaptureRank=captureRank;vCaptureColor=captureColor;');
    shader.vertexShader='attribute float captureItem;varying float vCaptureItem;varying float vCaptureX;\n'+shader.vertexShader;
    shader.vertexShader=shader.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\nvCaptureItem=captureItem;vCaptureX=position.x;');
    shader.fragmentShader='uniform float uCaptureDensity; uniform float uCaptureFusion; varying vec3 vCaptureBarycentric; varying float vCaptureRank; varying vec3 vCaptureColor;\n'+shader.fragmentShader;
    shader.fragmentShader='uniform float uCaptureReveal[19];uniform float uCaptureEmphasis[19];varying float vCaptureX;uniform float uCaptureExtraction;uniform float uCaptureSelected;uniform float uCaptureKept[19];varying float vCaptureItem;\n'+shader.fragmentShader;
    shader.fragmentShader=shader.fragmentShader.replace('#include <color_fragment>',`#include <color_fragment>
      int itemIndex=int(clamp(vCaptureItem,0.0,18.0));
      if(vCaptureX<uCaptureReveal[itemIndex])discard;
      float assembled=smoothstep(vCaptureRank*0.94,vCaptureRank*0.94+0.06,uCaptureDensity);
      if(assembled<0.001)discard;
      diffuseColor.a*=assembled;
      vec3 width=max(fwidth(vCaptureBarycentric),vec3(0.00001));
      vec3 coverage=smoothstep(vec3(0.0),width*1.1,vCaptureBarycentric);
      float edge=1.0-min(coverage.x,min(coverage.y,coverage.z));
      // Preserve the measured material colours throughout reconstruction.
      // Structural lines add information; they never replace the room's palette.
      vec3 wire=mix(vCaptureColor,vec3(0.56,0.65,0.71),0.46*(1.0-uCaptureFusion));
      vec3 surface=vCaptureColor*(0.72+0.2*uCaptureFusion);
      diffuseColor.rgb=mix(surface,wire,edge*(1.0-uCaptureFusion*0.85));
      float movable=step(0.5,vCaptureItem);
      float focused=movable*(1.0-step(0.2,abs(vCaptureItem-uCaptureSelected)));
      vec3 extractionEdge=mix(vec3(0.42,0.46,0.46),vec3(0.09,0.16,0.18),movable);
      extractionEdge=mix(extractionEdge,vec3(0.31,0.17,0.07),focused);
      vec3 extractionSurface=mix(vec3(0.82,0.82,0.78),vCaptureColor*0.76+vec3(0.12),movable);
      float retained=uCaptureKept[int(clamp(vCaptureItem,0.0,18.0))];
      extractionEdge=mix(vec3(0.65),extractionEdge,retained);
      extractionSurface=mix(vec3(0.81,0.81,0.78),extractionSurface,retained);
      diffuseColor.rgb=mix(diffuseColor.rgb,mix(extractionSurface,extractionEdge,edge*(0.24+movable*0.62)),uCaptureExtraction*uCaptureEmphasis[itemIndex]);
    `);
  };
  material.customProgramCacheKey=()=> 'renest-dense-capture-v2';
  const group=new T.Group(),mesh=new T.Mesh(geometry,material);mesh.userData.denseCapture=true;group.add(mesh);
  group.userData.triangles=triangles;group.name='Progressive dense triangle reconstruction';
  return {group,material,faceMaterial:undefined,dispose(){geometry.dispose();material.dispose();}};
}
