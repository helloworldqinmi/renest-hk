import assert from 'node:assert/strict';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';
import { NodeIO } from '@gltf-transform/core';
import { Box3, Vector3, Matrix4 } from 'three';

const moduleExports = {};
new Function('exports', ts.transpile(fs.readFileSync(new URL('../lib/interior-joinery.ts', import.meta.url), 'utf8'), { module: ts.ModuleKind.CommonJS }))(moduleExports);
const profile = moduleExports.INTERIOR_JAMB;
const axes = ['x', 'y', 'z'];
const io = new NodeIO();
function overlaps(nodes, width) {
  const walls = nodes.filter(node => node.getName() === 'Plaster wall').map(node => {
    const bounds = new Box3(), positions = node.getMesh().listPrimitives()[0].getAttribute('POSITION').getArray();
    for (let i=0;i<positions.length;i+=3) bounds.expandByPoint(new Vector3(positions[i],positions[i+1],positions[i+2]));
    return bounds.applyMatrix4(new Matrix4().fromArray(node.getWorldMatrix()));
  });
  const collisions=[];
  for (const node of nodes.filter(node => node.getName() === 'Door jamb')) {
    const bounds = new Box3(new Vector3(-width/2,-profile.height/2,-profile.depth/2),new Vector3(width/2,profile.height/2,profile.depth/2)).applyMatrix4(new Matrix4().fromArray(node.getWorldMatrix()));
    for(const wall of walls)for(const axis of axes)for(const a of ['min','max'])for(const b of ['min','max']) {
      if(Math.abs(bounds[a][axis]-wall[b][axis])<1e-5 && axes.filter(value=>value!==axis).every(value=>Math.min(bounds.max[value],wall.max[value])-Math.max(bounds.min[value],wall.min[value])>.001)) collisions.push({position:node.getWorldMatrix().slice(12,15),axis});
    }
  }
  return collisions;
}
for(const layout of ['a','b','c']) {
  const doc=await io.read(fileURLToPath(new URL(`../public/models/v2/new-home-${layout}.glb`,import.meta.url)));
  const nodes=doc.getRoot().listNodes();
  assert.ok(overlaps(nodes,.04).some(issue=>issue.axis==='z'&&Math.abs(issue.position[2]-4.32)<.001),'Regression must reproduce the study jamb / bathroom-wall overlap');
  assert.deepEqual(overlaps(nodes,profile.width),[],`${layout}: interior jambs must not share overlapping wall planes`);
}
console.log('Interior joinery passed: reproduced the old overlap; no coplanar jamb/wall faces in all three repaired layouts.');
