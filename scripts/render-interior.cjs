// Export the same layout and camera decisions used by the player, then render with Cycles.
const fs = require('node:fs'), path = require('node:path'), ts = require('typescript'), {spawnSync} = require('node:child_process');
const root = path.resolve(__dirname, '..'), cache = new Map();
function load(file) {
  if(file.endsWith('.json')) return JSON.parse(fs.readFileSync(file, 'utf8'));
  if(cache.has(file)) return cache.get(file);
  const exports = {}; cache.set(file, exports);
  const code = ts.transpile(fs.readFileSync(file, 'utf8'), {module:ts.ModuleKind.CommonJS, esModuleInterop:true});
  new Function('require', 'exports', code)(id => load(path.resolve(id.startsWith('@/') ? root : path.dirname(file), id.startsWith('@/') ? id.slice(2) : id) + (path.extname(id) ? '' : '.ts')), exports);
  return exports;
}
const {studioLayouts} = load(path.join(root, 'lib/studio-data.ts'));
const {buildInteriorTour} = load(path.join(root, 'lib/interior-tour.ts'));
const {interiorPlanKey} = load(path.join(root, 'lib/interior-render.ts'));
const output = path.join(root, 'public/films/interior'); fs.mkdirSync(output, {recursive:true});
const jobs = studioLayouts.map(layout => ({id:layout.id, key:interiorPlanKey(layout.placements), placements:layout.placements, shots:buildInteriorTour(layout.placements)}));
const jobFile = path.join(output, 'jobs.json'); fs.writeFileSync(jobFile, JSON.stringify(jobs, null, 2));
const args = process.argv.slice(2);
const candidates = [process.env.BLENDER_BIN, path.join(root,'output/tools/blender-4.5.0-windows-x64/blender.exe'), 'C:/Program Files/Blender Foundation/Blender 4.5/blender.exe', '/Applications/Blender.app/Contents/MacOS/Blender'].filter(Boolean);
const blender = candidates.find(file => fs.existsSync(file)) || 'blender';
const result = spawnSync(blender, ['-b','-t','8','--python-exit-code','1','-P',path.join(root,'scripts/blender/render_interior.py'),'--','--jobs',jobFile,...args], {stdio:'inherit'});
if (result.error) console.error(result.error.message);
process.exit(result.status ?? 1);
