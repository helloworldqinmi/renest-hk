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
