"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { CheckCircle2, FileJson, Radar, ScanLine, Smartphone } from "lucide-react";
import { useDemo } from "@/components/state-provider";
import { Button, Eyebrow, LinkButton } from "@/components/common/ui";
import { demoScenario } from "@/lib/demo-data";
import { parseRoomPlanJSON } from "@/lib/roomplan";

const oldEvents = [
  ["SCANNING ROOM...", "Depth capture started"],
  ["DETECTING WALLS...", "Room boundary verified"],
  ["SOFA DETECTED", "204 × 88 cm"],
  ["DESK DETECTED", "120 × 60 cm"],
  ["BED DETECTED", "190 × 135 cm"],
  ["7 ITEMS MAPPED", "Dimensions verified"],
];

const newEvents = [
  ["SCANNING ROOM...", "Depth capture started"],
  ["ROOM BOUNDARY", "29.1 m² mapped"],
  ["WINDOWS DETECTED", "2 natural light sources"],
  ["DOOR SWINGS", "Clearance zones mapped"],
  ["USABLE WALLS", "8.4 m available"],
  ["GEOMETRY READY", "310 sq ft verified"],
];

export function ScanExperience({ kind }: { kind: "old" | "new" }) {
  const { scanStatus, setScanStatus } = useDemo();
  const phase = scanStatus[kind];
  const [eventIndex, setEventIndex] = useState(0);
  const [uploadNote, setUploadNote] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);
  const events = kind === "old" ? oldEvents : newEvents;

  useEffect(() => {
    if (phase !== "scanning") return;
    const timers = events.map((_, index) => window.setTimeout(() => setEventIndex(index), index * 520));
    timers.push(window.setTimeout(() => setScanStatus(kind, "complete"), events.length * 520 + 250));
    return () => timers.forEach(window.clearTimeout);
  }, [events, kind, phase, setScanStatus]);

  function start() {
    setEventIndex(0);
    setUploadNote("");
    setScanStatus(kind, "scanning");
  }

  function handleFile(file?: File) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const room = parseRoomPlanJSON(String(reader.result));
        setUploadNote(`${room.furniture.length} objects normalized from ${file.name}`);
        setScanStatus(kind, "complete");
      } catch {
        setUploadNote("That file is not a supported RoomPlan JSON export.");
      }
    };
    reader.readAsText(file);
  }

  const title = kind === "old" ? "First, let's understand what you already own." : "Now let's understand your new space.";
  const subtitle = kind === "old"
    ? "Scan your room with your iPhone. ReNest detects room geometry and furniture dimensions automatically."
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
          <div><span>NEW HOME</span><strong>{demoScenario.newHome.name}</strong></div>
          <div><span>SIZE</span><strong>{demoScenario.newHome.areaSqFt} sq ft</strong></div>
          <div><span>TYPE</span><strong>1-bedroom apartment</strong></div>
        </div>
      ) : null}

      <section className="scan-stage card">
        <div className="scan-visual">
          <div className={`scan-photo ${phase === "scanning" ? "is-scanning" : ""}`}>
            <Image
              src={kind === "old" ? "/photos/old-home.webp" : "/photos/empty-new-home.webp"}
              alt={kind === "old" ? "Alex's lived-in Kowloon apartment with existing furniture" : "An empty compact apartment in the Northern Metropolis"}
              fill
              sizes="(max-width: 900px) 92vw, 64vw"
            />
            <div className="scan-corners" aria-hidden="true"><i /><i /><i /><i /></div>
          </div>
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
            <div className="scan-complete-overlay"><CheckCircle2 size={33} /><span><b>{kind === "old" ? "Scan complete" : "New home mapped"}</b>{uploadNote || (kind === "old" ? `${demoScenario.furnitureTotal} furniture items detected` : "29.1 m² available")}</span></div>
          ) : null}
        </div>
        <div className="scan-control">
          <div>
            <span className="scan-kicker">{phase === "idle" ? "WEB DEMO CAPTURE" : phase === "scanning" ? `ANALYZING · ${Math.round(((eventIndex + 1) / events.length) * 100)}%` : "CAPTURE VERIFIED"}</span>
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
            <div className="scan-progress"><i><span style={{ width: `${((eventIndex + 1) / events.length) * 100}%` }} /></i><small>Deterministic demo capture · about 3 seconds</small></div>
          ) : (
            <LinkButton href={kind === "old" ? "/inventory" : "/preferences"}>{kind === "old" ? "Review my furniture" : "Plan my space"}</LinkButton>
          )}
        </div>
      </section>
    </main>
  );
}
