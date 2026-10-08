import * as T from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

export function batchStatic(root:T.Object3D){
 const parents:T.Object3D[]=[];root.traverse(o=>{if(o.children.length)parents.push(o);});
 for(const parent of parents){const buckets=new Map<T.Material,T.Mesh[]>();for(const o of [...parent.children]){if(!(o instanceof T.Mesh)||!o.visible||o.children.length||o.userData.wall||o.userData.upper||/lampshade|Pleated shade|Warm diffuser|duvet|pillow|cushion|mattress|bed throw/i.test(o.name.replaceAll('_',' '))||Array.isArray(o.material))continue;const bucket=buckets.get(o.material)??[];bucket.push(o);buckets.set(o.material,bucket);}
  for(const [material,objects]of buckets){if(objects.length<3)continue;const geometries=objects.map(o=>{o.updateMatrix();const g=o.geometry.index?o.geometry.toNonIndexed():o.geometry.clone();return g.applyMatrix4(o.matrix);});const merged=mergeGeometries(geometries);geometries.forEach(g=>g.dispose());if(!merged)continue;const m=new T.Mesh(merged,material);m.name=material.name+' details';objects.forEach(o=>o.removeFromParent());parent.add(m);}
 }
}
