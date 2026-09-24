"use client";

import { useEffect, useState } from "react";
import { ArrowRight, Check, RefreshCw } from "lucide-react";
import { Modal, Button } from "@/components/common/ui";

const items = [
  ["Double Bed", "KEEP"], ["Study Desk", "KEEP"], ["Wardrobe", "KEEP"],
  ["2-seat Sofa", "KEEP"], ["Bookshelf", "KEEP"], ["Coffee Table", "KEEP"], ["Dining Table", "REPLACE"],
];

export function MigrationAnimation({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [active, setActive] = useState(0);

  useEffect(() => {
    if (!open) return;
    setActive(0);
    const interval = window.setInterval(() => setActive((current) => Math.min(items.length, current + 1)), 520);
    return () => window.clearInterval(interval);
  }, [open]);

  return (
    <Modal open={open} onClose={onClose} title="Your furniture has somewhere to go" wide>
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
      <div className="migration-summary">
        <div><strong>{Math.min(active, 6)}</strong><span>items coming with you</span></div>
        <div><strong>{active >= 7 ? 1 : 0}</strong><span>better-sized replacement</span></div>
        {active >= 7 ? <Button onClick={onClose}>Continue with this plan</Button> : <span className="analyzing-dots">Planning the move<span>...</span></span>}
      </div>
    </Modal>
  );
}
