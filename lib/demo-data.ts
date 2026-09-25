import type { FurnitureItem, LayoutPlan, MarketplaceProduct, ScannedRoom } from "@/types";

export const demoScenario = {
  currentHome: { name: "Kowloon", areaSqFt: 380 },
  newHome: { name: "Northern Metropolis", areaSqFt: 310 },
  furnitureTotal: 7,
  reused: 6,
  replaced: 1,
  newItems: 1,
  spendingAvoided: 15500,
  openSpaceIncrease: 19,
  replacementRate: 14,
  circularMoveScore: 92,
  currentTable: { name: "Current Dining Table", widthCm: 140, depthCm: 80, clearanceCm: 43, resaleLow: 700, resaleHigh: 900 },
  replacementTable: { name: "Compact Folding Table", widthCm: 89, depthCm: 60, clearanceCm: 82, spaceUnlockedSqM: 1.5 },
} as const;

export const furnitureInventory: FurnitureItem[] = [
  { id: "sofa", name: "2-seat Sofa", category: "sofa", dimensions: { width: 2.04, depth: 0.88, height: 0.82 }, estimatedValue: 4200, selected: true, source: "existing" },
  { id: "desk", name: "Study Desk", category: "desk", dimensions: { width: 1.2, depth: 0.6, height: 0.75 }, estimatedValue: 1600, selected: true, source: "existing" },
  { id: "bed", name: "Double Bed", category: "bed", dimensions: { width: 1.9, depth: 1.35, height: 0.45 }, estimatedValue: 4800, selected: true, source: "existing" },
  { id: "wardrobe", name: "Wardrobe", category: "storage", dimensions: { width: 1.2, depth: 0.58, height: 2 }, estimatedValue: 2900, selected: true, source: "existing" },
  { id: "coffee-table", name: "Coffee Table", category: "table", dimensions: { width: 1, depth: 0.55, height: 0.42 }, estimatedValue: 900, selected: true, source: "existing" },
  { id: "bookshelf", name: "Bookshelf", category: "storage", dimensions: { width: 0.8, depth: 0.32, height: 1.8 }, estimatedValue: 1100, selected: true, source: "existing" },
  { id: "dining-table", name: "Dining Table", category: "table", dimensions: { width: 1.4, depth: 0.8, height: 0.75 }, estimatedValue: 2200, selected: true, source: "existing" },
];

const walls = [
  { id: "north", start: { x: 0, y: 0 }, end: { x: 7.4, y: 0 } },
  { id: "east", start: { x: 7.4, y: 0 }, end: { x: 7.4, y: 3.4 } },
  { id: "south", start: { x: 7.4, y: 3.4 }, end: { x: 0, y: 3.4 } },
  { id: "west", start: { x: 0, y: 3.4 }, end: { x: 0, y: 0 } },
];

export const oldRoom: ScannedRoom = {
  id: "old-kowloon",
  name: "Kowloon Home",
  width: 8.5,
  depth: 4.4,
  areaSqM: 35.3,
  areaSqFt: 380,
  walls,
  windows: [{ id: "old-window", wall: "north", offset: 1.2, width: 2.4 }],
  doors: [{ id: "old-door", wall: "south", offset: 3.6, width: 0.85, swing: "in" }],
  zones: [
    { id: "living", name: "Living Area", width: 4.5, depth: 3.4, origin: { x: 0, y: 0 }, interactive: true },
    { id: "bedroom", name: "Main Bedroom", width: 4, depth: 3.2, origin: { x: 4.5, y: 0 }, interactive: true },
  ],
  furniture: furnitureInventory,
};

export const newRoom: ScannedRoom = {
  id: "new-northern-metropolis",
  name: "Northern Metropolis Home",
  width: 7.25,
  depth: 3.1,
  areaSqM: 29.1,
  areaSqFt: 310,
  walls,
  windows: [
    { id: "living-window", wall: "north", offset: 0.7, width: 2.2 },
    { id: "bedroom-window", wall: "east", offset: 0.55, width: 1.3 },
  ],
  doors: [
    { id: "entrance", wall: "south", offset: 3.1, width: 0.9, swing: "in" },
    { id: "bedroom-door", wall: "west", offset: 2.05, width: 0.8, swing: "in" },
  ],
  zones: [
    { id: "living", name: "Living Room", width: 3.9, depth: 3.1, origin: { x: 0, y: 0 }, interactive: true },
    { id: "bedroom", name: "Bedroom", width: 3.35, depth: 2.85, origin: { x: 3.9, y: 0 }, interactive: true },
    { id: "kitchen", name: "Kitchen", width: 1.45, depth: 1.05, origin: { x: 3.9, y: 2.05 }, interactive: false },
    { id: "bathroom", name: "Bath", width: 1.25, depth: 1.05, origin: { x: 5.35, y: 2.05 }, interactive: false },
  ],
  furniture: [],
};

export const plans: LayoutPlan[] = [
  {
    id: "reuse", name: "Plan A", shortName: "Reuse Max", reused: 6, purchases: 1, openArea: 7.8, cost: 1290, spendingAvoided: 15500, walkwayClearance: 82, score: 94,
    description: "Keeps almost everything you own while maintaining comfortable circulation.",
    placements: [
      { furnitureId: "sofa", roomId: "living", position: { x: 0.18, y: 0.18 }, rotation: 0, status: "keep" },
      { furnitureId: "coffee-table", roomId: "living", position: { x: 0.86, y: 1.28 }, rotation: 0, status: "keep" },
      { furnitureId: "bookshelf", roomId: "living", position: { x: 3.25, y: 0.2 }, rotation: 90, status: "keep" },
      { furnitureId: "dining-table", roomId: "living", position: { x: 2.73, y: 2.17 }, rotation: 0, status: "new", overrideName: "Compact Folding Table", overrideDimensions: { width: 0.89, depth: 0.6, height: 0.75 } },
      { furnitureId: "bed", roomId: "bedroom", position: { x: 0.16, y: 1.3 }, rotation: 0, status: "keep" },
      { furnitureId: "desk", roomId: "bedroom", position: { x: 2.05, y: 0.12 }, rotation: 0, status: "keep" },
      { furnitureId: "wardrobe", roomId: "bedroom", position: { x: 0.16, y: 0.12 }, rotation: 0, status: "keep" },
    ],
  },
  {
    id: "space", name: "Plan B", shortName: "Space Max", reused: 4, purchases: 2, openArea: 10.6, cost: 3480, spendingAvoided: 9000, walkwayClearance: 88, score: 88,
    description: "Prioritizes an open living area and comfortable circulation.",
    placements: [
      { furnitureId: "sofa", roomId: "living", position: { x: 0.18, y: 0.18 }, rotation: 0, status: "new", overrideName: "Compact Sofa", overrideDimensions: { width: 1.5, depth: 0.72, height: 0.78 } },
      { furnitureId: "bookshelf", roomId: "living", position: { x: 3.25, y: 0.2 }, rotation: 90, status: "keep" },
      { furnitureId: "dining-table", roomId: "living", position: { x: 2.9, y: 2.28 }, rotation: 0, status: "new", overrideName: "Wall Table", overrideDimensions: { width: 0.8, depth: 0.5, height: 0.75 } },
      { furnitureId: "bed", roomId: "bedroom", position: { x: 0.16, y: 1.3 }, rotation: 0, status: "keep" },
      { furnitureId: "desk", roomId: "bedroom", position: { x: 2.05, y: 0.12 }, rotation: 0, status: "keep" },
      { furnitureId: "wardrobe", roomId: "bedroom", position: { x: 0.16, y: 0.12 }, rotation: 0, status: "keep" },
    ],
  },
  {
    id: "cost", name: "Plan C", shortName: "Lowest Cost", reused: 7, purchases: 0, openArea: 6.3, cost: 0, spendingAvoided: 17700, walkwayClearance: 43, score: 76,
    description: "Costs nothing, but creates a tighter living environment.",
    compromises: ["Narrow living-room circulation", "Desk receives less natural light"],
    placements: [
      { furnitureId: "sofa", roomId: "living", position: { x: 0.12, y: 0.12 }, rotation: 0, status: "keep" },
      { furnitureId: "coffee-table", roomId: "living", position: { x: 0.82, y: 1.22 }, rotation: 0, status: "keep" },
      { furnitureId: "bookshelf", roomId: "living", position: { x: 3.28, y: 0.18 }, rotation: 90, status: "keep" },
      { furnitureId: "dining-table", roomId: "living", position: { x: 2.35, y: 2.14 }, rotation: 0, status: "keep" },
      { furnitureId: "bed", roomId: "bedroom", position: { x: 0.12, y: 1.36 }, rotation: 0, status: "keep" },
      { furnitureId: "desk", roomId: "bedroom", position: { x: 1.85, y: 0.14 }, rotation: 0, status: "keep" },
      { furnitureId: "wardrobe", roomId: "bedroom", position: { x: 0.12, y: 0.14 }, rotation: 0, status: "keep" },
    ],
  },
];

export const marketplaceProducts: MarketplaceProduct[] = [
  { id: "fold-table-1", name: "NORDEN Compact Folding Table", width: 0.89, depth: 0.6, height: 0.75, price: 1290, seller: "Partner Store", type: "New", fitScore: 98, clearance: 82, tone: "oak" },
  { id: "secondhand-table", name: "Compact Oak Dining Table", width: 0.9, depth: 0.65, height: 0.74, price: 620, seller: "Second-hand Marketplace", type: "Pre-owned", fitScore: 94, clearance: 78, tone: "walnut" },
  { id: "wall-table", name: "Wall-mounted Folding Table", width: 0.8, depth: 0.5, height: 0.75, price: 890, seller: "Local Furniture Store", type: "New", fitScore: 92, clearance: 88, tone: "white" },
];

export const preferenceOptions = ["More open space", "Reuse more furniture", "Work from home", "Entertain friends", "More storage", "Lowest move-in cost"];

export const defaultPreference = "I study and work from home often. Keep my desk close to natural light. I want the living room to feel open, and I would rather reuse furniture than buy new pieces.";

export const interpretedConstraints = ["Desk -> near window", "Open living area -> high priority", "Reuse existing furniture -> high priority", "New purchases -> minimize", "Walking clearance -> >= 70 cm"];
