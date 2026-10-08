// OSM coastline → small projected SVG paths, with no map service needed at runtime.
const fs = require('node:fs'), path = require('node:path');
const root = path.resolve(__dirname, '..');
const source = 'https://raw.githubusercontent.com/bmkor/hk_osm_map/master/Hong_Kong.geojson';
const project = ([lon, lat]) => [(lon - 113.8) * 1120 + 35, (22.6 - lat) * 1210 + 40];
const format = point => point.map(n => +n.toFixed(1)).join(' ');
function simplify(points, tolerance = .65) {
  if (points.length < 3) return points;
  const a = points[0], b = points.at(-1), dx = b[0] - a[0], dy = b[1] - a[1];
  let furthest = 0, distance = 0;
  for (let i = 1; i < points.length - 1; i++) {
    const p = points[i], t = Math.max(0, Math.min(1, ((p[0]-a[0])*dx+(p[1]-a[1])*dy)/(dx*dx+dy*dy || 1)));
    const d = Math.hypot(p[0]-a[0]-t*dx, p[1]-a[1]-t*dy);
    if (d > distance) { distance = d; furthest = i; }
  }
  if (distance <= tolerance) return [a, b];
  return [...simplify(points.slice(0, furthest + 1), tolerance).slice(0, -1), ...simplify(points.slice(furthest), tolerance)];
}
function area(ring) { return Math.abs(ring.reduce((sum, p, i) => { const next = ring[(i+1)%ring.length]; return sum+p[0]*next[1]-next[0]*p[1]; },0)/2); }
async function main() {
  const input = process.argv[2];
  const geo = input ? JSON.parse(fs.readFileSync(input,'utf8')) : await (await fetch(source)).json();
  const polygons = geo.features.flatMap(f => f.geometry.type === 'MultiPolygon' ? f.geometry.coordinates : [f.geometry.coordinates]);
  const paths = polygons.map(poly => poly.map(ring => ring.map(project))).filter(poly => area(poly[0]) > 3).map(poly => poly.map(ring => {
    const points = simplify(ring);
    return 'M'+points.map(format).join('L')+'Z';
  }).join(''));
  const routeSource = 'https://router.project-osrm.org/route/v1/driving/114.17,22.325;114.113,22.505?overview=full&geometries=geojson&steps=true';
  const routing = process.argv[3] ? JSON.parse(fs.readFileSync(process.argv[3],'utf8')) : await (await fetch(routeSource)).json();
  if(routing.code !== 'Ok') throw new Error('Hong Kong road route unavailable');
  const waypoints = simplify(routing.routes[0].geometry.coordinates.map(project), .28);
  const route = 'M'+waypoints.map(format).join('L');
  const roads = [...new Set(routing.routes[0].legs.flatMap(leg => leg.steps.map(step => step.name)))].filter(Boolean);
  const output = {source,routeSource,roads,attribution:'© OpenStreetMap contributors (ODbL)',paths,route,start:waypoints[0],end:waypoints.at(-1)};
  fs.writeFileSync(path.join(root,'lib/hong-kong-map.json'),JSON.stringify(output));
  console.log(`${paths.length} coastline shapes; ${JSON.stringify(output).length} bytes`);
}
main().catch(error => { console.error(error); process.exitCode=1; });
