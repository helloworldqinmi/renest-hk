"use client";

import Image from "next/image";
import { useState } from "react";
import { Map, ScanLine, ArrowUp } from "lucide-react";
import { FloorPlan } from "./floor-plan";
import type { LayoutPlan } from "@/types";
import styles from "./spatial-canvas.module.css";

const hotspots = [
  { id: "sofa", label: "Sofa", left: 19, top: 37, width: 33, height: 15 },
  { id: "coffee-table", label: "Coffee table", left: 30, top: 51, width: 18, height: 12 },
  { id: "dining-table", label: "Dining table", left: 22, top: 21, width: 26, height: 13 },
  { id: "bookshelf", label: "Bookshelf", left: 66, top: 10, width: 12, height: 13 },
  { id: "desk", label: "Study desk", left: 70, top: 26, width: 11, height: 19 },
];

/** A photographic room study complements the interactive, dimensioned plan. */
export function SpatialCanvas({ plan, selectedId, onSelect, initialView = "room", showToolbar = true, focusMainSpace = false }: {
  plan: LayoutPlan;
  selectedId?: string | null;
  onSelect?: (id: string) => void;
  initialView?: "room" | "measured";
  showToolbar?: boolean;
  focusMainSpace?: boolean;
}) {
  const [view, setView] = useState(initialView);
  return (
    <div className={styles.canvas}>
      {showToolbar ? <div className={styles.toolbar}>
        <span>LIVING SPACE</span>
        <div role="group" aria-label="Spatial view">
          <button type="button" aria-pressed={view === "room"} onClick={() => setView("room")}><ScanLine size={13} /> Room study</button>
          <button type="button" aria-pressed={view === "measured"} onClick={() => setView("measured")}><Map size={13} /> Measured plan</button>
        </div>
      </div> : null}
      {view === "room" ? <div className={styles.room}>
        <div className={styles.photograph}>
          <Image src="/photos/spatial-room.webp" alt="Architectural room study with the familiar linen sofa, oak table, bookshelf and window-side desk" fill sizes="(max-width: 760px) 90vw, 490px" />
          {onSelect ? hotspots.map((spot) => <button key={spot.id} type="button" aria-label={`Inspect ${spot.label} in room study`} aria-pressed={selectedId === spot.id} className={styles.hotspot} style={{left: `${spot.left}%`, top: `${spot.top}%`, width: `${spot.width}%`, height: `${spot.height}%`}} onClick={() => onSelect(spot.id)}><span>{spot.label}</span></button>) : null}
        </div>
        <span className={styles.north}>N<ArrowUp size={24} strokeWidth={1} /></span>
        <p className={styles.note}>Room study · see measured plan for exact placement</p>
      </div> : <div className={styles.measured} tabIndex={0} role="region" aria-label="Measured floor plan. Scroll horizontally on a small screen to inspect all rooms."><FloorPlan mode="new" plan={plan} selectedId={selectedId} onSelect={onSelect} showWalkway focusMainSpace={focusMainSpace} /></div>}
    </div>
  );
}
