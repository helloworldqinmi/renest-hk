"use client";

import { useEffect, useState } from "react";
import { ArrowRight, Check, RefreshCw } from "lucide-react";
import { Modal, Button } from "@/components/common/ui";

const items = [
  ["Double Bed", "KEEP"], ["Study Desk", "KEEP"], ["Wardrobe", "KEEP"],
  ["2-seat Sofa", "KEEP"], ["Bookshelf", "KEEP"], ["Coffee Table", "KEEP"], ["Dining Table", "SELL / REPLACE"],
];

export function MigrationAnimation({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [active, setActive] = useState(0);

  useEffect(() => {
    if (!open) return;
    setActive(0);
    const timers = items.map((_, index) => window.setTimeout(() => setActive(index + 1), 360 + index * 430));
    return () => timers.forEach(window.clearTimeout);
  }, [open]);

  return (
    <Modal open={open} onClose={onClose} title="See what moves" wide fullScreen>
      <div className="migration-scene">
        <div className="migration-home old"><span>OLD HOME</span><b>Kowloon</b><div className="mini-rooms"><i /><i /><i /></div></div>
        <div className="migration-lane">
          {items.map(([name, status], index) => (
            <div className={`migration-item ${index < active ? "has-moved" : ""} ${status === "REPLACE" ? "replace" : ""}`} key={name} style={{ top: 14 + index * 12 + "%" }}>
              <span>{name}</span><ArrowRight size={13} /><b>{status === "KEEP" ? <Check size={13} /> : <RefreshCw size={13} />}{status}</b>
            </div>
          ))}
        </div>
        <div className="migration-home new"><span>NEW HOME</span><b>Northern Metropolis</b><div className="mini-rooms"><i /><i /><i /></div></div>
      </div>
      <div className="migration-summary" aria-live="polite">
        {active >= items.length ? (
          <>
            <div><strong>6</strong><span>items move with you.</span></div>
            <div><strong>1</strong><span>item finds a new owner.</span></div>
            <div><strong>1</strong><span>better-sized replacement is needed.</span></div>
            <Button onClick={onClose}>Continue with this plan</Button>
          </>
        ) : <span className="analyzing-dots">Mapping item {active + 1} of {items.length}<span>...</span></span>}
      </div>
    </Modal>
  );
}
