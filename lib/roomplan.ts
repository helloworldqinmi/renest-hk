import type { FurnitureCategory, FurnitureItem, ScannedRoom } from "@/types";

type RawRoomPlan = {
  identifier: string;
  label: string;
  dimensions: { width: number; depth: number };
  surfaces?: { windows?: Array<{ id: string; wall: "north" | "east" | "south" | "west"; offset: number; width: number }>; doors?: Array<{ id: string; wall: "north" | "east" | "south" | "west"; offset: number; width: number; swing?: "in" | "out" }> };
  objects?: Array<{ id: string; label: string; category: FurnitureCategory; dimensions: { width: number; depth: number; height: number }; confidence?: number }>;
};

export function parseRoomPlanJSON(input: string | RawRoomPlan): ScannedRoom {
  const raw = typeof input === "string" ? (JSON.parse(input) as RawRoomPlan) : input;
  if (!raw.identifier || !raw.dimensions?.width || !raw.dimensions?.depth) throw new Error("Invalid RoomPlan export");

  const furniture: FurnitureItem[] = (raw.objects ?? []).map((item) => ({
    id: item.id,
    name: item.label,
    category: item.category,
    dimensions: item.dimensions,
    source: "existing",
    selected: true,
  }));

  return {
    id: raw.identifier,
    name: raw.label,
    width: raw.dimensions.width,
    depth: raw.dimensions.depth,
    areaSqM: raw.dimensions.width * raw.dimensions.depth,
    areaSqFt: Math.round(raw.dimensions.width * raw.dimensions.depth * 10.764),
    walls: [
      { id: "north", start: { x: 0, y: 0 }, end: { x: raw.dimensions.width, y: 0 } },
      { id: "east", start: { x: raw.dimensions.width, y: 0 }, end: { x: raw.dimensions.width, y: raw.dimensions.depth } },
      { id: "south", start: { x: raw.dimensions.width, y: raw.dimensions.depth }, end: { x: 0, y: raw.dimensions.depth } },
      { id: "west", start: { x: 0, y: raw.dimensions.depth }, end: { x: 0, y: 0 } },
    ],
    windows: raw.surfaces?.windows ?? [],
    doors: (raw.surfaces?.doors ?? []).map((door) => ({ ...door, swing: door.swing ?? "in" })),
    zones: [{ id: "living", name: raw.label, width: raw.dimensions.width, depth: raw.dimensions.depth, origin: { x: 0, y: 0 }, interactive: true }],
    furniture,
  };
}
