"use client";

import { motion } from "framer-motion";
import { Check, MoveUpRight, Plus, RefreshCw, ShoppingBag, X } from "lucide-react";
import { furnitureInventory } from "@/lib/demo-data";
import type { FurnitureStatus, LayoutPlan, MarketplaceProduct, Placement } from "@/types";
import { rotatedDimensions } from "@/lib/geometry";

interface FloorPlanProps {
  mode: "old" | "new";
  plan?: LayoutPlan;
  selectedId?: string | null;
  onSelect?: (id: string) => void;
  showWalkway?: boolean;
  scanning?: boolean;
  compact?: boolean;
  trialProduct?: MarketplaceProduct | null;
}

const statusStyle: Record<FurnitureStatus, { fill: string; stroke: string; icon: typeof Check }> = {
  keep: { fill: "#dceee5", stroke: "#315d4c", icon: Check },
  move: { fill: "#fff1d7", stroke: "#a37017", icon: MoveUpRight },
  replace: { fill: "#fae9e4", stroke: "#b5503a", icon: RefreshCw },
  new: { fill: "#dceaf2", stroke: "#426c80", icon: Plus },
  sell: { fill: "#f3e8ef", stroke: "#79516b", icon: ShoppingBag },
};

const oldPlacements: Placement[] = [
  { furnitureId: "sofa", roomId: "living", position: { x: 0.2, y: 0.2 }, rotation: 0, status: "keep" },
  { furnitureId: "coffee-table", roomId: "living", position: { x: 1.0, y: 1.45 }, rotation: 0, status: "keep" },
  { furnitureId: "dining-table", roomId: "living", position: { x: 2.8, y: 2.25 }, rotation: 0, status: "keep" },
  { furnitureId: "bookshelf", roomId: "living", position: { x: 4.05, y: 0.2 }, rotation: 90, status: "keep" },
  { furnitureId: "bed", roomId: "bedroom", position: { x: 0.25, y: 1.55 }, rotation: 0, status: "keep" },
  { furnitureId: "desk", roomId: "bedroom", position: { x: 2.5, y: 0.2 }, rotation: 0, status: "keep" },
  { furnitureId: "wardrobe", roomId: "bedroom", position: { x: 0.25, y: 0.25 }, rotation: 0, status: "keep" },
];

function FurnitureGlyph({ category, x, y, width, depth }: { category: string; x: number; y: number; width: number; depth: number }) {
  if (category === "bed") return <><line x1={x + 8} y1={y + depth * .35} x2={x + width - 8} y2={y + depth * .35} /><rect x={x + 8} y={y + 7} width={Math.max(14, width * .34)} height={Math.max(9, depth * .21)} rx="3" /></>;
  if (category === "sofa") return <><line x1={x + 8} y1={y + depth * .7} x2={x + width - 8} y2={y + depth * .7} /><line x1={x + width / 2} y1={y + 5} x2={x + width / 2} y2={y + depth - 5} /></>;
  if (category === "table") return <><circle cx={x + 10} cy={y + 9} r="2.4" /><circle cx={x + width - 10} cy={y + 9} r="2.4" /><circle cx={x + 10} cy={y + depth - 9} r="2.4" /><circle cx={x + width - 10} cy={y + depth - 9} r="2.4" /></>;
  if (category === "desk") return <line x1={x + 8} y1={y + depth * .38} x2={x + width - 8} y2={y + depth * .38} />;
  return <line x1={x + width / 2} y1={y + 5} x2={x + width / 2} y2={y + depth - 5} />;
}

export function FloorPlan({ mode, plan, selectedId, onSelect, showWalkway = false, scanning = false, compact = false, trialProduct }: FloorPlanProps) {
  const isOld = mode === "old";
  const scale = isOld ? 70 : 85;
  const origins = isOld
    ? { living: { x: 38, y: 48 }, bedroom: { x: 388, y: 48 } }
    : { living: { x: 38, y: 48 }, bedroom: { x: 420, y: 48 } };
  const placements: Placement[] = isOld ? oldPlacements : plan?.placements ?? [];

  return (
    <div className={`floor-plan-wrap ${compact ? "is-compact" : ""} ${scanning ? "is-scanning" : ""}`}>
      <svg viewBox="0 0 750 370" role="img" aria-label={`${isOld ? "Old" : "New"} home floor plan`}>
        <defs>
          <pattern id={`grid-${mode}`} width="17" height="17" patternUnits="userSpaceOnUse"><path d="M 17 0 L 0 0 0 17" fill="none" stroke="#e7eae6" strokeWidth=".7" /></pattern>
          <filter id="selected-shadow" x="-30%" y="-30%" width="160%" height="160%"><feDropShadow dx="0" dy="4" stdDeviation="4" floodColor="#1f3d32" floodOpacity=".25" /></filter>
        </defs>
        <rect x="0" y="0" width="750" height="370" fill="#fbfcfa" />
        <rect x="16" y="18" width="718" height="334" fill={`url(#grid-${mode})`} />

        {isOld ? (
          <>
            <g className="room-outline">
              <rect x="38" y="48" width={4.5 * scale} height={3.4 * scale} />
              <rect x="388" y="48" width={4 * scale} height={3.2 * scale} />
            </g>
            <text x="52" y="75" className="room-label">LIVING AREA · 4.5 × 3.4 M</text>
            <text x="402" y="75" className="room-label">MAIN BEDROOM · 4.0 × 3.2 M</text>
            <line x1="95" y1="48" x2="235" y2="48" className="window-line" />
            <path d="M 352 286 L 352 232 A 54 54 0 0 1 406 286" className="door-swing" />
          </>
        ) : (
          <>
            <g className="room-outline">
              <rect x="38" y="48" width={3.9 * scale} height={3.1 * scale} />
              <rect x="420" y="48" width={3.35 * scale} height={2.85 * scale} />
              <rect x="420" y="302" width="122" height="50" className="utility-room" />
              <rect x="542" y="302" width="106" height="50" className="utility-room" />
            </g>
            <text x="52" y="75" className="room-label">LIVING ROOM · 3.9 × 3.1 M</text>
            <text x="434" y="75" className="room-label">BEDROOM · 3.35 × 2.85 M</text>
            <text x="459" y="332" className="utility-label">KITCHEN</text>
            <text x="578" y="332" className="utility-label">BATH</text>
            <line x1="94" y1="48" x2="282" y2="48" className="window-line" />
            <line x1="705" y1="96" x2="705" y2="205" className="window-line" />
            <path d="M 371 298 L 314 298 A 57 57 0 0 0 371 241" className="door-swing" />
            <path d="M 420 255 L 471 255 A 51 51 0 0 1 420 204" className="door-swing" />
            {showWalkway ? (
              <g className="walkway">
                <motion.path initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 1.1 }} d="M 355 287 C 287 264, 255 218, 239 171 C 219 113, 300 92, 370 112" />
                <rect x="207" y="202" width="150" height="30" rx="15" />
                <text x="282" y="221">Minimum clearance: 74 cm ✓</text>
              </g>
            ) : null}
          </>
        )}

        {placements.map((placement, index) => {
          if (trialProduct && placement.furnitureId === "dining-table") return null;
          const item = furnitureInventory.find((candidate) => candidate.id === placement.furnitureId);
          if (!item) return null;
          const origin = origins[placement.roomId];
          const rawDimensions = placement.overrideDimensions ?? item.dimensions;
          const dimensions = rotatedDimensions(rawDimensions, placement.rotation);
          const width = dimensions.width * scale;
          const depth = dimensions.depth * scale;
          const x = origin.x + placement.position.x * scale;
          const y = origin.y + placement.position.y * scale;
          const status = placement.status as FurnitureStatus;
          const style = statusStyle[status];
          const selected = selectedId === placement.furnitureId;
          const label = placement.overrideName ?? item.name;
          return (
            <motion.g
              key={placement.furnitureId}
              initial={{ opacity: 0, scale: .92, x, y }}
              animate={{ opacity: 1, scale: 1, x, y }}
              transition={{ delay: scanning ? index * .34 : index * .035, duration: .42 }}
              onClick={() => onSelect?.(placement.furnitureId)}
              className={onSelect ? "furniture-selectable" : ""}
              filter={selected ? "url(#selected-shadow)" : undefined}
            >
              <rect
                x={0}
                y={0}
                width={width}
                height={depth}
                rx="7" fill={style.fill} stroke={selected ? "#16201d" : style.stroke} strokeWidth={selected ? 3 : 1.5}
              />
              <g className="furniture-glyph"><FurnitureGlyph category={item.category} x={0} y={0} width={width} depth={depth} /></g>
              <text x={width / 2} y={depth / 2 + 3} className="furniture-label">{label.length > 19 ? label.split(" ")[0] : label}</text>
              {!isOld ? <text x={5} y={depth - 6} className="furniture-status">{status.toUpperCase()}</text> : null}
            </motion.g>
          );
        })}

        {trialProduct && !isOld ? (
          <motion.g initial={{ opacity: 0, scale: .55 }} animate={{ opacity: 1, scale: 1 }} transition={{ type: "spring", delay: .2 }}>
            <rect x={origins.living.x + 2.73 * scale} y={origins.living.y + 2.17 * scale} width={trialProduct.width * scale} height={trialProduct.depth * scale} rx="7" fill="#dceaf2" stroke="#315d4c" strokeWidth="3" />
            <text x={origins.living.x + 3.18 * scale} y={origins.living.y + 2.48 * scale} className="furniture-label">TRY-IN TABLE</text>
          </motion.g>
        ) : null}

        {scanning ? <g className="scan-overlay"><line x1="24" x2="726" y1="185" y2="185" /><circle cx="258" cy="132" r="3" /><circle cx="552" cy="218" r="3" /><circle cx="166" cy="276" r="2" /></g> : null}
      </svg>
      <div className="plan-compass"><span>N</span><i /></div>
      {!isOld && !compact ? (
        <div className="floor-legend">
          <span><i className="keep" />Keep</span><span><i className="new" />New</span><span><i className="replace" />Replace / sell</span>
        </div>
      ) : null}
    </div>
  );
}
