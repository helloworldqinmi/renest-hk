import { studioInventory, type Placement } from './studio-data';
import { footprint, isStaged } from './studio-placement';
import { demoBlueprint } from './floor-plan-blueprints';

export type TourCopy = [string, string, string];
export type TourPoint = [number, number, number];
export type TourShot = { id: string; title: TourCopy; detail: TourCopy; from: TourPoint; to: TourPoint; target: TourPoint; fov: number; shift: number };
export const ROOM_DURATION = 6;
const clearance = .26;
export const TOUR_CAMERA_HEIGHT = 1.4;
type Room = { id: string; title: TourCopy; detail: TourCopy; bounds: [number, number, number, number]; anchors: [number, number][]; focus: string[]; target: TourPoint };
const rooms: Room[] = [
  { id: 'living', title: ['The living room', '客厅里的日常', '客廳裡的日常'], detail: ['The familiar pieces, together again.', '熟悉的家具，在新家继续陪伴。', '熟悉的傢俬，在新居繼續陪伴。'], bounds: [.28, 1.7, 3.35, 5.1], anchors: [[.95, 4.85], [.75, 1.85], [3.1, 4.15]], focus: ['F01'], target: [2.25, 1.05, 2.6] },
  { id: 'dining', title: ['Room to gather', '一起吃饭的地方', '一起吃飯的地方'], detail: ['A place for everyday rituals.', '为每一次相聚，留一个位置。', '為每一次相聚，留一個位置。'], bounds: [.28, 3.5, 3.15, 5.88], anchors: [[1.05, 3.65], [.65, 5.8], [3.05, 5.8]], focus: ['N02', 'F04'], target: [2.05, 1, 5.05] },
  { id: 'bedroom', title: ['A quieter corner', '安心休息的卧室', '安心休息的睡房'], detail: ['A little light. A little calm.', '让光线和安静，慢慢住进来。', '讓光線和寧靜，慢慢住進來。'], bounds: [4.57, .8, 8.08, 2.98], anchors: [[4.59, 2.97], [7.5, 2.92], [7.7, 2.6]], focus: ['F09'], target: [5.96, 1.02, 1.65] },
  { id: 'study', title: ['Your other room', '另一种生活空间', '另一種生活空間'], detail: ['Space that follows the way you live.', '为你的生活方式，留一点余地。', '為你的生活方式，留一點餘地。'], bounds: [5.77, 3.52, 8.08, 5.88], anchors: [[5.85, 3.7], [7.7, 5.8], [5.86, 4.65]], focus: ['F15', 'N03', 'N06', 'F13'], target: [7.15, 1, 4.9] },
];

export function cameraPositionClear(x: number, z: number, placements: Placement[], margin = clearance) {
  const nearWall = demoBlueprint.walls.some(wall => {
    const [ax, az] = wall.a, [bx, bz] = wall.b, length = Math.hypot(bx - ax, bz - az);
    const along = ((x - ax) * (bx - ax) + (z - az) * (bz - az)) / length;
    if (wall.door && Math.abs(along - wall.door[0]) < wall.door[1] / 2 - margin) return false;
    const t = Math.max(0, Math.min(1, along / length));
    return Math.hypot(x - ax - (bx - ax) * t, z - az - (bz - az) * t) < margin;
  });
  return !nearWall && placements.filter(p => !isStaged(p)).every(p => {
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
    const target: TourPoint = focus ? [focus.x, TOUR_CAMERA_HEIGHT, focus.z] : [room.target[0], TOUR_CAMERA_HEIGHT, room.target[2]];
    const candidates = [...room.anchors];
    for (let x = x0; x <= x1; x += .18) for (let z = z0; z <= z1; z += .18) candidates.push([x, z]);
    const clear = candidates.filter(([x, z]) => inRoom(x, z) && cameraPositionClear(x, z, placements));
    if (!clear.length) return [];
    function score([x, z]: [number, number]) {
      const distance = Math.hypot(x - target[0], z - target[2]);
      // Fit the subject with breathing room; prefer a three-quarter view over a close-up.
      const desired = room.id === 'living' ? 3.35 : room.id === 'bedroom' ? 2.7 : 2.8;
      let value = Math.abs(distance - desired) * 3 + Math.hypot(x - room.anchors[0][0], z - room.anchors[0][1]) * 1.2;
      if (focus && ['F01', 'F09', 'F13'].includes(focus.id)) {
        const angle = focus.rotation * Math.PI / 180;
        const front = ((x - focus.x) * Math.sin(angle) + (z - focus.z) * Math.cos(angle)) / Math.max(.1, distance);
        value += Math.max(0, .25 - front) * 12;
      }
      // A wardrobe near the lens can fill half the frame even if the center ray is clear.
      for (const p of placements.filter(p => !isStaged(p))) {
        const item = studioInventory.find(item => item.id === p.id);
        if (!item || item.dimensions[2] < 1.5) continue;
        const dx = p.x - x, dz = p.z - z, d = Math.hypot(dx, dz);
        const facing = (dx * (target[0] - x) + dz * (target[2] - z)) / Math.max(.01, d * distance);
        if (facing > .35 && d < 1.5) value += (1.5 - d) * 35;
      }
      // Avoid looking at the back of a tall cabinet instead of the room's focus.
      for (let i = 1; i < 8; i++) {
        const t = i / 8, px = x + (target[0] - x) * t, pz = z + (target[2] - z) * t;
        if (placements.some(p => {
          const item = studioInventory.find(item => item.id === p.id)!;
          const { w, d } = footprint(p);
          return p.id !== focus?.id && item.dimensions[2] > TOUR_CAMERA_HEIGHT * (1 - t) + .8 * t && Math.abs(px - p.x) < w / 2 && Math.abs(pz - p.z) < d / 2;
        })) value += 18;
      }
      return value;
    }
    clear.sort((a, b) => score(a) - score(b));
    const [x, z] = clear[0];
    const drift = [[.24, 0], [-.24, 0], [0, .24], [0, -.24]].find(([dx, dz]) =>
      Array.from({ length: 6 }, (_, i) => i / 5).every(t => inRoom(x + dx * t, z + dz * t) && cameraPositionClear(x + dx * t, z + dz * t, placements)),
    ) ?? [0, 0];
    const title = room.id === 'study'
      ? placements.some(p => p.id === 'F13' && inRoom(p.x, p.z)) ? ['The second bedroom', '属于自己的小房间', '屬於自己的小房間'] as TourCopy : ['Your home office', '在家专注的角落', '在家專注的角落'] as TourCopy
      : room.title;
    return [{ id: room.id, title, detail: room.detail, from: [x, TOUR_CAMERA_HEIGHT, z], to: [x + drift[0], TOUR_CAMERA_HEIGHT, z + drift[1]], target, fov: room.id === 'living' ? 66 : room.id === 'dining' ? 70 : 68, shift: room.id === 'dining' ? .035 : room.id === 'study' ? .09 : .14 }];
  });
}

export function tourFrame(seconds: number, count: number) {
  const time = Math.max(0, Math.min(seconds, count * ROOM_DURATION));
  const index = Math.min(count - 1, Math.floor(time / ROOM_DURATION));
  return { index, progress: Math.min(1, (time - index * ROOM_DURATION) / ROOM_DURATION) };
}
