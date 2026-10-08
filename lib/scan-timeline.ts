const clamp = (value: number) => Math.max(0, Math.min(1, value));
const smooth = (value: number) => { const t = clamp(value); return t * t * (3 - 2 * t); };
export const SCAN_DURATION = 18000;

/** Acquisition finishes before meshing; physical materials only appear at the end. */
export function scanTimeline(progress: number) {
 const p = clamp(progress);
 const turn = smooth(p / .06);
 const sweep = smooth((p - .06) / .28);
 const mesh = smooth((p - .4) / .2);
 const surface = smooth((p - .7) / .18);
 return {
  turn, sweep,
  beamActive: p >= .06 && p < .35,
  wireActive: p >= .4 && p < .9,
  surfaceActive: p > .7 && surface > 0,
  beamX: -4.55 + sweep * 9.2,
  meshX: -4.55 + mesh * 9.2,
  surfaceX: -4.55 + surface * 9.2,
  pointOpacity: .95 * (1 - smooth((p - .4) / .26)),
  wireOpacity: .72 * smooth((p - .4) / .055) * (1 - smooth((p - .86) / .04)),
  stage: p < .06 ? 'align' : p < .4 ? 'points' : p < .7 ? 'mesh' : 'surfaces',
 };
}

/** Points are sorted by world X; reveal by position rather than point density. */
export function revealedPointCount(positions: ArrayLike<number>, sweepX: number) {
 let low = 0, high = Math.floor(positions.length / 3);
 while (low < high) {
  const middle = (low + high) >>> 1;
  if (positions[middle * 3] <= sweepX) low = middle + 1;
  else high = middle;
 }
 return low;
}

// Large anchors lead, followed by supporting pieces in short overlapping beats.
export const EXTRACTION_ORDER = [1,9,10,13,14,3,4,2,15,17,18,11,12,5,6,7,8,16];
export function furnitureCapture(progress: number, item: number) {
 const rank=EXTRACTION_ORDER.indexOf(item);
 const start=rank<0?.85:.59+rank*.014;
 return { emphasis: smooth((progress-start)/.035), surface: smooth((progress-start-.045)/.075) };
}
export function identifiedFurniture(progress: number) {
 return EXTRACTION_ORDER.filter(item=>furnitureCapture(progress,item).surface>=1).length;
}

/** Accumulate detail throughout the camera sweep instead of filling early. */
export function scanPointDensity(progress: number) {
 const t=clamp((progress-.06)/.34);
 return .025+.975*Math.pow(t,1.65);
}
