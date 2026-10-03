"use client";

import { motion } from 'framer-motion';
import { useReducedMotion } from '@/lib/use-reduced-motion';
import { useId } from "react";
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
  focusMainSpace?: boolean;
}

const statusStyle: Record<FurnitureStatus, { fill: string; stroke: string; icon: typeof Check }> = {
  keep: { fill: "var(--surface)", stroke: "var(--stone)", icon: Check },
  move: { fill: "var(--warning-soft)", stroke: "var(--warning)", icon: MoveUpRight },
  replace: { fill: "var(--danger-soft)", stroke: "var(--danger)", icon: RefreshCw },
  new: { fill: "var(--success-soft)", stroke: "var(--accent)", icon: Plus },
  sell: { fill: "var(--surface)", stroke: "var(--clay)", icon: ShoppingBag },
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
  if (category === "bed") return <>
    <rect x={x + 5} y={y + 5} width={Math.max(14, width - 10)} height={Math.max(12, depth - 10)} rx="4" />
    <line x1={x + 5} y1={y + depth * .34} x2={x + width - 5} y2={y + depth * .34} />
    <rect x={x + 10} y={y + 9} width={Math.max(12, width * .3)} height={Math.max(8, depth * .16)} rx="3" />
    <rect x={x + width - Math.max(12, width * .3) - 10} y={y + 9} width={Math.max(12, width * .3)} height={Math.max(8, depth * .16)} rx="3" />
  </>;
  if (category === "sofa") return <>
    <rect x={x + 7} y={y + 7} width={Math.max(14, width - 14)} height={Math.max(10, depth - 14)} rx="5" />
    <line x1={x + 7} y1={y + depth * .7} x2={x + width - 7} y2={y + depth * .7} />
    <line x1={x + width / 2} y1={y + 7} x2={x + width / 2} y2={y + depth - 7} />
    <line x1={x + 12} y1={y + 7} x2={x + 12} y2={y + depth - 7} />
    <line x1={x + width - 12} y1={y + 7} x2={x + width - 12} y2={y + depth - 7} />
  </>;
  if (category === "table") return <>
    <rect x={x + 6} y={y + 6} width={Math.max(10, width - 12)} height={Math.max(10, depth - 12)} rx="4" />
    <circle cx={x + 11} cy={y + 10} r="2.2" /><circle cx={x + width - 11} cy={y + 10} r="2.2" />
    <circle cx={x + 11} cy={y + depth - 10} r="2.2" /><circle cx={x + width - 11} cy={y + depth - 10} r="2.2" />
  </>;
  if (category === "desk") return <>
    <line x1={x + 7} y1={y + depth * .35} x2={x + width - 7} y2={y + depth * .35} />
    <rect x={x + width * .35} y={y + 6} width={Math.max(14, width * .3)} height={Math.max(7, depth * .2)} rx="2" />
    <line x1={x + width / 2} y1={y + depth * .2} x2={x + width / 2} y2={y + depth * .35} />
    <circle cx={x + width / 2} cy={y + depth * .72} r={Math.max(4, Math.min(7, depth * .14))} />
  </>;
  return <>
    <line x1={x + width / 3} y1={y + 5} x2={x + width / 3} y2={y + depth - 5} />
    <line x1={x + width * .66} y1={y + 5} x2={x + width * .66} y2={y + depth - 5} />
    <line x1={x + 5} y1={y + depth / 2} x2={x + width - 5} y2={y + depth / 2} />
  </>;
}

export function FloorPlan({ mode, plan, selectedId, onSelect, showWalkway = false, scanning = false, compact = false, trialProduct, focusMainSpace = false }: FloorPlanProps) {
  const id = useId().replace(/:/g, "");
  const reducedMotion = useReducedMotion();
  const isOld = mode === "old";
  const scale = isOld ? 70 : 85;
  const origins = isOld
    ? { living: { x: 38, y: 48 }, bedroom: { x: 388, y: 48 } }
    : { living: { x: 38, y: 48 }, bedroom: { x: 420, y: 48 } };
  const placements: Placement[] = isOld ? oldPlacements : plan?.placements ?? [];
  const walkwayClearance = plan?.walkwayClearance ?? 82;
  const walkwayPasses = walkwayClearance >= 70;
  const walkwayPath = plan?.id === "space"
    ? "M 355 287 C 302 250, 265 208, 249 163 C 231 112, 306 91, 374 108"
    : plan?.id === "cost"
      ? "M 355 287 C 315 271, 300 247, 289 219 C 270 171, 312 139, 370 128"
      : "M 355 287 C 287 264, 255 218, 239 171 C 219 113, 300 92, 370 112";

  return (
    <div className={`floor-plan-wrap ${compact ? "is-compact" : ""} ${scanning ? "is-scanning" : ""}`}>
      <svg viewBox={focusMainSpace && !isOld ? "0 0 408 335" : "0 0 750 370"} role={onSelect ? "group" : "img"} aria-label={`${isOld ? "Old" : "New"} home floor plan`}>
        <defs>
          <pattern id={`grid-${id}`} width="17" height="17" patternUnits="userSpaceOnUse"><path d="M 17 0 L 0 0 0 17" fill="none" stroke="#dfe4df" strokeWidth=".65" /></pattern>
          <pattern id={`living-floor-${id}`} width="96" height="48" patternUnits="userSpaceOnUse"><image href="/photos/oak-floor.webp" width="96" height="48" preserveAspectRatio="none" /><path d="M 0 12 H 96 M 0 24 H 96 M 0 36 H 96 M 0 48 H 96 M 48 0 V 12 M 24 12 V 24 M 72 24 V 36 M 36 36 V 48" stroke="var(--stone)" opacity=".35" strokeWidth=".4" /></pattern>
          <pattern id={`bedroom-floor-${id}`} width="96" height="48" patternUnits="userSpaceOnUse"><image href="/photos/oak-floor.webp" width="96" height="48" preserveAspectRatio="none" /><path d="M 0 12 H 96 M 0 24 H 96 M 0 36 H 96" stroke="var(--stone)" opacity=".4" strokeWidth=".4" /></pattern>
          <filter id={`selected-shadow-${id}`} x="-30%" y="-30%" width="160%" height="160%"><feDropShadow dx="0" dy="4" stdDeviation="4" floodColor="#1f3d32" floodOpacity=".25" /></filter>
          <filter id={`furniture-shadow-${id}`} x="-20%" y="-20%" width="140%" height="150%"><feDropShadow dx="0" dy="2" stdDeviation="1.6" floodColor="#26312d" floodOpacity=".16" /></filter>
        </defs>
        <rect className="plan-sheet" x="0" y="0" width="750" height="370" />
        <rect className="plan-grid" x="16" y="18" width="718" height="334" fill={`url(#grid-${id})`} />
        <g className="floor-title">
          <text x="22" y="33">{isOld ? "EXISTING HOME · AS-BUILT INVENTORY" : "NEW HOME · VERIFIED PLACEMENT PLAN"}</text>
          {!focusMainSpace ? <text x="728" y="33" textAnchor="end">{isOld ? "KOWLOON · 380 SQ FT" : "NORTHERN METROPOLIS · 310 SQ FT"}</text> : null}
        </g>

        {isOld ? (
          <>
            <g className="room-outline">
              <rect className="living-room" x="38" y="48" width={4.5 * scale} height={3.4 * scale} fill={`url(#living-floor-${id})`} />
              <rect className="bedroom-room" x="388" y="48" width={4 * scale} height={3.2 * scale} fill={`url(#bedroom-floor-${id})`} />
            </g>
            <g className="room-label-block"><rect x="49" y="57" width="132" height="22" rx="3" /><text x="59" y="72" className="room-label">LIVING AREA · 4.5 × 3.4 M</text></g>
            <g className="room-label-block"><rect x="399" y="57" width="150" height="22" rx="3" /><text x="409" y="72" className="room-label">MAIN BEDROOM · 4.0 × 3.2 M</text></g>
            <line x1="95" y1="48" x2="235" y2="48" className="window-line" />
            <line x1="95" y1="48" x2="235" y2="48" className="window-line-inner" />
            <path d="M 352 286 L 352 232 A 54 54 0 0 1 406 286" className="door-swing" />
          </>
        ) : (
          <>
            <g className="room-outline">
              <rect className="living-room" x="38" y="48" width={3.9 * scale} height={3.1 * scale} fill={`url(#living-floor-${id})`} />
              {!focusMainSpace ? <>
                <rect className="bedroom-room" x="420" y="48" width={3.35 * scale} height={2.85 * scale} fill={`url(#bedroom-floor-${id})`} />
                <rect x="420" y="302" width="122" height="50" className="utility-room" />
                <rect x="542" y="302" width="106" height="50" className="utility-room" />
              </> : null}
            </g>
            <g className="room-label-block"><rect x="49" y="57" width="139" height="22" rx="3" /><text x="59" y="72" className="room-label">{focusMainSpace ? "PLANNED SPACE" : "LIVING ROOM"} · 3.9 × 3.1 M</text></g>
            {!focusMainSpace ? <>
              <g className="room-label-block"><rect x="431" y="57" width="146" height="22" rx="3" /><text x="441" y="72" className="room-label">BEDROOM · 3.35 × 2.85 M</text></g>
              <text x="459" y="332" className="utility-label">KITCHEN</text>
              <text x="578" y="332" className="utility-label">BATH</text>
              <g className="utility-fixtures">
                <rect x="428" y="310" width="43" height="11" rx="2" /><rect x="479" y="310" width="53" height="11" rx="2" />
                <circle cx="449" cy="315.5" r="3.5" /><rect x="555" y="311" width="29" height="16" rx="7" /><rect x="600" y="310" width="38" height="30" rx="3" />
              </g>
            </> : null}
            <line x1="94" y1="48" x2="282" y2="48" className="window-line" />
            <line x1="94" y1="48" x2="282" y2="48" className="window-line-inner" />
            {!focusMainSpace ? <>
              <line x1="705" y1="96" x2="705" y2="205" className="window-line" />
              <line x1="705" y1="96" x2="705" y2="205" className="window-line-inner" />
            </> : null}
            <path d="M 371 298 L 314 298 A 57 57 0 0 0 371 241" className="door-swing" />
            {!focusMainSpace ? <path d="M 420 255 L 471 255 A 51 51 0 0 1 420 204" className="door-swing" /> : null}
            {showWalkway ? (
              <g className={`walkway ${walkwayPasses ? "" : "is-blocked"}`}>
                <motion.path key={plan?.id} initial={false} animate={{ pathLength: 1 }} transition={{ duration: reducedMotion ? 0 : .28 }} d={walkwayPath} />
                <rect x="226" y="200" width="131" height="25" rx="3" />
                <text x="291" y="216">{walkwayClearance} cm clearance {walkwayPasses ? "✓" : "×"}</text>
              </g>
            ) : null}
          </>
        )}

        {placements.filter((placement) => !focusMainSpace || placement.roomId === "living").map((placement, index) => {
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
              initial={false}
              animate={{ opacity: 1, scale: 1, x, y }}
              transition={{ delay: scanning ? index * .34 : index * .035, duration: reducedMotion ? 0 : .28 }}
              onClick={() => onSelect?.(placement.furnitureId)}
              onKeyDown={(event) => {
                if (onSelect && (event.key === "Enter" || event.key === " ")) { event.preventDefault(); onSelect(placement.furnitureId); }
              }}
              className={`furniture-object furniture-${item.category} ${onSelect ? "furniture-selectable" : ""}`}
              role={onSelect ? "button" : undefined}
              tabIndex={onSelect ? 0 : undefined}
              aria-label={onSelect ? `Inspect ${label}` : undefined}
              filter={selected ? `url(#selected-shadow-${id})` : `url(#furniture-shadow-${id})`}
            >
              {selected ? <rect className="clearance-outline" x={-6} y={-6} width={width + 12} height={depth + 12} rx="10" /> : null}
              <rect
                x={0}
                y={0}
                width={width}
                height={depth}
                rx={item.category === "sofa" ? 5 : 2} fill={item.category === "table" || item.category === "desk" ? "var(--material-oak)" : item.category === "sofa" ? "var(--material-linen)" : style.fill} stroke={selected ? "var(--accent)" : "var(--material-edge)"} strokeWidth={selected ? 1.8 : .7}
              />
              <g className="furniture-glyph"><FurnitureGlyph category={item.category} x={0} y={0} width={width} depth={depth} /></g>
              <title>{`${label} · ${Math.round(rawDimensions.width * 100)} × ${Math.round(rawDimensions.depth * 100)} cm`}</title>
              {selected ? <text x={width / 2} y={depth + 13} className="furniture-label">{label}</text> : null}

            </motion.g>
          );
        })}

        {trialProduct && !isOld ? (
          <motion.g className="trial-furniture" initial={{ opacity: 0, scale: .55 }} animate={{ opacity: 1, scale: 1 }} transition={{ type: "spring", delay: .2 }} filter={`url(#furniture-shadow-${id})`}>
            <rect x={origins.living.x + 2.73 * scale} y={origins.living.y + 2.17 * scale} width={trialProduct.width * scale} height={trialProduct.depth * scale} rx="7" fill="#dceaf2" stroke="#315d4c" strokeWidth="3" />
            <g className="furniture-glyph"><FurnitureGlyph category="table" x={origins.living.x + 2.73 * scale} y={origins.living.y + 2.17 * scale} width={trialProduct.width * scale} depth={trialProduct.depth * scale} /></g>
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
