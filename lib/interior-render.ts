import type { Placement } from './studio-data';
import { isStaged } from './studio-placement';

/** Only use an offline frame when every furniture transform matches its render. */
export function interiorPlanKey(placements: Placement[]) {
  return placements.filter(p => !isStaged(p)).map(p => `${p.id}:${p.x.toFixed(4)}:${p.z.toFixed(4)}:${p.rotation.toFixed(4)}`).sort().join('|');
}
export type InteriorRenderManifest = { key: string; frames: Record<string, { day: string; evening: string }> }[];
