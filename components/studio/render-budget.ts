import type { WebGLRenderer } from 'three';

/** Bound the actual framebuffer, including large monitors and high-DPI laptops. */
export function renderPixelRatio(width: number, height: number, deviceRatio: number, mobile: boolean) {
  return Math.max(1, Math.min(deviceRatio, mobile ? 1.25 : 1.5, Math.sqrt((mobile ? 1_000_000 : 3_500_000) / Math.max(1, width * height))));
}

/** Reduce resolution only after sustained slow frames, never oscillate during a shot. */
export function createRenderBudget(renderer: WebGLRenderer, mobile: boolean) {
  let previous = 0, samples = 0, average = 0;
  return (now: number, moving: boolean) => {
    const delta = now - previous; previous = now;
    if (!moving || delta < 8 || delta > 1500) { samples = 0; return; }
    average = samples ? average * .9 + Math.min(100,delta) * .1 : Math.min(100,delta);
    if (++samples < (average > 65 ? 12 : 60)) return;
    samples = 0;
    const ratio = renderer.getPixelRatio();
    const minimum = 1;
    if (average > (mobile ? 42 : 24) && ratio > minimum) renderer.setPixelRatio(Math.max(minimum, ratio - .15));
  };
}
