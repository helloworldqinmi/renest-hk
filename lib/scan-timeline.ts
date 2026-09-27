const clamp = (value: number) => Math.max(0, Math.min(1, value));
const smooth = (value: number) => { const t = clamp(value); return t * t * (3 - 2 * t); };

/** One spatial sweep drives the phone, sensor rays, points and reconstructed shell. */
export function scanTimeline(progress: number) {
 const turn = smooth(progress / .06);
 const sweep = smooth((progress - .06) / .86);
 // A small spatial lead lets points resolve into surfaces behind the sensor.
 const surface = clamp(sweep - .065 * (1 - smooth((progress - .92) / .06)));
 return {
  turn, sweep,
  beamActive: progress >= .06 && progress < .98,
  surfaceActive: progress > .06 && surface > 0,
  beamX: -4.55 + sweep * 9.2,
  surfaceX: -4.55 + surface * 9.2,
  pointOpacity: .8 * (1 - smooth((progress - .9) / .08)),
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
