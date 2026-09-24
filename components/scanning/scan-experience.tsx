"use client";

import { useEffect, useRef, useState } from "react";
import { CheckCircle2, FileJson, Radar, ScanLine, Smartphone } from "lucide-react";
import { FloorPlan } from "@/components/floor-plan/floor-plan";
import { Button, Eyebrow, LinkButton } from "@/components/common/ui";
import { plans } from "@/lib/demo-data";
import { parseRoomPlanJSON } from "@/lib/roomplan";

const oldEvents = [
  ["SOFA DETECTED", "204 × 88 cm"],
  ["DESK DETECTED", "120 × 60 cm"],
  ["BED DETECTED", "190 × 135 cm"],
  ["7 ITEMS MAPPED", "Dimensions verified"],
];

const newEvents = [
  ["ROOM BOUNDARY", "29.1 m² mapped"],
  ["WINDOWS DETECTED", "2 natural light sources"],
  ["DOOR SWINGS", "Clearance zones mapped"],
  ["USABLE WALLS", "8.4 m available"],
];

export function ScanExperience({ kind }: { kind: "old" | "new" }) {
  const [phase, setPhase] = useState<"idle" | "scanning" | "complete">("idle");
  const [eventIndex, setEventIndex] = useState(0);
  const [uploadNote, setUploadNote] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);
  const events = kind === "old" ? oldEvents : newEvents;

  useEffect(() => {
    if (phase !== "scanning") return;
    const timers = [850, 1750, 2750, 3700].map((delay, index) => window.setTimeout(() => setEventIndex(index), delay));
    timers.push(window.setTimeout(() => setPhase("complete"), 4550));
    return () => timers.forEach(window.clearTimeout);
  }, [phase]);

  function start() {
    setEventIndex(0);
    setUploadNote("");
    setPhase("scanning");
  }

  function handleFile(file?: File) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const room = parseRoomPlanJSON(String(reader.result));
        setUploadNote(`${room.furniture.length} objects normalized from ${file.name}`);
        setPhase("complete");
      } catch {
        setUploadNote("That file is not a supported RoomPlan JSON export.");
      }
    };
    reader.readAsText(file);
  }

  const title = kind === "old" ? "First, let's understand what you already own." : "Now let's understand your new space.";
  const subtitle = kind === "old"
    ? "Scan your room with your iPhone. ReSpace detects room geometry and furniture dimensions automatically."
    : "Map the rooms, doors, windows and usable wall areas before a single item is placed.";

  return (
    <main className="page-shell scan-page">
      <div className="page-head">
        <div className="page-head-copy">
          <Eyebrow>{kind === "old" ? "Step 1 · Old home" : "Step 2 · New home"}</Eyebrow>
          <h1>{title}</h1>
          <p>{subtitle}</p>
        </div>
        <div className="compatibility"><Smartphone size={18} /><span><b>iPhone LiDAR</b>RoomPlan compatible</span></div>
      </div>

      {kind === "new" ? (
        <div className="new-home-strip">
          <div><span>NEW HOME</span><strong>Northern Metropolis</strong></div>
          <div><span>SIZE</span><strong>310 sq ft</strong></div>
          <div><span>TYPE</span><strong>1-bedroom apartment</strong></div>
        </div>
      ) : null}

      <section className="scan-stage card">
        <div className="scan-visual">
          <FloorPlan mode={kind === "old" ? "old" : "new"} plan={plans[0]} scanning={phase === "scanning"} compact />
          {phase === "idle" ? (
            <div className="scan-idle-overlay"><Radar size={34} /><span>Ready to capture</span></div>
          ) : null}
          {phase === "scanning" ? (
            <div className="detection-toast">
              <ScanLine size={18} />
              <span><b>{events[eventIndex][0]}</b>{events[eventIndex][1]}</span>
            </div>
          ) : null}
          {phase === "complete" ? (
            <div className="scan-complete-overlay"><CheckCircle2 size={33} /><span><b>{kind === "old" ? "Scan complete" : "New home mapped"}</b>{uploadNote || (kind === "old" ? "7 furniture items detected" : "29.1 m² available")}</span></div>
          ) : null}
        </div>
        <div className="scan-control">
          <div>
            <span className="scan-kicker">{phase === "idle" ? "WEB DEMO CAPTURE" : phase === "scanning" ? `ANALYZING · ${Math.round(((eventIndex + 1) / 4) * 100)}%` : "CAPTURE VERIFIED"}</span>
            <h2>{phase === "idle" ? (kind === "old" ? "Use Alex's demo scan" : "Scan the new apartment") : phase === "scanning" ? "Building a spatial model" : "Ready for the next step"}</h2>
            <p>{phase === "idle" ? "A deterministic RoomPlan-style capture keeps the live demo reliable." : phase === "scanning" ? "Depth points are being normalized into room geometry and measurable objects." : "The scan is now in the same normalized format used by the planning engine."}</p>
          </div>
          {phase === "idle" ? (
            <div className="scan-buttons">
              <Button onClick={start} icon={ScanLine}>Use Demo Scan</Button>
              {kind === "old" ? <Button variant="secondary" icon={FileJson} onClick={() => fileRef.current?.click()}>Upload RoomPlan JSON</Button> : null}
              <input ref={fileRef} type="file" accept=".json,application/json" hidden onChange={(event) => handleFile(event.target.files?.[0])} />
              {uploadNote ? <p className="upload-note">{uploadNote}</p> : null}
            </div>
          ) : phase === "scanning" ? (
            <div className="scan-progress"><i><span style={{ width: `${(eventIndex + 1) * 25}%` }} /></i><small>Keep the device moving slowly</small></div>
          ) : (
            <LinkButton href={kind === "old" ? "/inventory" : "/preferences"}>{kind === "old" ? "Review my furniture" : "Plan my space"}</LinkButton>
          )}
        </div>
      </section>
    </main>
  );
}
