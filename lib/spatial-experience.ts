/** Shared timing for the reconstruction-to-interior reveal. */
export const ENTRY_DURATION = 4.8;
export const clamp01 = (value: number) => Math.max(0, Math.min(1, value));
export const smoothstep = (value: number) => { const t = clamp01(value); return t * t * (3 - 2 * t); };
export const smootherstep = (value: number) => { const t = clamp01(value); if (t < .000001 || t > .999999) return Math.round(t); return t * t * t * (t * (t * 6 - 15) + 10); };

export function spatialReveal(seconds: number, reduced = false) {
  if (reduced) return { wire: 0, surface: 1, travel: 1 };
  return {
    wire: smoothstep(seconds / .35) * (1 - smoothstep((seconds - 2.7) / 1.55)),
    surface: smoothstep((seconds - 2.45) / 1.8),
    travel: smootherstep((seconds - .85) / (ENTRY_DURATION - .85)),
  };
}

/** Survey → eye-level acquisition → model overview. Separate from the entry reveal. */
export function scanCameraFrame(progress: number, reduced = false) {
  const p = clamp01(progress);
  const immersion = reduced ? 0 : smootherstep((p - .1) / .18) * (1 - smootherstep((p - .48) / .2));
  const orbit = reduced ? 0 : -1.2 * smootherstep((p - .3) / .3);
  return { immersion, orbit: orbit || 0, pan: smootherstep((p - .25) / .22), returning: p > .4 };
}
