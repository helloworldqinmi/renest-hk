/** Follow the shortest turn with a bounded steering rate; never snap across ±180°. */
export function smoothTruckHeading(current: number, target: number, seconds: number) {
  const delta = Math.atan2(Math.sin((target - current) * Math.PI / 180), Math.cos((target - current) * Math.PI / 180)) * 180 / Math.PI;
  const dt = Math.max(0, Math.min(.06, seconds));
  const turn = delta * (1 - Math.exp(-7 * dt));
  const limit = 85 * dt;
  return current + Math.max(-limit, Math.min(limit, turn));
}
