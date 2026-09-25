"use client";

import Image from "next/image";
import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  Box,
  Check,
  CircleCheck,
  ImageIcon,
  LayoutGrid,
  Laptop,
  Map,
  Maximize2,
  MoveRight,
  Recycle,
  RotateCcw,
  Ruler,
  ScanLine,
  Search,
  ShieldCheck,
  BookmarkCheck,
  UtensilsCrossed,
} from "lucide-react";
import { SpatialCanvas } from "@/components/floor-plan/spatial-canvas";
import { FloorPlan } from "@/components/floor-plan/floor-plan";
import { Button, LinkButton } from "@/components/common/ui";
import { furnitureInventory } from "@/lib/demo-data";
import { demoFurnitureInventory, demoFurnitureTotal, demoInventoryIds, demoPlans, objectiveConfigs, objectiveOrder, type DemoObjective } from "@/lib/interactive-demo";
import styles from "./interactive-demo.module.css";

type ScanState = "idle" | "room" | "furniture" | "measuring" | "complete";
type MapState = "idle" | "boundaries" | "openings" | "dimensions" | "complete";
type OptimizationState = "idle" | "exploring" | "clearance" | "ranking" | "complete";
type VisualizationState = "idle" | "composition" | "materials" | "lighting" | "complete";
type MarketplaceState = "idle" | "searching" | "complete";

const workflowSteps = [
  { label: "Scan", stage: 0 },
  { label: "Map", stage: 1 },
  { label: "Plan", stage: 2 },
  { label: "Fit", stage: 3 },
  { label: "Move", stage: 4 },
];
const featuredInventory = demoInventoryIds
  .map((id) => demoFurnitureInventory.find((item) => item.id === id))
  .filter((item): item is (typeof furnitureInventory)[number] => Boolean(item));
const totalInventoryValue = featuredInventory.reduce((total, item) => total + (item.estimatedValue ?? 0), 0);
const furnitureAssetById: Partial<Record<string, string>> = {
  sofa: "/photos/furniture-sofa.webp",
  desk: "/photos/furniture-study-desk.png",
  "work-chair": "/photos/furniture-chair.webp",
  "coffee-table": "/photos/furniture-coffee-table.webp",
  bookshelf: "/photos/furniture-bookshelf.webp",
  "dining-table": "/photos/furniture-dining-table.webp",
};
const fitTestItems = ["sofa", "coffee-table", "bookshelf", "desk", "work-chair", "dining-table"];
const FurniturePreview = dynamic(() => import("./furniture-preview").then((module) => module.FurniturePreview), { ssr: false });
const ScanModelPreview = dynamic(() => import("./scan-model-preview").then((module) => module.ScanModelPreview), { ssr: false });

function join(...classes: Array<string | false | undefined>) {
  return classes.filter(Boolean).join(" ");
}

export function InteractiveDemo() {
  const [stage, setStage] = useState(0);
  const [savedPlan, setSavedPlan] = useState<DemoObjective | null>(null);
  const [furthestStage, setFurthestStage] = useState(0);
  const [scanState, setScanState] = useState<ScanState>("idle");
  const [scanAutoPlay, setScanAutoPlay] = useState(true);
  const [selectedInventory, setSelectedInventory] = useState("sofa");
  const [mapState, setMapState] = useState<MapState>("idle");
  const [objective, setObjective] = useState<DemoObjective>("keep");
  const [selectedFitItem, setSelectedFitItem] = useState<string | null>(null);
  const [replacementTested, setReplacementTested] = useState(false);
  const [optimizationState, setOptimizationState] = useState<OptimizationState>("idle");
  const [visualizationState, setVisualizationState] = useState<VisualizationState>("idle");
  const [marketplaceState, setMarketplaceState] = useState<MarketplaceState>("idle");
  const [resultView, setResultView] = useState<"room" | "plan" | "three" | "preview">("room");
  const timers = useRef<number[]>([]);

  const selectedItem = demoFurnitureInventory.find((item) => item.id === selectedInventory) ?? demoFurnitureInventory[0];
  const activeWorkflowStep = stage;

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" });
  }, [stage]);

  useEffect(() => {
    try {
      const stored = JSON.parse(window.localStorage.getItem("renest-saved-plan-v1") ?? "null");
      if (stored?.version === 1 && objectiveOrder.includes(stored.objectiveId)) setSavedPlan(stored.objectiveId);
    } catch { /* The demo also works when local storage is unavailable. */ }
  }, []);

  useEffect(() => () => {
    timers.current.forEach((timer) => window.clearTimeout(timer));
  }, []);

  useEffect(() => {
    if (stage !== 0 || scanState !== "complete" || !scanAutoPlay) return;
    const timer = window.setInterval(() => setSelectedInventory((current) => {
      const index = demoInventoryIds.indexOf(current as (typeof demoInventoryIds)[number]);
      return demoInventoryIds[(index + 1) % demoFurnitureTotal];
    }), 3000);
    return () => window.clearInterval(timer);
  }, [stage, scanState, scanAutoPlay]);

  function later(callback: () => void, delay: number) {
    const timer = window.setTimeout(callback, delay);
    timers.current.push(timer);
  }

  function clearTimers() {
    timers.current.forEach((timer) => window.clearTimeout(timer));
    timers.current = [];
  }

  function advance(next: number) {
    setStage(next);
    setFurthestStage((current) => Math.max(current, next));
  }

  function startScan() {
    clearTimers();
    setScanAutoPlay(true);
    setSelectedInventory(demoInventoryIds[0]);
    setScanState("room");
    later(() => setScanState("furniture"), 650);
    demoInventoryIds.slice(1).forEach((id, index) => later(() => {
      setSelectedInventory(id);
      if (index === 2) setScanState("measuring");
    }, 1450 + index * 800));
    later(() => setScanState("complete"), 5550);
  }

  function mapNewHome() {
    setMapState("boundaries");
    later(() => setMapState("openings"), 650);
    later(() => setMapState("dimensions"), 1320);
    later(() => setMapState("complete"), 2100);
  }

  function startOptimization() {
    setOptimizationState("exploring");
    setVisualizationState("idle");
    setMarketplaceState("idle");
    setResultView("three");
    advance(4);
    later(() => setOptimizationState("clearance"), 650);
    later(() => setOptimizationState("ranking"), 1250);
    later(() => {
      setOptimizationState("complete");
      setMarketplaceState("searching");
      later(() => setMarketplaceState("complete"), 1150);
    }, 1900);
  }

  function changeResultView(view: "room" | "plan" | "three" | "preview") {
    setResultView(view);
    if (view === "preview" && visualizationState === "idle") {
      setVisualizationState("composition");
      later(() => setVisualizationState("materials"), 220);
      later(() => setVisualizationState("lighting"), 420);
      later(() => setVisualizationState("complete"), 650);
    }
  }

  function switchObjective(nextObjective: DemoObjective) {
    if (nextObjective === objective) return;
    setObjective(nextObjective);
  }

  function resetDemo() {
    clearTimers();
    setStage(0);
    setFurthestStage(0);
    setScanState("idle");
    setScanAutoPlay(true);
    setSelectedInventory("sofa");
    setMapState("idle");
    setObjective("keep");
    setSelectedFitItem(null);
    setReplacementTested(false);
    setOptimizationState("idle");
    setVisualizationState("idle");
    setMarketplaceState("idle");
    setResultView("three");
  }

  return (
    <main className={styles.demo}>
      <div className={styles.demoTopbar}>
        <div>
          <span>Your move</span>
          <strong>Kowloon <MoveRight size={14} /> Northern Metropolis</strong>
        </div>
        <div className={styles.topbarActions}>
        {savedPlan ? <button type="button" className={styles.resetButton} onClick={() => {
          clearTimers(); setSelectedFitItem("dining-table"); setObjective(savedPlan); setScanState("complete"); setMapState("complete");
          setReplacementTested(true); setOptimizationState("complete"); setMarketplaceState("complete"); setResultView("three"); advance(4);
        }}><BookmarkCheck size={14} /> Saved plan</button> : null}
        <button type="button" onClick={resetDemo} className={styles.resetButton}>
          <RotateCcw size={15} /> Restart
        </button>
        </div>
      </div>

      <nav className={styles.stageRail} aria-label="Move progress">
        {workflowSteps.map((step, index) => (
          <button
            type="button"
            key={step.label}
            disabled={step.stage > furthestStage}
            className={join(styles.stageStep, index === activeWorkflowStep && styles.stageActive, index < activeWorkflowStep && styles.stageDone)}
            aria-current={index === activeWorkflowStep ? "step" : undefined}
            onClick={() => setStage(step.stage)}
          >
            <span>{index < activeWorkflowStep ? <Check size={13} /> : `0${index + 1}`}</span>
            <em>{step.label}</em>
          </button>
        ))}
      </nav>

      {stage === 0 ? (
        <CurrentHomeStage
          scanState={scanState}
          selectedItem={selectedItem}
          selectedInventory={selectedInventory}
          onSelect={(id) => { setScanAutoPlay(false); setSelectedInventory(id); }}
          onScan={startScan}
          onContinue={() => advance(1)}
        />
      ) : null}

      {stage === 1 ? (
        <HomeComparisonStage
          mapState={mapState}
          onMap={mapNewHome}
          onBack={() => setStage(0)}
          onContinue={() => advance(2)}
        />
      ) : null}

      {stage === 2 ? (
        <PriorityStage
          objective={objective}
          onSelect={setObjective}
          onBack={() => setStage(1)}
          onContinue={() => advance(3)}
        />
      ) : null}

      {stage === 3 ? (
        <FitStage
          objective={objective}
          selectedItem={selectedFitItem}
          replacementTested={replacementTested}
          onSelectItem={setSelectedFitItem}
          onTestReplacement={() => setReplacementTested(true)}
          onBack={() => setStage(2)}
          onContinue={startOptimization}
        />
      ) : null}

      {stage === 4 && optimizationState !== "complete" ? (
        <OptimizationExperience objective={objective} phase={optimizationState} />
      ) : null}

      {stage === 4 && optimizationState === "complete" ? (
        <ResultStage
          objective={objective}
          view={resultView}
          visualizationState={visualizationState}
          marketplaceState={marketplaceState}
          onSelectObjective={switchObjective}
          onSetView={changeResultView}
          onSaved={setSavedPlan}
          onBack={() => setStage(3)}
        />
      ) : null}

      <div className={styles.liveStatus} aria-live="polite">
        {stage === 0 && scanState === "complete" ? "6 furniture items detected" : null}
        {stage === 1 && mapState === "complete" ? "New home mapped: 18% smaller" : null}
        {stage === 3 && replacementTested ? `Alternative verified: ${objectiveConfigs[objective].plan.walkwayClearance} cm clearance` : null}
        {stage === 4 && optimizationState === "complete" ? "Optimal layout verified" : null}
      </div>
    </main>
  );
}

function StoryHeader({ step, title, copy }: { step: string; title: string; copy: string }) {
  return (
    <header className={styles.storyHeader}>
      <span>{step}</span>
      <h1>{title}</h1>
      <p>{copy}</p>
    </header>
  );
}

function StageActions({ onBack, children }: { onBack?: () => void; children: React.ReactNode }) {
  return (
    <div className={styles.stageActions}>
      {onBack ? <Button type="button" variant="ghost" icon={ArrowLeft} onClick={onBack}>Back</Button> : <span />}
      {children}
    </div>
  );
}

function CurrentHomeStage({
  scanState,
  selectedItem,
  selectedInventory,
  onSelect,
  onScan,
  onContinue,
}: {
  scanState: ScanState;
  selectedItem: (typeof furnitureInventory)[number];
  selectedInventory: string;
  onSelect: (id: string) => void;
  onScan: () => void;
  onContinue: () => void;
}) {
  const scanStep = { idle: 0, room: 1, furniture: 2, measuring: 3, complete: 4 }[scanState];
  const scanCopy = {
    idle: ["Ready to scan", "Capture the room once. ReNest will separate the space from the furniture inside it."],
    room: ["Mapping room depth", "A phone depth sensor traces surfaces and builds a spatial mesh."],
    furniture: ["Separating object volumes", "Furniture is detected as 3D volume, then matched to a model."],
    measuring: ["Resolving dimensions", "Each object's width, depth and height is locked to the scan."],
    complete: ["Spatial inventory ready", "Six familiar objects now have measured dimensions."],
  }[scanState];

  return (
    <section className={styles.stage}>
      <StoryHeader
        step="01 · Current home"
        title="Start with what you already own."
        copy="A familiar room. Six pieces of furniture. Let’s see what comes with you."
      />
      <div className={styles.scanWorkspace}>
        <div className={styles.photoPanel}>
          <Image src="/photos/old-home.webp" alt="Your lived-in Kowloon apartment" fill loading="eager" sizes="(max-width: 900px) 94vw, 62vw" preload />
          <div className={styles.scanFrame}>
            <i /><i /><i /><i />
            {scanStep > 0 && scanStep < 4 ? <span className={styles.scanPhaseBadge}><ScanLine size={18} /> {scanCopy[0]}</span> : null}
            {scanStep > 0 && scanStep < 4 ? <><div className={styles.depthField} aria-hidden="true" /><div className={styles.depthBeam} aria-hidden="true" /><span className={styles.depthMode}>DEPTH CAPTURE · 3D MESH</span></> : null}
            {scanStep >= 2 && scanStep < 4 ? (
              <div className={styles.objectBoxes} aria-hidden="true">
                {[
                  ["sofa", "Sofa", styles.boxSofa],
                  ["dining-table", "Dining table", styles.boxTable],
                  ["desk", "Study desk", styles.boxDesk],
                  ["work-chair", "Work chair", styles.boxChair],
                  ["coffee-table", "Coffee table", styles.boxCoffee],
                  ["bookshelf", "Storage", styles.boxShelf],
                ].map(([id, label, position]) => <div key={id} className={join(styles.depthBox, position, selectedInventory === id && styles.depthActive)}><span>{label}</span></div>)}
              </div>
            ) : null}
            {scanStep >= 2 && scanStep < 4 ? <span className={styles.depthReadout}>VOLUME LOCKED · {selectedItem.name.toUpperCase()} · {Math.round(selectedItem.dimensions.width * 100)} × {Math.round(selectedItem.dimensions.depth * 100)} × {Math.round(selectedItem.dimensions.height * 100)} CM</span> : null}
            {scanState === "complete" ? (
              <>
                <button type="button" className={join(styles.detectedTag, styles.tagSofa)} onClick={() => onSelect("sofa")}><span>Sofa</span><b>204 × 88 cm</b></button>
                <button type="button" className={join(styles.detectedTag, styles.tagTable)} onClick={() => onSelect("dining-table")}><span>Dining table</span><b>140 × 80 cm</b></button>
                <button type="button" className={join(styles.detectedTag, styles.tagDesk)} onClick={() => onSelect("desk")}><span>Study desk</span><b>120 × 60 cm</b></button>
                <button type="button" className={join(styles.detectedTag, styles.tagChair)} onClick={() => onSelect("work-chair")}><span>Work chair</span><b>58 × 58 cm</b></button>
                <button type="button" className={join(styles.detectedTag, styles.tagCoffee)} onClick={() => onSelect("coffee-table")}><span>Coffee table</span><b>100 × 55 cm</b></button>
                <button type="button" className={join(styles.detectedTag, styles.tagShelf)} onClick={() => onSelect("bookshelf")}><span>Bookshelf</span><b>80 × 32 cm</b></button>
              </>
            ) : null}
          </div>
          <div className={styles.photoCaption}><span>Kowloon · 380 sq ft</span><b>{scanState === "complete" ? "SCAN COMPLETE" : "CURRENT HOME"}</b></div>
        </div>

        <aside className={styles.inventoryPanel}>
          {scanState === "idle" ? (
            <div className={styles.emptyState}>
              <span><ScanLine size={27} /></span>
              <h2>Ready to scan</h2>
              <p>Capture the room once. ReNest will identify the furniture and preserve its real-world dimensions.</p>
              <Button type="button" icon={ScanLine} onClick={onScan}>Scan current home</Button>
            </div>
          ) : scanState !== "complete" ? (
            <div className={styles.scanProgress}>
              <span className={styles.liveCapture}><ScanLine size={17} /> Live spatial capture</span>
              <strong>{scanCopy[0]}</strong>
              <p>{scanCopy[1]}</p>
              <ul>
                <li className={scanStep > 1 ? styles.completeLine : styles.activeLine}>Depth mesh captured</li>
                <li className={scanStep > 2 ? styles.completeLine : scanStep === 2 ? styles.activeLine : undefined}>Furniture volumes separated</li>
                <li className={scanStep > 3 ? styles.completeLine : scanStep === 3 ? styles.activeLine : undefined}>3D models matched</li>
              </ul>
              {scanStep >= 2 ? <div className={styles.scanModelProgress}><ScanModelPreview key={selectedInventory} itemId={selectedInventory} label={selectedItem.name} /><span className={styles.scanItemProgress}>{demoInventoryIds.indexOf(selectedInventory as (typeof demoInventoryIds)[number]) + 1} / {demoFurnitureTotal} objects resolved</span></div> : null}
            </div>
          ) : (
            <>
              <div className={styles.panelHeading}>
                <div><span>Detected inventory</span><h2>These are the things you own.</h2></div>
                <b>6 / 6 captured</b>
              </div>
              <div className={styles.scanModelComplete}><ScanModelPreview key={selectedInventory} itemId={selectedInventory} label={selectedItem.name} /><span className={styles.scanItemProgress}>Playing captured objects · {demoInventoryIds.indexOf(selectedInventory as (typeof demoInventoryIds)[number]) + 1} / {demoFurnitureTotal}</span></div>
              <div className={styles.inventoryList}>
                {featuredInventory.map((item) => (
                  <button type="button" key={item.id} onClick={() => onSelect(item.id)} className={join(styles.inventoryRow, selectedInventory === item.id && styles.inventorySelected)}>
                    <span className={styles.objectThumb}>
                      {furnitureAssetById[item.id] ? <Image src={furnitureAssetById[item.id]!} alt="" fill sizes="44px" /> : <Box size={17} />}
                    </span>
                    <span><b>{item.name}</b><small>{Math.round(item.dimensions.width * 100)} × {Math.round(item.dimensions.depth * 100)} × {Math.round(item.dimensions.height * 100)} cm</small></span>
                    <em>HK${item.estimatedValue?.toLocaleString()}</em>
                  </button>
                ))}
              </div>
              <div className={styles.selectedInventoryDetail}>
                <span>Selected item</span>
                <strong>{selectedItem.name}</strong>
                <p>{Math.round(selectedItem.dimensions.width * 100)} cm wide · estimated replacement HK${selectedItem.estimatedValue?.toLocaleString()}</p>
              </div>
              <div className={styles.inventoryValue}><span>Value already owned</span><strong>HK${totalInventoryValue.toLocaleString()}</strong></div>
            </>
          )}
        </aside>
      </div>
      <StageActions>
        {scanState === "complete" ? <Button type="button" icon={ArrowRight} onClick={onContinue}>Compare the new home</Button> : null}
      </StageActions>
    </section>
  );
}

function HomeComparisonStage({
  mapState,
  onMap,
  onBack,
  onContinue,
}: {
  mapState: MapState;
  onMap: () => void;
  onBack: () => void;
  onContinue: () => void;
}) {
  const mapStep = { idle: 0, boundaries: 1, openings: 2, dimensions: 3, complete: 4 }[mapState];
  const mapStatus = {
    idle: "Ready to map",
    boundaries: "Tracing room boundaries",
    openings: "Locating doors and windows",
    dimensions: "Resolving usable geometry",
    complete: "Geometry captured",
  }[mapState];

  return (
    <section className={styles.stage}>
      <StoryHeader
        step="02 · New home"
        title="A little less space. A new possibility."
        copy="From 380 to 310 sq ft. Map the new room, its windows and the paths you’ll use every day."
      />
      <div className={styles.comparisonWorkspace}>
        <article className={styles.homeImage}>
          <Image src="/photos/old-home.webp" alt="Your current larger apartment" fill loading="eager" sizes="(max-width: 900px) 94vw, 45vw" />
          <div className={styles.homeLabel}><span>Current home</span><strong>380 sq ft</strong><small>Kowloon</small></div>
        </article>
        <div className={styles.sizeDelta}><MoveRight size={22} /><strong>−18%</strong><span>less floor area</span></div>
        <article className={styles.homeImage}>
          <Image src="/photos/empty-new-home.webp" alt="Your smaller empty new apartment" fill loading="eager" sizes="(max-width: 900px) 94vw, 45vw" />
          <div className={styles.homeLabel}><span>New home</span><strong>310 sq ft</strong><small>Northern Metropolis</small></div>
          {mapStep > 0 ? (
            <div className={join(styles.geometryOverlay, mapState === "complete" && styles.geometryComplete)} aria-hidden="true">
              <i className={styles.wallNorth} /><i className={styles.wallEast} /><i className={styles.wallSouth} /><i className={styles.wallWest} />
              {mapStep >= 2 ? <><i className={styles.windowTrace} /><i className={styles.doorTrace} /></> : null}
              {mapStep >= 3 ? <div className={styles.geometryGrid} /> : null}
              {mapStep < 4 ? <b className={styles.geometryStatus}><ScanLine size={16} /> {mapStatus}</b> : null}
            </div>
          ) : null}
          {mapStep >= 3 ? <div className={styles.dimensionOverlay}><span>Living · 3.9 × 3.1 m</span><span>Window wall · 2.2 m</span><span>Minimum route · 70 cm</span></div> : null}
        </article>
      </div>
      <div className={styles.comparisonConclusion}>
        <div><Ruler size={23} /><span><b>70 sq ft disappears</b><small>Old furniture cannot simply be copied into the new plan.</small></span></div>
        <div><Maximize2 size={23} /><span><b>29.1 m² mapped</b><small>Door swings and daily circulation become hard constraints.</small></span></div>
        <div className={styles.mapAction}>
          {mapState === "idle" ? <Button type="button" icon={ScanLine} onClick={onMap}>Map the new home</Button> : null}
          {mapStep > 0 && mapStep < 4 ? <span className={styles.mapStatus}><ScanLine size={17} /> {mapStatus}</span> : null}
          {mapState === "complete" ? <span><CircleCheck size={18} /> Geometry captured</span> : null}
        </div>
      </div>
      <StageActions onBack={onBack}>
        {mapState === "complete" ? <Button type="button" icon={ArrowRight} onClick={onContinue}>Choose what matters</Button> : null}
      </StageActions>
    </section>
  );
}

function PriorityStage({
  objective,
  onSelect,
  onBack,
  onContinue,
}: {
  objective: DemoObjective;
  onSelect: (objective: DemoObjective) => void;
  onBack: () => void;
  onContinue: () => void;
}) {
  const icons = { keep: Recycle, work: Laptop, host: UtensilsCrossed };
  const selected = objectiveConfigs[objective];
  return (
    <section className={styles.stage}>
      <StoryHeader
        step="03 · One clear goal"
        title="Make room for the way you live."
        copy="Choose what matters most. Compare the arrangements once your furniture is in place."
      />
      <div className={styles.priorityWorkspace}>
        <div className={styles.objectiveList} role="radiogroup" aria-label="Optimization objective">
          {objectiveOrder.map((id, index) => {
            const option = objectiveConfigs[id];
            const Icon = icons[id];
            return (
              <button type="button" role="radio" aria-checked={objective === id} tabIndex={objective === id ? 0 : -1} onKeyDown={(event) => {
                if (!["ArrowDown", "ArrowUp", "ArrowLeft", "ArrowRight"].includes(event.key)) return;
                event.preventDefault();
                const direction = event.key === "ArrowDown" || event.key === "ArrowRight" ? 1 : -1;
                const next = (index + direction + objectiveOrder.length) % objectiveOrder.length;
                onSelect(objectiveOrder[next]);
                (event.currentTarget.parentElement?.children[next] as HTMLButtonElement | undefined)?.focus();
              }} key={id} className={join(styles.objectiveButton, objective === id && styles.objectiveSelected)} onClick={() => onSelect(id)}>
                <span>0{index + 1}</span>
                <Icon size={23} />
                <div><strong>{option.label}</strong><p>{option.description}</p></div>
                <i>{objective === id ? <Check size={15} /> : null}</i>
              </button>
            );
          })}
        </div>
        <aside className={styles.rulePanel}>
          <span><Ruler size={14} /> Your planning priority</span>
          <h2>{selected.label}</h2>
          <p>{selected.rule}</p>
          <div className={styles.ruleTranslation}>
            <div><b>Human goal</b><span>{selected.shortLabel}</span></div>
            <MoveRight size={18} />
            <div><b>Geometry target</b><span>{selected.plan.walkwayClearance} cm route · {selected.plan.openArea} m² open</span></div>
          </div>
          <small>Your goal becomes a measurable layout rule.</small>
        </aside>
      </div>
      <StageActions onBack={onBack}>
        <Button type="button" icon={ArrowRight} onClick={onContinue}>Test the old furniture</Button>
      </StageActions>
    </section>
  );
}

function FitStage({
  objective,
  selectedItem,
  replacementTested,
  onSelectItem,
  onTestReplacement,
  onBack,
  onContinue,
}: {
  objective: DemoObjective;
  selectedItem: string | null;
  replacementTested: boolean;
  onSelectItem: (id: string) => void;
  onTestReplacement: () => void;
  onBack: () => void;
  onContinue: () => void;
}) {
  const inspectedItem = selectedItem ?? (replacementTested ? "dining-table" : null);
  const isConflict = inspectedItem === "dining-table";
  const activePlan = replacementTested ? objectiveConfigs[objective].plan : demoPlans[2];
  const replacementClearance = objectiveConfigs[objective].plan.walkwayClearance;
  const replacement = objectiveConfigs[objective].recommendation;
  const selectedFurniture = demoFurnitureInventory.find((item) => item.id === inspectedItem);
  const selectedPlacement = activePlan.placements.find((placement) => placement.furnitureId === (inspectedItem === "work-chair" ? "desk" : inspectedItem));
  return (
    <section className={styles.stage}>
      <StoryHeader
        step="04 · See what fits"
        title={replacementTested ? "A little change. Room to move." : "Five pieces fit. One needs a rethink."}
        copy={replacementTested ? `The smaller table leaves ${replacementClearance} cm of clear route through your new home.` : "Your dining table leaves a tight 43 cm route. Let’s give you more breathing room."}
      />
      <div className={styles.fitWorkspace}>
        <aside className={styles.furnitureSidebar}><span className={styles.sidebarLabel}>YOUR FURNITURE</span>
          <div className={styles.objectTestRail} aria-label="Detected furniture fit checks">
            {fitTestItems.map((id) => {
              const item = demoFurnitureInventory.find((candidate) => candidate.id === id)!;
              const conflict = id === "dining-table" && !replacementTested;
              const included = activePlan.placements.some((placement) => placement.furnitureId === (id === "work-chair" ? "desk" : id));
              return <button type="button" key={id} aria-pressed={selectedItem === id} className={join(styles.objectTest, selectedItem === id && styles.objectTestSelected)} onClick={() => onSelectItem(id)}>
                <span><Image src={id === "dining-table" && replacementTested ? replacement.image : furnitureAssetById[id]!} alt="" fill sizes="50px" /></span>
                <b>{id === "dining-table" && replacementTested ? "Smaller table" : item.name}</b>
                <em className={conflict ? styles.objectFail : styles.objectPass}>{conflict ? "Tight clearance" : included ? "Fits comfortably" : "Not in this layout"}</em>
              </button>;
            })}
          </div><p className={styles.inventoryFootnote}>Six pieces, measured in centimetres.</p>
        </aside>
        <section className={styles.blueprintPanel}>
          <div className={styles.blueprintHead}>
            <div><span>{replacementTested ? "Alternative fit test" : "Existing furniture fit test"}</span><strong>Northern Metropolis · 310 sq ft</strong></div>
            <b className={replacementTested ? styles.passLabel : styles.failLabel}>{replacementTested ? <CircleCheck size={13} /> : <AlertTriangle size={13} />}{replacementTested ? `${replacementClearance} cm · clear` : "43 cm · blocked"}</b>
          </div>
          <SpatialCanvas plan={activePlan} selectedId={selectedItem} onSelect={onSelectItem} focusMainSpace />
          <div className={styles.blueprintHint}><Ruler size={14} /> Select a furniture item on the plan to inspect its geometry.</div>
        </section>
        <aside className={styles.fitInspector}>
          {!inspectedItem ? (
            <div className={styles.inspectPrompt}>
              <span><AlertTriangle size={24} /></span>
              <h2>It fits.</h2>
              <p>But not comfortably. The dining table reduces the entrance route to 43 cm.</p>
              <button type="button" onClick={() => onSelectItem("dining-table")} className={styles.conflictButton}>
                <span><b>Dining Table</b><small>140 × 80 cm</small></span><em>Inspect conflict <ArrowRight size={14} /></em>
              </button>
            </div>
          ) : isConflict ? (
            <div className={styles.conflictDetail}>
              <span className={replacementTested ? styles.successIcon : styles.warningIcon}>{replacementTested ? <Check size={22} /> : <AlertTriangle size={22} />}</span>
              <small>{replacementTested ? "Clear walkway restored" : "43 cm clearance"}</small>
              <h2>{replacementTested ? replacement.name : "Dining Table"}</h2>
              <strong>{replacementTested ? replacement.dimensions : "140 × 80 cm"}</strong>
              <dl>
                <div><dt>Walking clearance</dt><dd className={replacementTested ? styles.goodText : styles.badText}>{replacementTested ? `${replacementClearance} cm` : "43 cm"}</dd></div>
                <div><dt>Minimum preferred</dt><dd>70 cm</dd></div>
                <div><dt>Door / storage access</dt><dd className={replacementTested ? styles.goodText : styles.badText}>{replacementTested ? "Clear" : "Restricted"}</dd></div>
              </dl>
              <p>{replacementTested ? `The route is now ${replacementClearance - 70} cm above your preferred minimum. There is room to move comfortably.` : "The table leaves only 43 cm beside the entrance. A chair in use also blocks the cabinet route."}</p>
              {!replacementTested ? <Button type="button" icon={Ruler} onClick={onTestReplacement}>Test a smaller table</Button> : null}
            </div>
          ) : (
            <div className={styles.inspectPrompt}>
              <span className={styles.successIcon}><Check size={23} /></span>
              <h2>{selectedFurniture?.name ?? "Your furniture"}</h2>
              <p>{selectedFurniture ? `${Math.round(selectedFurniture.dimensions.width * 100)} × ${Math.round(selectedFurniture.dimensions.depth * 100)} cm` : ""}</p>
              <p>{selectedPlacement ? "Fits inside the usable zone with room for your everyday route." : "Left out of this arrangement to make room for your chosen priority. Compare layouts to keep this piece."}</p>
              <button type="button" onClick={() => onSelectItem("dining-table")} className={styles.conflictButton}><span><b>Dining Table</b><small>{replacementTested ? "Alternative fits" : "Tight clearance"}</small></span><em>Inspect <ArrowRight size={14} /></em></button>
            </div>
          )}
        </aside>
      </div>
      <StageActions onBack={onBack}>
        {replacementTested ? <Button type="button" icon={ArrowRight} onClick={onContinue}>See my move plan</Button> : null}
      </StageActions>
    </section>
  );
}

function OptimizationExperience({ objective, phase }: { objective: DemoObjective; phase: OptimizationState }) {
  const phaseIndex = { idle: 0, exploring: 1, clearance: 2, ranking: 3, complete: 4 }[phase];
  const target = objectiveConfigs[objective];
  const currentPlan = phase === "exploring" ? demoPlans[1] : phase === "clearance" ? demoPlans[2] : target.plan;
  const phaseCopy = {
    idle: ["Preparing the room model", "Loading verified furniture and room geometry."],
    exploring: ["Testing orientations", "Rotating and relocating existing pieces across usable room zones."],
    clearance: ["Checking clearances", "Rejecting collisions, blocked doors and routes below 70 cm."],
    ranking: ["Preserving existing furniture", `Selecting the strongest feasible match for ${target.shortLabel}.`],
    complete: ["Layout verified", "The strongest feasible arrangement is ready."],
  }[phase];

  return (
    <section className={join(styles.stage, styles.optimizationStage)}>
      <StoryHeader
        step="05 · Spatial optimization"
        title="Finding your best arrangement."
        copy="Furniture moves through the measured home. Layouts that block doors or circulation are rejected."
      />
      <div className={styles.optimizationExperience}>
        <section className={styles.optimizationCanvas}>
          <div className={styles.optimizerHead}>
            <div><span>Live layout search</span><strong>Northern Metropolis · 310 sq ft</strong></div>
            <b><LayoutGrid size={14} /> {phase === "ranking" ? "3 finalists" : "Testing arrangements"}</b>
          </div>
          <div className={join(styles.planSearch, styles[`searchPhase${phaseIndex}`])}>
            <FloorPlan mode="new" plan={currentPlan} showWalkway={phaseIndex >= 2} scanning={phase === "exploring"} focusMainSpace />
            <div className={styles.arrangementStamp} key={phase}>
              <span>{phase === "exploring" ? "Arrangement 08" : phase === "clearance" ? "Arrangement 14" : "Best match"}</span>
              <b>{phase === "clearance" ? "43 cm · rejected" : phase === "ranking" ? `${target.plan.walkwayClearance} cm · feasible` : "Objects repositioning"}</b>
            </div>
          </div>
          <div className={styles.candidateRail}>
            <span className={phaseIndex === 1 ? styles.candidateActive : undefined}><b>08</b> Open living zone</span>
            <span className={phaseIndex === 2 ? styles.candidateRejected : undefined}><b>14</b> Door route blocked</span>
            <span className={phaseIndex >= 3 ? styles.candidateWinner : undefined}><b>21</b> {target.shortLabel}</span>
          </div>
        </section>
        <aside className={styles.reasoningPanel}>
          <span className={styles.computeSignal}><Ruler size={16} /> Spatial reasoning</span>
          <h2>{phaseCopy[0]}</h2>
          <p>{phaseCopy[1]}</p>
          <ol className={styles.computeSteps}>
            <li className={phaseIndex > 1 ? styles.stepComplete : phaseIndex === 1 ? styles.stepActive : undefined}>
              <span>{phaseIndex > 1 ? <Check size={14} /> : "1"}</span><div><b>Test orientations</b><small>Position and rotation candidates</small></div>
            </li>
            <li className={phaseIndex > 2 ? styles.stepComplete : phaseIndex === 2 ? styles.stepActive : undefined}>
              <span>{phaseIndex > 2 ? <Check size={14} /> : "2"}</span><div><b>Check clearances</b><small>Collisions, doors and daily routes</small></div>
            </li>
            <li className={phaseIndex > 3 ? styles.stepComplete : phaseIndex === 3 ? styles.stepActive : undefined}>
              <span>{phaseIndex > 3 ? <Check size={14} /> : "3"}</span><div><b>Preserve furniture</b><small>Reuse, openness and purchase cost</small></div>
            </li>
          </ol>
          <div className={styles.optimizationRule}>
            <span>Active goal</span>
            <strong>{target.rule}</strong>
          </div>
        </aside>
      </div>
    </section>
  );
}

function ResultStage({
  objective,
  view,
  visualizationState,
  marketplaceState,
  onSelectObjective,
  onSetView,
  onSaved,
  onBack,
}: {
  objective: DemoObjective;
  view: "room" | "plan" | "three" | "preview";
  visualizationState: VisualizationState;
  marketplaceState: MarketplaceState;
  onSelectObjective: (objective: DemoObjective) => void;
  onSetView: (view: "room" | "plan" | "three" | "preview") => void;
  onSaved: (objective: DemoObjective) => void;
  onBack: () => void;
}) {
  const result = objectiveConfigs[objective];
  const [savedObjective, setSavedObjective] = useState<DemoObjective | null>(null);
  const [saveError, setSaveError] = useState(false);
  const renderCopy = {
    idle: ["Ready to visualize", "Start from the verified floor plan."],
    composition: ["Building the arrangement", "Translating verified placements into the room."],
    materials: ["Preserving your furniture", "Matching existing pieces to their measured positions."],
    lighting: ["Rendering the new home", "Finishing daylight, shadows and spatial continuity."],
    complete: ["Your new space", "Rendered from the verified arrangement."],
  }[visualizationState];
  return (
    <section className={join(styles.stage, styles.resultStage)}>
      <StoryHeader
        step="05 · Move plan"
        title={`${result.plan.reused} of ${demoFurnitureTotal} familiar pieces move with you.`}
        copy="Keep what works. Make one considered change. Your next chapter is taking shape."
      />
      <div className={styles.resultObjectives} role="group" aria-label="Compare optimized objectives">
        {objectiveOrder.map((id) => {
          const option = objectiveConfigs[id];
          return (
            <button type="button" aria-pressed={objective === id} key={id} onClick={() => onSelectObjective(id)} className={join(styles.resultObjective, objective === id && styles.resultObjectiveActive)}>
              <span>{option.label}</span>
              <div><b>{option.plan.reused}/{demoFurnitureTotal}</b><small>reused</small><b>{option.plan.openArea} m²</b><small>open</small><b>{option.plan.walkwayClearance} cm</b><small>route</small></div>
            </button>
          );
        })}
      </div>

      <div className={styles.resultWorkspace}>
        <section className={styles.resultVisual}>
          <div className={styles.resultVisualHead}>
            <div><span>{result.label}</span><strong>Geometry verified · 310 sq ft</strong></div>
            <div className={styles.viewSwitch} role="group" aria-label="Result view">
              <button type="button" aria-pressed={view === "room"} className={view === "room" ? styles.viewActive : undefined} onClick={() => onSetView("room")}><ScanLine size={14} /> Room study</button>
              <button type="button" aria-pressed={view === "plan"} className={view === "plan" ? styles.viewActive : undefined} onClick={() => onSetView("plan")}><Map size={14} /> 2D Plan</button>
              <button type="button" aria-pressed={view === "three"} className={view === "three" ? styles.viewActive : undefined} onClick={() => onSetView("three")}><Box size={14} /> 3D Preview</button>
              <button type="button" aria-pressed={view === "preview"} className={view === "preview" ? styles.viewActive : undefined} onClick={() => onSetView("preview")}><ImageIcon size={14} /> Final visualization</button>
            </div>
          </div>
          <div className={styles.resultSurface} key={view}>
            {view === "three" ? (
              <div className={styles.planningPreview}>
                <FurniturePreview plan={result.plan} />
                <button type="button" className={styles.finalReveal} onClick={() => onSetView("preview")}><ImageIcon size={16} /> See the finished space <ArrowRight size={16} /></button>
              </div>
            ) : view !== "preview" ? (
              <div className={styles.verifiedPlan}>
                <SpatialCanvas key={`${objective}-${view}`} plan={result.plan} initialView={view === "room" ? "room" : "measured"} showToolbar={false} focusMainSpace />
                <span><ShieldCheck size={14} /> {view === "room" ? "Illustrative room study · exact dimensions in measured plan" : "Measured placements · clear routes checked"}</span>
              </div>
            ) : (
              <div className={join(styles.finalPreview, styles[`renderPhase${visualizationState}`])}>
                <Image src={result.preview} alt={result.previewAlt} fill sizes="(max-width: 900px) 94vw, 62vw" style={{ objectPosition: result.previewPosition ?? "50% 50%" }} />
                {visualizationState === "complete" ? (
                  <span><ShieldCheck size={14} /> Your new space · geometry verified</span>
                ) : (
                  <div className={styles.renderStatus}>
                    <span><ImageIcon size={16} /> New space preview</span>
                    <b>{renderCopy[0]}</b>
                    <small>{renderCopy[1]}</small>
                    <div className={styles.renderStates}>
                      <i className={visualizationState !== "idle" ? styles.renderStateActive : undefined}>Composition</i>
                      <i className={visualizationState === "materials" || visualizationState === "lighting" ? styles.renderStateActive : undefined}>Materials</i>
                      <i className={visualizationState === "lighting" ? styles.renderStateActive : undefined}>Light</i>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
          <div className={styles.resultMetricStrip}>
            <div><strong>{result.plan.reused}/{demoFurnitureTotal}</strong><span>items reused</span></div>
            <div><strong>HK${result.plan.spendingAvoided.toLocaleString()}</strong><span>replacement cost avoided</span></div>
            <div><strong>{result.plan.purchases}</strong><span>new {result.plan.purchases === 1 ? "item" : "items"} needed</span></div>
            <div><strong>{result.plan.walkwayClearance} cm</strong><span>clear route</span></div>
          </div>
        </section>

        <aside className={styles.resultDecision}>
          <span className={styles.verifiedLine}><CircleCheck size={16} /> Selected plan verified</span>
          <h2>{objective === "keep" ? "The things you love. Room to enjoy them." : objective === "work" ? "A brighter place to do your best work." : "Make room for one more at the table."}</h2>
          <p>{result.decision}</p>
          {marketplaceState === "complete" ? (
            <div className={styles.recommendation}>
              <div className={styles.recommendationImage}><Image src={result.recommendation.image} alt={result.recommendation.name} fill sizes="150px" /></div>
              <div>
                <small>Complete the space · verified fit</small>
                <h3>{result.recommendation.name}</h3>
                <strong>{result.recommendation.dimensions} · {result.recommendation.price}</strong>
                <p>{result.recommendation.reason}</p>
                <span>Replaces: {result.recommendation.replaces}</span>
              </div>
            </div>
          ) : (
            <div className={styles.marketplaceSkeleton} role="status">
              <span><Search size={16} /> Finding a table for this space</span>
              <div><i /><i /><i /></div>
              <small>Comparing footprints and walking clearance</small>
            </div>
          )}
          {objective === "keep" ? <LinkButton href="/shop" variant="secondary">Compare fitted tables</LinkButton> : null}
          <div className={styles.finalSummary}>
            <span><Recycle size={18} /><b>{result.plan.reused} pieces continue their journey</b></span>
            <span><Ruler size={18} /><b>{result.plan.purchases === 1 ? "Only 1 purchase is dimension-checked" : `Only ${result.plan.purchases} purchases are dimension-checked`}</b></span>
          </div>
        </aside>
      </div>
      <StageActions onBack={onBack}>
        <div className={styles.completeActions}><div className={styles.saveAction}><Button type="button" icon={savedObjective === objective ? Check : BookmarkCheck} onClick={() => {
          try {
            window.localStorage.setItem("renest-saved-plan-v1", JSON.stringify({ version: 1, objectiveId: objective, objective: result.label, home: "Northern Metropolis · 310 sq ft", plan: result.plan, recommendation: result.recommendation }));
            setSavedObjective(objective);
            onSaved(objective);
            setSaveError(false);
          } catch { setSaveError(true); }
        }}>{savedObjective === objective ? "Plan saved" : "Save this plan"}</Button><span role="status">{saveError ? "Storage is unavailable. Please allow local storage and try again." : savedObjective === objective ? "Saved on this device." : ""}</span></div><LinkButton href="/recommendations">See pieces you may like</LinkButton></div>
      </StageActions>
    </section>
  );
}
