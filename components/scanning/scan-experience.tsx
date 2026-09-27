"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import dynamic from "next/dynamic";
import { CheckCircle2, FileJson, Radar, ScanLine } from "lucide-react";
import { useDemo } from "@/components/state-provider";
import { Button, Eyebrow, LinkButton } from "@/components/common/ui";
import { demoScenario } from "@/lib/demo-data";
import { parseRoomPlanJSON } from "@/lib/roomplan";
import type { RoomScanPhase } from "./room-scan-sequence";

const RoomScanSequence = dynamic(() => import("./room-scan-sequence").then((module) => module.RoomScanSequence), {
  ssr: false,
  loading: () => <div className="room-scan-loading"><Image src="/photos/old-home-scan-reference.png" alt="Your lived-in Kowloon apartment" fill loading="eager" sizes="(max-width: 900px) 92vw, 64vw" /></div>,
});

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
  const [scanReplayKey, setScanReplayKey] = useState(0);
  const [uploadNote, setUploadNote] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);
  const events = kind === "old" ? oldEvents : newEvents;

  useEffect(() => {
    if (phase !== "scanning" || kind === "old") return;
    const timers = events.map((_, index) => window.setTimeout(() => setEventIndex(index), index * 520));
    timers.push(window.setTimeout(() => setScanStatus(kind, "complete"), events.length * 520 + 250));
    return () => timers.forEach(window.clearTimeout);
  }, [events, kind, phase, setScanStatus]);

  function start() {
    setEventIndex(0);
    setUploadNote("");
    setScanReplayKey((value) => value + 1);
    setScanStatus(kind, "scanning");
  }

  function handleOldScanPhase(next: RoomScanPhase) {
    const index = { idle: 0, phone: 0, points: 1, wireframe: 2, solid: 3, inventory: 4, complete: 5 }[next];
    setEventIndex(index);
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

  const title = "Map your new home.";
  const subtitle = "Capture rooms, doors, windows and usable wall areas before placing furniture.";
  const controlTitle = phase === "idle"
    ? (kind === "old" ? "Scan your old home" : "Scan your new home")
    : phase === "scanning"
      ? (kind === "old" ? "Reading room and furniture" : "Reading room geometry")
      : (kind === "old" ? `${demoScenario.furnitureTotal} items detected` : "Room mapped");
  const controlCopy = phase === "idle"
    ? (kind === "old" ? "Identify furniture and dimensions in one pass." : "Capture boundaries, openings and usable space.")
    : phase === "scanning"
      ? events[eventIndex][1]
      : (kind === "old" ? "Your furniture is ready for fit analysis." : "Your new space is ready for layout planning.");

  return (
    <main className="page-shell scan-page">
      {kind === "new" ? (
        <div className="page-head">
          <div className="page-head-copy">
            <Eyebrow>Step 2 · New home</Eyebrow>
            <h1>{title}</h1>
            <p>{subtitle}</p>
          </div>
        </div>
      ) : null}

      {kind === "new" ? (
        <div className="new-home-strip">
          <div><span>NEW HOME</span><strong>{demoScenario.newHome.name}</strong></div>
          <div><span>SIZE</span><strong>{demoScenario.newHome.areaSqFt} sq ft</strong></div>
          <div><span>TYPE</span><strong>1-bedroom apartment</strong></div>
        </div>
      ) : null}

      <section className="scan-stage card">
        <div className="scan-visual">
          {kind === "old" ? (
            <div className="room-scan-host">
              <RoomScanSequence
                active={phase === "scanning"}
                replayKey={scanReplayKey}
                onPhaseChange={handleOldScanPhase}
                onComplete={() => setScanStatus("old", "complete")}
                onReplay={start}
              />
            </div>
          ) : (
            <div className={`scan-photo ${phase === "scanning" ? "is-scanning" : ""}`}>
              <Image
                src="/photos/empty-new-home.webp"
                alt="Your empty compact apartment in the Northern Metropolis"
                fill
                sizes="(max-width: 900px) 92vw, 64vw"
                loading="eager"
              />
              <div className="scan-corners" aria-hidden="true"><i /><i /><i /><i /></div>
            </div>
          )}
          {phase === "idle" && kind === "new" ? (
            <div className="scan-idle-overlay"><Radar size={34} /><span>Ready to capture</span></div>
          ) : null}
          {phase === "scanning" && kind === "new" ? (
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
            <span className="scan-kicker">{phase === "idle" ? (kind === "old" ? "STEP 1 · OLD HOME" : "STEP 2 · NEW HOME") : phase === "scanning" ? events[eventIndex][0] : "SCAN COMPLETE"}</span>
            <h1>{controlTitle}</h1>
            <p>{controlCopy}</p>
          </div>
          {phase === "idle" ? (
            <div className="scan-buttons">
              <Button onClick={start} icon={ScanLine}>Use demo scan</Button>
              {kind === "old" ? <Button variant="ghost" icon={FileJson} onClick={() => fileRef.current?.click()}>Upload scan</Button> : null}
              <input ref={fileRef} type="file" accept=".json,application/json" hidden onChange={(event) => handleFile(event.target.files?.[0])} />
              {uploadNote ? <p className="upload-note">{uploadNote}</p> : null}
            </div>
          ) : phase === "scanning" ? (
            <div className="scan-progress"><small>Room geometry · Furniture · Dimensions</small></div>
          ) : (
            <LinkButton href={kind === "old" ? "/inventory" : "/preferences"}>{kind === "old" ? "Review my furniture" : "Plan my space"}</LinkButton>
          )}
        </div>
      </section>
    </main>
  );
}
