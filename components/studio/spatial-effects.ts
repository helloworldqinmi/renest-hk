import * as T from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { createCaptureMesh } from './capture-mesh';

/** Surface samples, never a random box of particles. Stable topology follows the actual plan. */
export function createSpatialTopology(root: T.Object3D, mobile: boolean, filled = false) {
  if (filled) return createCaptureMesh(root,mobile);
  root.updateMatrixWorld(true);
  const group = new T.Group(); group.name = 'Architectural topology';
  const wireMaterial = new T.MeshBasicMaterial({ color: '#b9eee3', wireframe: true, transparent: true, opacity: 0, depthWrite: false });
  let triangles = 0;
  const parts: T.BufferGeometry[] = [];
  root.traverse(object => {
    if (!(object instanceof T.Mesh) || object.userData.contactShadow) return;
    for (let parent: T.Object3D | null = object; parent; parent = parent.parent) if (!parent.visible) return;
    const count = (object.geometry.index?.count ?? object.geometry.getAttribute('position').count) / 3;
    // Exclude tiny decorations and very dense upholstery; silhouettes remain readable.
    if (count > 6500 || triangles + count > (mobile ? 42000 : 85000)) return;
    let geometry = object.geometry.index ? object.geometry.toNonIndexed() : object.geometry.clone();
    // Topology needs position only, so imported meshes with different UV layouts can batch.
    for (const name of Object.keys(geometry.attributes)) if (name !== 'position') geometry.deleteAttribute(name);
    geometry.applyMatrix4(object.matrixWorld); parts.push(geometry); triangles += count;
  });
  const geometry = parts.length ? mergeGeometries(parts) : null;
  parts.forEach(part => part.dispose());
  const faceMaterial: T.MeshBasicMaterial | undefined = undefined;
  if (geometry) {
    const wire = new T.Mesh(geometry, wireMaterial); wire.renderOrder = 2; group.add(wire);
  }
  return { group, material: wireMaterial, faceMaterial, dispose() { geometry?.dispose(); wireMaterial.dispose(); } };
}

export function scanPointMaterial() {
  // Fixed pixel samples remain crisp through the blended orthographic/perspective lens.
  // Three's perspective detector expects an exact -1 matrix entry; lens blending
  // invalidates that check and previously shrank world-size dots below one pixel.
  const material = new T.PointsMaterial({ color: '#ffffff', vertexColors: true, size: 2.2, transparent: true, opacity: 1, alphaTest: .04, sizeAttenuation: false, depthWrite: true, toneMapped: false });
  const density={value:1},sweep={value:100};material.userData.captureDensity=density;material.userData.captureSweep=sweep;
  material.onBeforeCompile = shader => {
    shader.uniforms.uCaptureDensity=density;shader.uniforms.uCaptureSweep=sweep;
    shader.vertexShader='attribute float captureRank; varying float vCaptureRank; varying float vCaptureX;\n'+shader.vertexShader;
    shader.vertexShader=shader.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\nvCaptureRank=captureRank;vCaptureX=position.x;');
    // Explicit depth scaling also works with the blended scan projection.
    shader.vertexShader=shader.vertexShader.replace('gl_PointSize = size;', 'gl_PointSize = size * clamp(5.0 / max(1.0, -mvPosition.z), 0.7, 1.45);');
    shader.fragmentShader='uniform float uCaptureDensity; uniform float uCaptureSweep; varying float vCaptureRank; varying float vCaptureX;\n'+shader.fragmentShader;
    shader.fragmentShader = shader.fragmentShader.replace('#include <color_fragment>', `
      #include <color_fragment>
      float acquired=smoothstep(vCaptureRank*0.96,vCaptureRank*0.96+0.04,uCaptureDensity);
      if(acquired<0.001)discard;
      // A planar cabinet face shares X coordinates. Give its samples a soft,
      // staggered acquisition edge instead of revealing the entire plane at once.
      float arrival=smoothstep(vCaptureRank*0.45,vCaptureRank*0.45+0.65,uCaptureSweep-vCaptureX);
      diffuseColor.a*=acquired*arrival;
      float r = length(gl_PointCoord - vec2(0.5));
      if (r > 0.5) discard;
      diffuseColor.a *= 1.0 - smoothstep(0.4, 0.5, r);
    `);
  };
  material.customProgramCacheKey = () => 'renest-surface-point-v5';
  return material;
}

/** A single depth draw keeps rear-wall samples from showing through furniture. */
export function createCaptureDepth(root: T.Object3D) {
  root.updateMatrixWorld(true);
  const parts: T.BufferGeometry[] = [];
  root.traverse(object => {
    if (!(object instanceof T.Mesh) || object.userData.contactShadow) return;
    for (let parent: T.Object3D | null = object; parent; parent = parent.parent) if (!parent.visible) return;
    const materials = Array.isArray(object.material) ? object.material : [object.material];
    if (materials.some(material => /glazing|glass/i.test(material.name))) return;
    const geometry = object.geometry.index ? object.geometry.toNonIndexed() : object.geometry.clone();
    for (const name of Object.keys(geometry.attributes)) if (name !== 'position') geometry.deleteAttribute(name);
    geometry.applyMatrix4(object.matrixWorld); parts.push(geometry);
  });
  const geometry = parts.length ? mergeGeometries(parts)! : new T.BufferGeometry(); parts.forEach(part => part.dispose());
  const material = new T.MeshBasicMaterial({ colorWrite: false, polygonOffset: true, polygonOffsetFactor: 1, polygonOffsetUnits: 2 });
  const mesh = new T.Mesh(geometry, material); mesh.name = 'Capture depth occlusion'; mesh.visible = false;
  return mesh;
}
