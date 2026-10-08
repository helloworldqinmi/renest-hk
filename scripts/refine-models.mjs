/** Blender bake -> validated, optimized deployment assets. Source models stay intact. */
import { access, copyFile, mkdir, mkdtemp, stat, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import assert from 'node:assert/strict';
import { NodeIO } from '@gltf-transform/core';
import { ALL_EXTENSIONS } from '@gltf-transform/extensions';
import { copyToDocument, dedup, getBounds, prune, unpartition, weld, textureCompress } from '@gltf-transform/functions';
import sharp from 'sharp';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const source = path.join(root, 'v2-home-models/models');
const destination = path.join(root, 'public/models/v2');
// Refine upholstery while preserving the original clean silhouettes.
const ids = ['F01', 'F09', 'F13'];
const preservedIds = [];
const staging = await mkdtemp(path.join(tmpdir(), 'renest-refinement-'));
const bakedIndex = process.argv.indexOf('--baked');
const baked = bakedIndex < 0 ? staging : path.resolve(process.argv[bakedIndex + 1]);
if (bakedIndex < 0) {
  const candidates = [process.env.BLENDER_BIN, path.join(root,'output/tools/blender-4.5.0-windows-x64/blender.exe'), 'C:/Program Files/Blender Foundation/Blender 4.5/blender.exe', '/Applications/Blender 4.5 LTS.app/Contents/MacOS/Blender', '/Applications/Blender.app/Contents/MacOS/Blender'].filter(Boolean);
  let blender = 'blender';
  for (const candidate of candidates) {
    try { await access(candidate); blender = candidate; break; } catch { /* Try the next installed location. */ }
  }
  const result = spawnSync(blender, ['--background', '--factory-startup', '--threads', '6', '--python-exit-code', '1', '--python', path.join(root, 'scripts/blender/refine_soft_furniture.py'), '--', '--output', baked, '--assets', ...ids], { stdio: 'inherit' });
  if (result.error) throw result.error;
  assert.equal(result.status, 0, 'Blender refinement failed; deployment assets were not changed.');
}
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS);
const refined = new Map(await Promise.all(ids.map(async id => [id, await io.read(path.join(baked, `${id}.glb`))])));
function furniture(document, id) {
  const node = document.getRoot().listNodes().find(node => node.getExtras().selectable && node.getExtras().id === id);
  assert.ok(node, `Missing selectable furniture ${id}`);
  return node;
}
function metadata(document) {
  return document.getRoot().listNodes().filter(node => {
    const e = node.getExtras();
    return e.selectable || e.wall || e.upper || e.foldAxis || e.layer;
  }).map(node => ({ name: node.getName(), extras: node.getExtras(), matrix: node.getMatrix().map(v => +v.toFixed(5)) })).sort((a, b) => a.name.localeCompare(b.name));
}
function verifyBounds(before, after, name) {
  for (const side of ['min', 'max']) for (let i = 0; i < 3; i++) {
    assert.ok(Math.abs(before[side][i] - after[side][i]) < .012, `${name}: changed furniture bounds`);
  }
}
for (const id of ids) {
  const original = await io.read(path.join(source, 'furniture', `${id}.glb`));
  const model = refined.get(id);
  const refinedRoot = furniture(model, id);
  // Keep the public interaction contract exactly, including dimensions and origin.
  refinedRoot.setExtras(furniture(original, id).getExtras());
  verifyBounds(getBounds(original.getRoot().listScenes()[0]), getBounds(model.getRoot().listScenes()[0]), id);
  assert.ok(model.getRoot().listMaterials().every(m => m.getOcclusionTexture()), `${id}: missing baked AO`);
  for (const mat of model.getRoot().listMaterials()) {
    assert.equal(mat.getOcclusionTextureInfo().getTexCoord(), 1, 'AO must preserve the original surface UVs');
    mat.setOcclusionStrength(.8);
  }
}
const files = ['old-home.glb', 'new-home-a.glb', 'new-home-b.glb', 'new-home-c.glb', ...[...preservedIds, ...ids].map(id => `furniture/${id}.glb`)];
const report = { workflow: 'Blender 4.5 LTS / CPU Cycles / 1024px AO bake, 512px delivery / UV1', furniture: ids, preservedFurniture: preservedIds, files: [] };
for (const file of files) {
  const original = await io.read(path.join(source, file));
  const beforeMetadata = metadata(original);
  const beforeBounds = getBounds(original.getRoot().listScenes()[0]);
  const document = file.startsWith('furniture/') ? refined.get(path.basename(file, '.glb')) ?? original : original;
  if (!file.startsWith('furniture/')) for (const id of ids) {
    const target = furniture(document, id);
    const sourceDocument = refined.get(id);
    for (const extension of sourceDocument.getRoot().listExtensionsUsed()) document.createExtension(extension.constructor).setRequired(extension.isRequired());
    const sourceRoot = furniture(sourceDocument, id);
    const copied = copyToDocument(document, sourceDocument, [sourceRoot]).get(sourceRoot);
    for (const child of [...target.listChildren()]) target.removeChild(child);
    for (const child of [...copied.listChildren()]) { copied.removeChild(child); target.addChild(child); }
    copied.dispose();
  }
  // Do not flatten: furniture roots, folding pivots and wall-cut extras drive the UI.
  await document.transform(weld(), dedup(), prune({ keepAttributes: true, keepExtras: true }), unpartition(), textureCompress({ encoder: sharp, targetFormat: 'png', resize: [512, 512] }));
  const staged = path.join(staging, 'ready', file);
  await mkdir(path.dirname(staged), { recursive: true });
  await io.write(staged, document);
  const roundtrip = await io.read(staged);
  assert.deepEqual(metadata(roundtrip), beforeMetadata, `${file}: interaction metadata changed`);
  verifyBounds(beforeBounds, getBounds(roundtrip.getRoot().listScenes()[0]), file);
  for (const mesh of roundtrip.getRoot().listMeshes()) for (const primitive of mesh.listPrimitives()) {
    if (primitive.getMaterial()?.getOcclusionTexture()) assert.ok(primitive.getAttribute('TEXCOORD_1'), 'AO UV attribute was lost');
  }
  const beforeBytes = (await stat(path.join(source, file))).size;
  const afterBytes = (await stat(staged)).size;
  assert.ok(afterBytes < (file.startsWith('furniture/') ? 1_500_000 : beforeBytes), `${file}: exceeds asset budget`);
  report.files.push({ file, beforeBytes, afterBytes });
  console.log(`${file}: ${(beforeBytes / 1024).toFixed(0)} -> ${(afterBytes / 1024).toFixed(0)} KiB`);
}
// Install only after every generated asset passes the checks above.
for (const file of files) await copyFile(path.join(staging, 'ready', file), path.join(destination, file));
await writeFile(path.join(root, 'docs/model-refinement.json'), JSON.stringify(report, null, 2) + '\n');
console.log('Refined assets installed. Furniture metadata, bounds, folding pivots, walls and UVs verified.');
