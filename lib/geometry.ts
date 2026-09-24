import type { Dimensions, LayoutPlan, Placement, Point, RoomZone } from "@/types";
import { furnitureInventory, newRoom } from "@/lib/demo-data";

export interface Rect extends Point {
  width: number;
  depth: number;
}

export function rotatedDimensions(dimensions: Dimensions, rotation: number) {
  return rotation % 180 === 0
    ? { width: dimensions.width, depth: dimensions.depth }
    : { width: dimensions.depth, depth: dimensions.width };
}

export function isInsideRoom(rect: Rect, room: Pick<RoomZone, "width" | "depth">) {
  return rect.x >= 0 && rect.y >= 0 && rect.x + rect.width <= room.width && rect.y + rect.depth <= room.depth;
}

export function doRectanglesOverlap(a: Rect, b: Rect) {
  return a.x < b.x + b.width && a.x + a.width > b.x && a.y < b.y + b.depth && a.y + a.depth > b.y;
}

export function distanceToWindow(rect: Rect, windowPoint: Point) {
  const center = { x: rect.x + rect.width / 2, y: rect.y + rect.depth / 2 };
  return Math.hypot(center.x - windowPoint.x, center.y - windowPoint.y);
}

export function distanceToDoor(rect: Rect, doorPoint: Point) {
  const closestX = Math.max(rect.x, Math.min(doorPoint.x, rect.x + rect.width));
  const closestY = Math.max(rect.y, Math.min(doorPoint.y, rect.y + rect.depth));
  return Math.hypot(closestX - doorPoint.x, closestY - doorPoint.y);
}

export function calculateOpenFloorArea(roomArea: number, furniture: Rect[]) {
  return Math.max(0, roomArea - furniture.reduce((sum, item) => sum + item.width * item.depth, 0));
}

export function calculateClearance(a: Rect, b: Rect) {
  const horizontal = Math.max(0, Math.max(a.x, b.x) - Math.min(a.x + a.width, b.x + b.width));
  const vertical = Math.max(0, Math.max(a.y, b.y) - Math.min(a.y + a.depth, b.y + b.depth));
  return horizontal === 0 ? vertical : vertical === 0 ? horizontal : Math.hypot(horizontal, vertical);
}

function placementRect(placement: Placement): Rect {
  const item = furnitureInventory.find((candidate) => candidate.id === placement.furnitureId)!;
  const dimensions = placement.overrideDimensions ?? item.dimensions;
  return { ...placement.position, ...rotatedDimensions(dimensions, placement.rotation) };
}

export function validateLayout(layout: LayoutPlan) {
  const violations: string[] = [];
  const byRoom = new Map<string, { placement: Placement; rect: Rect }[]>();

  for (const placement of layout.placements) {
    const room = newRoom.zones.find((zone) => zone.id === placement.roomId)!;
    const rect = placementRect(placement);
    if (!isInsideRoom(rect, room)) violations.push(`${placement.furnitureId} falls outside ${room.name}`);
    const entries = byRoom.get(placement.roomId) ?? [];
    if (entries.some((entry) => doRectanglesOverlap(rect, entry.rect))) violations.push(`${placement.furnitureId} overlaps another item`);
    entries.push({ placement, rect });
    byRoom.set(placement.roomId, entries);
  }

  return { feasible: violations.length === 0, violations };
}

export function scoreLayout(layout: LayoutPlan, weights = { reuse: 1, space: 1, cost: 1 }) {
  const reuseScore = (layout.reused / 7) * 100;
  const spaceScore = Math.min(100, (layout.openArea / 11) * 100);
  const costScore = Math.max(0, 100 - layout.cost / 40);
  return Math.round((reuseScore * weights.reuse + spaceScore * weights.space + costScore * weights.cost) / (weights.reuse + weights.space + weights.cost));
}
