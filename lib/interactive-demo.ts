import type { FurnitureItem, LayoutPlan } from "@/types";
import { furnitureInventory, plans } from "@/lib/demo-data";

export const demoInventoryIds = ["sofa", "dining-table", "desk", "work-chair", "coffee-table", "bookshelf"] as const;
export const demoFurnitureTotal = demoInventoryIds.length;
export const demoWorkChair: FurnitureItem = {
  id: "work-chair", name: "Work Chair", category: "chair",
  dimensions: { width: 0.58, depth: 0.58, height: 0.9 },
  estimatedValue: 700, source: "existing",
};
export const demoFurnitureInventory = [
  ...furnitureInventory.filter((item) => demoInventoryIds.some((id) => id === item.id)),
  demoWorkChair,
];

const deskInMainSpace = { furnitureId: "desk", roomId: "living", position: { x: 3.05, y: 1.42 }, rotation: 90, status: "keep" } as const;
const photoPlacement = {
  sofa: { x: 0.15, y: 0.85, rotation: 270 },
  "coffee-table": { x: 1.35, y: 1.95, rotation: 0 },
  bookshelf: { x: 3.45, y: 0.25, rotation: 90 },
  "dining-table": { x: 1.42, y: 0.38, rotation: 0 },
} as const;
function alignWithPhoto(plan: LayoutPlan): LayoutPlan["placements"] {
  return plan.placements.filter((item) => item.roomId === "living").map((item) => {
    const target = photoPlacement[item.furnitureId as keyof typeof photoPlacement];
    return target ? { ...item, position: { x: target.x, y: target.y }, rotation: target.rotation } : item;
  });
}
export const demoPlans: LayoutPlan[] = [
  {
    ...plans[0],
    reused: 5,
    spendingAvoided: 8500,
    placements: [
      ...alignWithPhoto(plans[0]).map((item) => item.furnitureId === "dining-table"
        ? { ...item, position: { x: 0.92, y: item.position.y } }
        : item),
      deskInMainSpace,
    ],
  },
  { ...plans[1], reused: 3, spendingAvoided: 3400, placements: [...alignWithPhoto(plans[1]), deskInMainSpace] },
  { ...plans[2], reused: 6, spendingAvoided: 10700, placements: [...alignWithPhoto(plans[2]), deskInMainSpace] },
];

export type DemoObjective = "keep" | "host" | "work";

export interface ObjectiveConfig {
  id: DemoObjective;
  label: string;
  shortLabel: string;
  description: string;
  rule: string;
  plan: LayoutPlan;
  preview: string;
  previewAlt: string;
  previewPosition?: string;
  outcome: string;
  decision: string;
  recommendation: {
    name: string;
    dimensions: string;
    price: string;
    image: string;
    reason: string;
    replaces: string;
  };
}

const workFromHomePlan: LayoutPlan = {
  id: "wfh",
  name: "Plan C",
  shortName: "Work From Home",
  description: "Protects a bright, dedicated work zone without sacrificing the main walking route.",
  reused: 4,
  purchases: 1,
  openArea: 8.6,
  cost: 1290,
  spendingAvoided: 7600,
  walkwayClearance: 76,
  score: 91,
  placements: [
    { furnitureId: "sofa", roomId: "living", position: { x: 0.15, y: 0.85 }, rotation: 270, status: "keep" },
    { furnitureId: "bookshelf", roomId: "living", position: { x: 3.45, y: 0.25 }, rotation: 90, status: "keep" },
    { furnitureId: "desk", roomId: "living", position: { x: 0.92, y: 0.38 }, rotation: 180, status: "keep" },
    { furnitureId: "dining-table", roomId: "living", position: { x: 2.3, y: 2 }, rotation: 90, status: "new", overrideName: "Drop-leaf Table", overrideDimensions: { width: 0.89, depth: 0.6, height: 0.75 } },
  ],
};

const hostAndDinePlan: LayoutPlan = {
  id: "space",
  name: "Plan C",
  shortName: "Host & Dine",
  description: "Protects a real four-seat dining zone while preserving minimum daily circulation.",
  reused: 2,
  purchases: 1,
  openArea: 6.9,
  cost: 1880,
  spendingAvoided: 5300,
  walkwayClearance: 72,
  score: 87,
  placements: [
    { furnitureId: "sofa", roomId: "living", position: { x: 0.15, y: 0.2 }, rotation: 270, status: "keep" },
    { furnitureId: "bookshelf", roomId: "living", position: { x: 3.45, y: 0.25 }, rotation: 90, status: "keep" },
    { furnitureId: "dining-table", roomId: "living", position: { x: 2.15, y: 1.7 }, rotation: 90, status: "new", overrideName: "Extendable Table", overrideDimensions: { width: 1.2, depth: 0.75, height: 0.75 } },
  ],
};

export const objectiveConfigs: Record<DemoObjective, ObjectiveConfig> = {
  keep: {
    id: "keep",
    label: "Reuse & Relax",
    shortLabel: "Reuse & Relax",
    description: "Keep familiar lounge pieces while balancing light work and casual meals.",
    rule: "Reuse at least 5 of 6 items while protecting an 82 cm circulation route.",
    plan: demoPlans[0],
    preview: "/photos/final-reuse-relax.png",
    previewAlt: "Your compact new home balanced for relaxing, light work and casual meals",
    outcome: "Five familiar pieces stay, with room to relax, work lightly and share a casual meal.",
    decision: "The sofa, coffee table, desk and storage stay. A compact folding table restores the main route.",
    recommendation: {
      name: "Compact Folding Table",
      dimensions: "89 × 60 cm",
      price: "HK$1,290",
      image: "/photos/recommend-folding-table.webp",
      reason: "Cuts the table footprint by 47%, lifts walking clearance from 43 to 82 cm, and folds down when not in use.",
      replaces: "140 × 80 cm dining table",
    },
  },
  host: {
    id: "host",
    label: "Host & Dine",
    shortLabel: "Host & Dine",
    description: "Give shared meals a real four-seat dining zone without blocking the home.",
    rule: "Fit four dining seats while maintaining at least 70 cm of daily circulation.",
    plan: hostAndDinePlan,
    preview: "/photos/final-host-and-dine.png",
    previewAlt: "Your compact new home organized around a four-seat dining table",
    outcome: "A proper four-seat dining zone becomes the centre of the home.",
    decision: "The coffee table and main-room desk leave the plan so dining can take priority without blocking the entrance.",
    recommendation: {
      name: "Compact Extendable Dining Table",
      dimensions: "120 × 75 cm",
      price: "HK$1,880",
      image: "/photos/furniture-dining-table.webp",
      reason: "Seats four at 20 cm less width than the old table and preserves a verified 72 cm entrance route.",
      replaces: "140 × 80 cm dining table",
    },
  },
  work: {
    id: "work",
    label: "Work From Home",
    shortLabel: "Work From Home",
    description: "Give the desk first claim on natural light and preserve a calm work zone.",
    rule: "Desk within 0.6 m of a window, with a 76 cm route behind the chair.",
    plan: workFromHomePlan,
    preview: "/photos/final-work-from-home.png",
    previewAlt: "Your compact new home with a dedicated naturally lit work-from-home zone",
    previewPosition: "56% 50%",
    outcome: "The desk takes the brightest wall while dining folds away after use.",
    decision: "Four existing pieces stay. A full desk gets daylight and the compact drop-leaf table keeps meals flexible.",
    recommendation: {
      name: "Compact Drop-leaf Table",
      dimensions: "89 × 60 cm",
      price: "HK$1,290",
      image: "/photos/recommend-folding-table.webp",
      reason: "Folds down after meals so the desk chair retains a 76 cm working and circulation zone.",
      replaces: "140 × 80 cm dining table",
    },
  },
};

export const objectiveOrder: DemoObjective[] = ["keep", "work", "host"];
