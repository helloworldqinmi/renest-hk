import { studioInventory, type Placement } from './studio-data';
import { footprint, isStaged } from './studio-placement';

export type TourCopy = [string, string, string];
export type TourPoint = [number, number, number];
export type TourShot = { id: string; title: TourCopy; detail: TourCopy; from: TourPoint; to: TourPoint; target: TourPoint };
export const ROOM_DURATION = 8;
const clearance = .22;
type Room = { id: string; title: TourCopy; detail: TourCopy; bounds: [number, number, number, number]; anchors: [number, number][]; focus: string[]; target: TourPoint };
const rooms: Room[] = [
  { id: 'living', title: ['The living room', '客厅里的日常', '客廳裡的日常'], detail: ['The familiar pieces, together again.', '熟悉的家具，在新家继续陪伴。', '熟悉的傢俬，在新居繼續陪伴。'], bounds: [.28, 1.7, 3.95, 4.05], anchors: [[.85, 3.75], [1.1, 1.8], [3.75, 3.75]], focus: ['F01'], target: [2.25, 1.05, 2.6] },
  { id: 'dining', title: ['Room to gather', '一起吃饭的地方', '一起吃飯的地方'], detail: ['A place for everyday rituals.', '为每一次相聚，留一个位置。', '為每一次相聚，留一個位置。'], bounds: [.28, 4.45, 3.15, 5.88], anchors: [[.65, 5.8], [.5, 4.65], [3.05, 5.8]], focus: ['N02', 'F04'], target: [2.05, 1, 5.05] },
  { id: 'bedroom', title: ['A quieter corner', '安心休息的卧室', '安心休息的睡房'], detail: ['A little light. A little calm.', '让光线和安静，慢慢住进来。', '讓光線和寧靜，慢慢住進來。'], bounds: [4.62, .8, 8.08, 2.95], anchors: [[7.5, 2.92], [4.68, 2.9], [7.7, 2.6]], focus: ['F09'], target: [5.96, 1.02, 1.65] },
  { id: 'study', title: ['Your other room', '另一种生活空间', '另一種生活空間'], detail: ['Space that follows the way you live.', '为你的生活方式，留一点余地。', '為你的生活方式，留一點餘地。'], bounds: [5.8, 3.56, 8.08, 5.88], anchors: [[5.85, 3.7], [7.95, 3.6], [5.86, 4.65]], focus: ['F15', 'N03', 'N06', 'F13'], target: [7.15, 1, 4.9] },
];

export function cameraPositionClear(x: number, z: number, placements: Placement[], margin = clearance) {
  return placements.filter(p => !isStaged(p)).every(p => {
    const { w, d } = footprint(p);
    return Math.abs(x - p.x) >= w / 2 + margin || Math.abs(z - p.z) >= d / 2 + margin;
  });
}

/** Small moves within each room; cuts between rooms never fly through walls. */
export function buildInteriorTour(placements: Placement[]): TourShot[] {
  return rooms.flatMap(room => {
    const [x0, z0, x1, z1] = room.bounds;
    const inRoom = (x: number, z: number) => x >= x0 && x <= x1 && z >= z0 && z <= z1;
    const focus = room.focus.map(id => placements.find(p => p.id === id && inRoom(p.x, p.z))).find(Boolean);
    const target: TourPoint = focus ? [focus.x, room.target[1], focus.z] : room.target;
    const candidates = [...room.anchors];
    for (let x = x0; x <= x1; x += .18) for (let z = z0; z <= z1; z += .18) candidates.push([x, z]);
    const clear = candidates.filter(([x, z]) => inRoom(x, z) && cameraPositionClear(x, z, placements));
    if (!clear.length) return [];
    function score([x, z]: [number, number]) {
      let value = Math.hypot(x - room.anchors[0][0], z - room.anchors[0][1]);
      // Avoid looking at the back of a tall cabinet instead of the room's focus.
      for (let i = 1; i < 8; i++) {
        const t = i / 8, px = x + (target[0] - x) * t, pz = z + (target[2] - z) * t;
        if (placements.some(p => {
          const item = studioInventory.find(item => item.id === p.id)!;
          const { w, d } = footprint(p);
          return p.id !== focus?.id && item.dimensions[2] > 1.52 + (target[1] - 1.52) * t && Math.abs(px - p.x) < w / 2 && Math.abs(pz - p.z) < d / 2;
        })) value += 4;
      }
      return value;
    }
    clear.sort((a, b) => score(a) - score(b));
    const [x, z] = clear[0];
    const drift = [[.14, 0], [-.14, 0], [0, .14], [0, -.14]].find(([dx, dz]) =>
      Array.from({ length: 6 }, (_, i) => i / 5).every(t => inRoom(x + dx * t, z + dz * t) && cameraPositionClear(x + dx * t, z + dz * t, placements)),
    ) ?? [0, 0];
    const title = room.id === 'study'
      ? placements.some(p => p.id === 'F13' && inRoom(p.x, p.z)) ? ['The second bedroom', '属于自己的小房间', '屬於自己的小房間'] as TourCopy : ['Your home office', '在家专注的角落', '在家專注的角落'] as TourCopy
      : room.title;
    return [{ id: room.id, title, detail: room.detail, from: [x, 1.52, z], to: [x + drift[0], 1.52, z + drift[1]], target }];
  });
}

export function tourFrame(seconds: number, count: number) {
  const time = Math.max(0, Math.min(seconds, count * ROOM_DURATION));
  const index = Math.min(count - 1, Math.floor(time / ROOM_DURATION));
  return { index, progress: Math.min(1, (time - index * ROOM_DURATION) / ROOM_DURATION) };
}
