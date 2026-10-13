import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { execFileSync, spawnSync } from 'node:child_process';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const manifest = JSON.parse(readFileSync(path.join(root, 'deliverables/manifest.json'), 'utf8'));
const files = [...new Set(execFileSync('git', ['ls-files', '--cached', '--others', '--exclude-standard', '-z'], {
  cwd: root, encoding: 'utf8',
}).split('\0').filter(file => file && existsSync(path.join(root, file))))];
assert.deepEqual(files.filter(file => /[^\x20-\x7e]/.test(file)), [], 'Repository filenames must use printable ASCII');

const artifactPaths = new Set();
for (const artifact of manifest.artifacts) {
  assert.ok(artifact.path.startsWith('deliverables/') && !artifact.path.includes('..') && !artifact.path.includes('\\'), 'Invalid artifact path');
  assert.ok(!artifactPaths.has(artifact.path), `Duplicate artifact: ${artifact.path}`);
  artifactPaths.add(artifact.path);
  const ignored = spawnSync('git', ['check-ignore', '--no-index', '--quiet', artifact.path], { cwd: root });
  assert.equal(ignored.status, 1, `Artifact is ignored or Git inspection failed: ${artifact.path}`);
  const content = readFileSync(path.join(root, artifact.path));
  assert.equal(content.length, artifact.bytes, `Size changed: ${artifact.path}`);
  assert.equal(createHash('sha256').update(content).digest('hex'), artifact.sha256, `Checksum changed: ${artifact.path}`);
  assert.ok(content.length < 100 * 1024 * 1024, `Exceeds this repository's 100 MiB per-artifact budget: ${artifact.path}`);
}

function mediaIn(directory) {
  return readdirSync(path.join(root, directory), { withFileTypes: true }).flatMap(entry => {
    const file = `${directory}/${entry.name}`;
    return entry.isDirectory() ? mediaIn(file) : /\.(mp4|srt)$/.test(file) ? [file] : [];
  });
}
for (const file of mediaIn('deliverables')) assert.ok(artifactPaths.has(file), `Unregistered delivery media: ${file}`);
const film = manifest.artifacts.find(artifact => artifact.role === 'main-film');
assert.ok(film, 'Main film is missing from the manifest');
const verification = JSON.parse(readFileSync(path.join(root, 'deliverables/demo-film/verification.json'), 'utf8'));
assert.equal(film.sha256, verification.sha256, 'Main film differs from the original production verification');
console.log(`Delivery checks passed: ${manifest.artifacts.length} artifacts, matching SHA-256 checksums, no ignored deliverables, ASCII repository filenames.`);
