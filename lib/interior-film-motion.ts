/** One continuous editorial move per room; never reset the crop within a shot. */
export function interiorFilmMotion(progress: number, room: string, reduced = false) {
  const p = Math.max(0, Math.min(1, progress));
  if (reduced) return { scale: 1, origin: '50% 50%' };
  const travel = .8 * p + .2 * p * p * (3 - 2 * p);
  const origins: Record<string, string> = {
    living: '60% 60%', dining: '53% 60%', bedroom: '46% 62%', study: '58% 58%',
  };
  const pullBack = room === 'dining' || room === 'study';
  return {
    scale: pullBack ? 1.065 - travel * .065 : 1 + travel * .065,
    origin: origins[room] ?? '50% 60%',
  };
}
