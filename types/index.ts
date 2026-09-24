export type FurnitureCategory = "sofa" | "desk" | "bed" | "storage" | "table";
export type FurnitureStatus = "keep" | "move" | "replace" | "sell" | "new";
export type Rotation = 0 | 90 | 180 | 270;

export interface Dimensions {
  width: number;
  depth: number;
  height: number;
}

export interface Point {
  x: number;
  y: number;
}

export interface FurnitureItem {
  id: string;
  name: string;
  category: FurnitureCategory;
  dimensions: Dimensions;
  position?: Point;
  rotation?: Rotation;
  estimatedValue?: number;
  source: "existing" | "marketplace";
  status?: FurnitureStatus;
  selected?: boolean;
}

export interface Wall {
  id: string;
  start: Point;
  end: Point;
}

export interface WindowFeature {
  id: string;
  wall: "north" | "east" | "south" | "west";
  offset: number;
  width: number;
}

export interface DoorFeature extends WindowFeature {
  swing: "in" | "out";
}

export interface RoomZone {
  id: "living" | "bedroom" | "kitchen" | "bathroom";
  name: string;
  width: number;
  depth: number;
  origin: Point;
  interactive: boolean;
}

export interface ScannedRoom {
  id: string;
  name: string;
  width: number;
  depth: number;
  areaSqM: number;
  areaSqFt: number;
  walls: Wall[];
  windows: WindowFeature[];
  doors: DoorFeature[];
  zones: RoomZone[];
  furniture: FurnitureItem[];
}

export interface Placement {
  furnitureId: string;
  roomId: "living" | "bedroom";
  position: Point;
  rotation: Rotation;
  status: FurnitureStatus;
  overrideDimensions?: Dimensions;
  overrideName?: string;
}

export interface LayoutPlan {
  id: "reuse" | "space" | "cost";
  name: string;
  shortName: string;
  description: string;
  reused: number;
  purchases: number;
  openArea: number;
  cost: number;
  score: number;
  placements: Placement[];
  compromises?: string[];
}

export interface MarketplaceProduct {
  id: string;
  name: string;
  width: number;
  depth: number;
  height: number;
  price: number;
  seller: string;
  type: "New" | "Pre-owned";
  fitScore: number;
  clearance: number;
  tone: "oak" | "walnut" | "white";
}
