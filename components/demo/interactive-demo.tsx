"use client";

import Image from "next/image";
import { useEffect, useMemo, useRef, useState } from "react";
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
  Sparkles,
  UtensilsCrossed,
} from "lucide-react";
import { FloorPlan } from "@/components/floor-plan/floor-plan";
import { Button } from "@/components/common/ui";
import { furnitureInventory, plans } from "@/lib/demo-data";
import { objectiveConfigs, objectiveOrder, type DemoObjective } from "@/lib/interactive-demo";
import styles from "./interactive-demo.module.css";

type ScanState = "idle" | "room" | "furniture" | "measuring" | "complete";
type MapState = "idle" | "boundaries" | "openings" | "dimensions" | "complete";
type OptimizationState = "idle" | "exploring" | "clearance" | "ranking" | "complete";
type VisualizationState = "idle" | "composition" | "materials" | "lighting" | "complete";
type MarketplaceState = "idle" | "searching" | "complete";

const stages = ["Scan", "Map", "Plan", "Fit", "Move"];
const featuredInventory = ["sofa", "desk", "bed", "wardrobe", "coffee-table", "bookshelf", "dining-table"]
  .map((id) => furnitureInventory.find((item) => item.id === id))
  .filter((item): item is (typeof furnitureInventory)[number] => Boolean(item));
const totalInventoryValue = furnitureInventory.reduce((total, item) => total + (item.estimatedValue ?? 0), 0);
const furnitureAssetById: Partial<Record<string, string>> = {
  sofa: "/photos/furniture-sofa.webp",
  desk: "/photos/furniture-chair.webp",
  wardrobe: "/photos/furniture-cabinet.webp",
  "coffee-table": "/photos/furniture-coffee-table.webp",
  bookshelf: "/photos/furniture-bookshelf.webp",
  "dining-table": "/photos/furniture-dining-table.webp",
};
const fitTestItems = ["sofa", "coffee-table", "bookshelf", "wardrobe", "dining-table"];

function join(...classes: Array<string | false | undefined>) {
  return classes.filter(Boolean).join(" ");
}

export function InteractiveDemo() {
  const [stage, setStage] = useState(0);
  const [furthestStage, setFurthestStage] = useState(0);
  const [scanState, setScanState] = useState<ScanState>("idle");
  const [selectedInventory, setSelectedInventory] = useState("sofa");
  const [mapState, setMapState] = useState<MapState>("idle");
  const [objective, setObjective] = useState<DemoObjective>("keep");
  const [selectedFitItem, setSelectedFitItem] = useState<string | null>(null);
  const [replacementTested, setReplacementTested] = useState(false);
  const [optimizationState, setOptimizationState] = useState<OptimizationState>("idle");
  const [visualizationState, setVisualizationState] = useState<VisualizationState>("idle");
  const [marketplaceState, setMarketplaceState] = useState<MarketplaceState>("idle");
  const [pendingObjective, setPendingObjective] = useState<DemoObjective | null>(null);
  const [resultView, setResultView] = useState<"plan" | "preview">("plan");
  const timers = useRef<number[]>([]);

  const selectedItem = useMemo(
    () => furnitureInventory.find((item) => item.id === selectedInventory) ?? furnitureInventory[0],
    [selectedInventory],
  );
  const displayedObjective = pendingObjective ?? objective;

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [stage]);

  useEffect(() => () => {
    timers.current.forEach((timer) => window.clearTimeout(timer));
  }, []);

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
    setScanState("room");
    later(() => setScanState("furniture"), 760);
    later(() => setScanState("measuring"), 1650);
    later(() => setScanState("complete"), 2700);
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
    setPendingObjective(null);
    setResultView("plan");
    advance(4);
    later(() => setOptimizationState("clearance"), 1250);
    later(() => setOptimizationState("ranking"), 2550);
    later(() => {
      setOptimizationState("complete");
      setMarketplaceState("searching");
      later(() => setMarketplaceState("complete"), 1150);
    }, 3750);
  }

  function changeResultView(view: "plan" | "preview") {
    setResultView(view);
    if (view === "preview" && visualizationState === "idle") {
      setVisualizationState("composition");
      later(() => setVisualizationState("materials"), 1350);
      later(() => setVisualizationState("lighting"), 3100);
      later(() => setVisualizationState("complete"), 4850);
    }
  }

  function switchObjective(nextObjective: DemoObjective) {
    if (nextObjective === displayedObjective || pendingObjective) return;
    setPendingObjective(nextObjective);
    later(() => {
      setObjective(nextObjective);
      setPendingObjective(null);
    }, 1200);
  }

  function resetDemo() {
    clearTimers();
    setStage(0);
    setFurthestStage(0);
    setScanState("idle");
    setSelectedInventory("sofa");
    setMapState("idle");
    setObjective("keep");
    setSelectedFitItem(null);
    setReplacementTested(false);
    setOptimizationState("idle");
    setVisualizationState("idle");
    setMarketplaceState("idle");
    setPendingObjective(null);
    setResultView("plan");
  }

  return (
    <main className={styles.demo}>
      <div className={styles.demoTopbar}>
        <div>
          <span>Alex&apos;s move</span>
          <strong>Kowloon <MoveRight size={14} /> Northern Metropolis</strong>
        </div>
        <button type="button" onClick={resetDemo} className={styles.resetButton}>
          <RotateCcw size={15} /> Restart
        </button>
      </div>

      <nav className={styles.stageRail} aria-label="Demo progress">
        {stages.map((label, index) => (
          <button
            type="button"
            key={label}
            disabled={index > furthestStage}
            className={join(styles.stageStep, index === stage && styles.stageActive, index < stage && styles.stageDone)}
            onClick={() => setStage(index)}
          >
            <span>{index < stage ? <Check size={13} /> : index + 1}</span>
            <em>{label}</em>
          </button>
        ))}
      </nav>

      {stage === 0 ? (
        <CurrentHomeStage
          scanState={scanState}
          selectedItem={selectedItem}
          selectedInventory={selectedInventory}
          onSelect={setSelectedInventory}
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
          objective={displayedObjective}
          view={resultView}
          visualizationState={visualizationState}
          marketplaceState={marketplaceState}
          scenarioSwitching={pendingObjective !== null}
          onSelectObjective={switchObjective}
          onSetView={changeResultView}
          onBack={() => setStage(3)}
        />
      ) : null}

      <div className={styles.liveStatus} aria-live="polite">
        {stage === 0 && scanState === "complete" ? "7 furniture items detected" : null}
        {stage === 1 && mapState === "complete" ? "New home mapped: 18% smaller" : null}
        {stage === 3 && replacementTested ? "Alternative verified: 82 cm clearance" : null}
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
    room: ["Reading the room", "Locking floor, wall and ceiling planes into one spatial model."],
    furniture: ["Detecting furniture", "Separating reusable objects from the room envelope."],
    measuring: ["Measuring every item", "Resolving width, depth and height for the move inventory."],
    complete: ["Spatial inventory ready", "Seven reusable objects now have verified dimensions."],
  }[scanState];

  return (
    <section className={styles.stage}>
      <StoryHeader
        step="01 · Current home"
        title="Start with what Alex already owns."
        copy="A room scan turns a lived-in Kowloon apartment into a measured furniture inventory, including the value already sitting in the room."
      />
      <div className={styles.scanWorkspace}>
        <div className={styles.photoPanel}>
          <Image src="/photos/old-home.webp" alt="Alex's lived-in Kowloon apartment" fill sizes="(max-width: 900px) 94vw, 62vw" priority />
          <div className={join(styles.scanFrame, scanStep > 0 && scanStep < 4 && styles.scanning)}>
            <i /><i /><i /><i />
            {scanStep > 0 && scanStep < 4 ? <span className={styles.scanPhaseBadge}><ScanLine size={18} /> {scanCopy[0]}</span> : null}
            {scanStep >= 2 ? (
              <div className={styles.objectBoxes} aria-hidden="true">
                <i className={styles.boxSofa}><span>Sofa</span></i>
                <i className={styles.boxTable}><span>Dining table</span></i>
                <i className={styles.boxDesk}><span>Work zone</span></i>
              </div>
            ) : null}
            {scanStep >= 3 ? (
              <div className={styles.measurementLines} aria-hidden="true">
                <span className={styles.measureSofa}>2.04 m</span>
                <span className={styles.measureTable}>1.40 m</span>
                <span className={styles.measureDesk}>1.20 m</span>
              </div>
            ) : null}
            {scanState === "complete" ? (
              <>
                <button type="button" className={join(styles.detectedTag, styles.tagSofa)} onClick={() => onSelect("sofa")}><span>Sofa</span><b>204 × 88 cm</b></button>
                <button type="button" className={join(styles.detectedTag, styles.tagTable)} onClick={() => onSelect("dining-table")}><span>Dining table</span><b>140 × 80 cm</b></button>
                <button type="button" className={join(styles.detectedTag, styles.tagDesk)} onClick={() => onSelect("desk")}><span>Work zone</span><b>120 × 60 cm</b></button>
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
                <li className={scanStep > 1 ? styles.completeLine : styles.activeLine}>Room volume detected</li>
                <li className={scanStep > 2 ? styles.completeLine : scanStep === 2 ? styles.activeLine : undefined}>Furniture objects separated</li>
                <li className={scanStep > 3 ? styles.completeLine : scanStep === 3 ? styles.activeLine : undefined}>Dimensions resolved</li>
              </ul>
            </div>
          ) : (
            <>
              <div className={styles.panelHeading}>
                <div><span>Detected inventory</span><h2>These are the things Alex owns.</h2></div>
                <b>7 / 7 kept</b>
              </div>
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
        title="The next home is 70 sq ft smaller."
        copy="The problem becomes visible before any layout is generated: the same seven items now have 18% less floor area to work with."
      />
      <div className={styles.comparisonWorkspace}>
        <article className={styles.homeImage}>
          <Image src="/photos/old-home.webp" alt="Alex's current larger apartment" fill sizes="(max-width: 900px) 94vw, 45vw" />
          <div className={styles.homeLabel}><span>Current home</span><strong>380 sq ft</strong><small>Kowloon</small></div>
        </article>
        <div className={styles.sizeDelta}><MoveRight size={22} /><strong>−18%</strong><span>less floor area</span></div>
        <article className={styles.homeImage}>
          <Image src="/photos/empty-new-home.webp" alt="Alex's smaller empty new apartment" fill sizes="(max-width: 900px) 94vw, 45vw" />
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
        title="What should the optimizer protect first?"
        copy="Choose one objective. This is not a mood prompt: it changes measurable layout rules, furniture decisions and the final result."
      />
      <div className={styles.priorityWorkspace}>
        <div className={styles.objectiveList} role="radiogroup" aria-label="Optimization objective">
          {objectiveOrder.map((id, index) => {
            const option = objectiveConfigs[id];
            const Icon = icons[id];
            return (
              <button type="button" role="radio" aria-checked={objective === id} key={id} className={join(styles.objectiveButton, objective === id && styles.objectiveSelected)} onClick={() => onSelect(id)}>
                <span>0{index + 1}</span>
                <Icon size={23} />
                <div><strong>{option.label}</strong><p>{option.description}</p></div>
                <i>{objective === id ? <Check size={15} /> : null}</i>
              </button>
            );
          })}
        </div>
        <aside className={styles.rulePanel}>
          <span><Sparkles size={14} /> Selected optimization rule</span>
          <h2>{selected.label}</h2>
          <p>{selected.rule}</p>
          <div className={styles.ruleTranslation}>
            <div><b>Human goal</b><span>{selected.shortLabel}</span></div>
            <MoveRight size={18} />
            <div><b>Geometry target</b><span>{selected.plan.walkwayClearance} cm route · {selected.plan.openArea} m² open</span></div>
          </div>
          <small>AI interprets the goal. Geometry decides whether the result is feasible.</small>
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
  const isConflict = selectedItem === "dining-table";
  const activePlan = replacementTested ? objectiveConfigs[objective].plan : plans[2];
  return (
    <section className={styles.stage}>
      <StoryHeader
        step="04 · Geometry before imagery"
        title={replacementTested ? "One smaller item unlocks the plan." : "The old table fits. The route does not."}
        copy={replacementTested ? "The compact alternative restores circulation. Now the optimizer can arrange the rest of the home around the selected priority." : "Physical fit is not enough. ReNest checks the space people need to walk, open doors and use storage every day."}
      />
      <div className={styles.fitWorkspace}>
        <section className={styles.blueprintPanel}>
          <div className={styles.blueprintHead}>
            <div><span>{replacementTested ? "Alternative fit test" : "Existing furniture fit test"}</span><strong>Northern Metropolis · 310 sq ft</strong></div>
            <b className={replacementTested ? styles.passLabel : styles.failLabel}>{replacementTested ? <CircleCheck size={13} /> : <AlertTriangle size={13} />}{replacementTested ? "82 cm · verified" : "43 cm · blocked"}</b>
          </div>
          <div className={styles.objectTestRail} aria-label="Detected furniture fit checks">
            {fitTestItems.map((id) => {
              const item = furnitureInventory.find((candidate) => candidate.id === id)!;
              const conflict = id === "dining-table" && !replacementTested;
              return (
                <button type="button" key={id} className={join(styles.objectTest, selectedItem === id && styles.objectTestSelected)} onClick={() => onSelectItem(id)}>
                  <span>{furnitureAssetById[id] ? <Image src={furnitureAssetById[id]!} alt="" fill sizes="68px" /> : <Box size={20} />}</span>
                  <b>{item.name}</b>
                  <em className={conflict ? styles.objectFail : styles.objectPass}>{conflict ? "Conflict" : "Fits"}</em>
                </button>
              );
            })}
          </div>
          <FloorPlan mode="new" plan={activePlan} selectedId={selectedItem} onSelect={onSelectItem} showWalkway />
          <div className={styles.blueprintHint}><Ruler size={14} /> Select a furniture item on the plan to inspect its geometry.</div>
        </section>
        <aside className={styles.fitInspector}>
          {!selectedItem ? (
            <div className={styles.inspectPrompt}>
              <span><AlertTriangle size={24} /></span>
              <h2>1 conflict found</h2>
              <p>Six items pass. One item creates a daily-use failure even though it stays inside the room boundary.</p>
              <button type="button" onClick={() => onSelectItem("dining-table")} className={styles.conflictButton}>
                <span><b>Dining Table</b><small>140 × 80 cm</small></span><em>Inspect conflict <ArrowRight size={14} /></em>
              </button>
            </div>
          ) : isConflict ? (
            <div className={styles.conflictDetail}>
              <span className={replacementTested ? styles.successIcon : styles.warningIcon}>{replacementTested ? <Check size={22} /> : <AlertTriangle size={22} />}</span>
              <small>{replacementTested ? "Verified alternative" : "Circulation conflict"}</small>
              <h2>{replacementTested ? "Compact Folding Table" : "Existing Dining Table"}</h2>
              <strong>{replacementTested ? "89 × 60 cm" : "140 × 80 cm"}</strong>
              <dl>
                <div><dt>Walking clearance</dt><dd className={replacementTested ? styles.goodText : styles.badText}>{replacementTested ? "82 cm ✓" : "43 cm ×"}</dd></div>
                <div><dt>Minimum preferred</dt><dd>70 cm</dd></div>
                <div><dt>Door / storage access</dt><dd className={replacementTested ? styles.goodText : styles.badText}>{replacementTested ? "Clear" : "Restricted"}</dd></div>
              </dl>
              <p>{replacementTested ? "The route is now 12 cm above the minimum and 1.5 m² of usable circulation returns." : "The table leaves only 43 cm beside the entrance. A chair in use also blocks the cabinet route."}</p>
              {!replacementTested ? <Button type="button" icon={Ruler} onClick={onTestReplacement}>Test a smaller table</Button> : null}
            </div>
          ) : (
            <div className={styles.inspectPrompt}>
              <span className={styles.successIcon}><Check size={23} /></span>
              <h2>This item passes.</h2>
              <p>Its footprint stays inside the usable zone and preserves the strongest available walking path.</p>
              <button type="button" onClick={() => onSelectItem("dining-table")} className={styles.conflictButton}><span><b>Dining Table</b><small>Conflict remains</small></span><em>Inspect <ArrowRight size={14} /></em></button>
            </div>
          )}
        </aside>
      </div>
      <StageActions onBack={onBack}>
        {replacementTested ? <Button type="button" icon={Sparkles} onClick={onContinue}>Optimize for {objectiveConfigs[objective].shortLabel}</Button> : null}
      </StageActions>
    </section>
  );
}

function OptimizationExperience({ objective, phase }: { objective: DemoObjective; phase: OptimizationState }) {
  const phaseIndex = { idle: 0, exploring: 1, clearance: 2, ranking: 3, complete: 4 }[phase];
  const target = objectiveConfigs[objective];
  const currentPlan = phase === "exploring" ? plans[1] : phase === "clearance" ? plans[2] : target.plan;
  const phaseCopy = {
    idle: ["Preparing the room model", "Loading verified furniture and room geometry."],
    exploring: ["Testing furniture arrangements", "Rotating and relocating existing pieces across usable room zones."],
    clearance: ["Checking everyday movement", "Rejecting collisions, blocked doors and routes below 70 cm."],
    ranking: ["Selecting the strongest plan", `Ranking feasible layouts against the ${target.shortLabel} goal.`],
    complete: ["Layout verified", "The strongest feasible arrangement is ready."],
  }[phase];

  return (
    <section className={join(styles.stage, styles.optimizationStage)}>
      <StoryHeader
        step="05 · Spatial optimization"
        title="Finding the strongest arrangement."
        copy="ReNest is moving real furniture through the measured home, rejecting layouts that fail clearance before ranking the feasible options."
      />
      <div className={styles.optimizationExperience}>
        <section className={styles.optimizationCanvas}>
          <div className={styles.optimizerHead}>
            <div><span>Live layout search</span><strong>Northern Metropolis · 310 sq ft</strong></div>
            <b><LayoutGrid size={14} /> {phase === "ranking" ? "3 finalists" : "Testing arrangements"}</b>
          </div>
          <div className={join(styles.planSearch, styles[`searchPhase${phaseIndex}`])}>
            <FloorPlan mode="new" plan={currentPlan} showWalkway={phaseIndex >= 2} scanning={phase === "exploring"} />
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
          <span className={styles.computeSignal}><Sparkles size={16} /> Spatial reasoning</span>
          <h2>{phaseCopy[0]}</h2>
          <p>{phaseCopy[1]}</p>
          <ol className={styles.computeSteps}>
            <li className={phaseIndex > 1 ? styles.stepComplete : phaseIndex === 1 ? styles.stepActive : undefined}>
              <span>{phaseIndex > 1 ? <Check size={14} /> : "1"}</span><div><b>Explore placements</b><small>Position and rotation candidates</small></div>
            </li>
            <li className={phaseIndex > 2 ? styles.stepComplete : phaseIndex === 2 ? styles.stepActive : undefined}>
              <span>{phaseIndex > 2 ? <Check size={14} /> : "2"}</span><div><b>Validate circulation</b><small>Collisions, doors and daily routes</small></div>
            </li>
            <li className={phaseIndex > 3 ? styles.stepComplete : phaseIndex === 3 ? styles.stepActive : undefined}>
              <span>{phaseIndex > 3 ? <Check size={14} /> : "3"}</span><div><b>Rank feasible plans</b><small>Reuse, openness and purchase cost</small></div>
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
  scenarioSwitching,
  onSelectObjective,
  onSetView,
  onBack,
}: {
  objective: DemoObjective;
  view: "plan" | "preview";
  visualizationState: VisualizationState;
  marketplaceState: MarketplaceState;
  scenarioSwitching: boolean;
  onSelectObjective: (objective: DemoObjective) => void;
  onSetView: (view: "plan" | "preview") => void;
  onBack: () => void;
}) {
  const result = objectiveConfigs[objective];
  const renderCopy = {
    idle: ["Ready to visualize", "Start from the verified floor plan."],
    composition: ["Building scene composition", "Translating verified placements into a camera-ready room."],
    materials: ["Resolving materials and objects", "Applying furniture form, finishes and surface detail."],
    lighting: ["Balancing light and depth", "Finishing daylight, shadows and spatial continuity."],
    complete: ["Realistic view ready", "Generated from the verified arrangement."],
  }[visualizationState];
  return (
    <section className={join(styles.stage, styles.resultStage)}>
      <StoryHeader
        step="05 · Move plan"
        title="A move plan built around what Alex owns."
        copy="Compare priorities without losing sight of the measured room. Every option remains traceable to a verified arrangement."
      />
      <div className={styles.resultObjectives} role="tablist" aria-label="Compare optimized objectives">
        {objectiveOrder.map((id) => {
          const option = objectiveConfigs[id];
          return (
            <button type="button" role="tab" aria-selected={objective === id} disabled={scenarioSwitching} key={id} onClick={() => onSelectObjective(id)} className={join(styles.resultObjective, objective === id && styles.resultObjectiveActive)}>
              <span>{option.label}{scenarioSwitching && objective === id ? <em>Rebalancing</em> : null}</span>
              <div><b>{option.plan.reused}/7</b><small>reused</small><b>{option.plan.openArea} m²</b><small>open</small><b>{option.plan.walkwayClearance} cm</b><small>route</small></div>
            </button>
          );
        })}
      </div>

      <div className={styles.resultWorkspace}>
        <section className={styles.resultVisual}>
          <div className={styles.resultVisualHead}>
            <div><span>{result.label}</span><strong>Geometry verified · 310 sq ft</strong></div>
            <div className={styles.viewSwitch} role="group" aria-label="Result view">
              <button type="button" className={view === "plan" ? styles.viewActive : undefined} onClick={() => onSetView("plan")}><Map size={14} /> Plan</button>
              <button type="button" className={view === "preview" ? styles.viewActive : undefined} onClick={() => onSetView("preview")}><ImageIcon size={14} /> Realistic view</button>
            </div>
          </div>
          <div className={styles.resultSurface} key={`${objective}-${view}`}>
            {view === "plan" ? (
              <div className={styles.verifiedPlan}>
                <FloorPlan mode="new" plan={result.plan} showWalkway />
                <span><ShieldCheck size={14} /> Geometry result · collisions and routes verified</span>
              </div>
            ) : (
              <div className={join(styles.finalPreview, styles[`renderPhase${visualizationState}`])}>
                <Image src={result.preview} alt={result.previewAlt} fill sizes="(max-width: 900px) 94vw, 62vw" style={{ objectPosition: result.previewPosition ?? "50% 50%" }} />
                {visualizationState === "complete" ? (
                  <span><Sparkles size={14} /> AI visualization · based on verified geometry</span>
                ) : (
                  <div className={styles.renderStatus}>
                    <span><Sparkles size={16} /> Generative visualization</span>
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
          {scenarioSwitching ? (
            <div className={styles.scenarioOverlay} role="status">
              <LayoutGrid size={19} />
              <span><b>Rebalancing for {result.label}</b><small>Retesting placements and clear routes</small></span>
            </div>
          ) : null}
          <div className={styles.resultMetricStrip}>
            <div><strong>{result.plan.reused}/7</strong><span>items reused</span></div>
            <div><strong>HK${result.plan.spendingAvoided.toLocaleString()}</strong><span>replacement cost avoided</span></div>
            <div><strong>{result.plan.purchases}</strong><span>new {result.plan.purchases === 1 ? "item" : "items"} needed</span></div>
            <div><strong>{result.plan.walkwayClearance} cm</strong><span>clear route</span></div>
          </div>
        </section>

        <aside className={styles.resultDecision}>
          <span className={styles.verifiedLine}><CircleCheck size={16} /> Selected plan verified</span>
          <h2>{result.outcome}</h2>
          <p>{result.decision}</p>
          <div className={styles.causeEffect}>
            <div><span>Because</span><b>the new home is 18% smaller</b></div>
            <ArrowRight size={16} />
            <div><span>Conflict</span><b>43 cm table bottleneck</b></div>
            <ArrowRight size={16} />
            <div><span>Therefore</span><b>{result.recommendation.name}</b></div>
          </div>
          {marketplaceState === "complete" ? (
            <div className={styles.recommendation}>
              <div className={styles.recommendationImage}><Image src={result.recommendation.image} alt={result.recommendation.name} fill sizes="150px" /></div>
              <div>
                <small>Marketplace match · verified fit</small>
                <h3>{result.recommendation.name}</h3>
                <strong>{result.recommendation.dimensions} · {result.recommendation.price}</strong>
                <p>{result.recommendation.reason}</p>
                <span>Replaces: {result.recommendation.replaces}</span>
              </div>
            </div>
          ) : (
            <div className={styles.marketplaceSkeleton} role="status">
              <span><Search size={16} /> Checking local marketplace inventory</span>
              <div><i /><i /><i /></div>
              <small>Filtering by verified dimensions and available stock</small>
            </div>
          )}
          <div className={styles.finalSummary}>
            <span><Recycle size={18} /><b>{result.plan.reused} pieces continue their journey</b></span>
            <span><Sparkles size={18} /><b>{result.plan.purchases === 1 ? "Only 1 purchase is dimension-checked" : `Only ${result.plan.purchases} purchases are dimension-checked`}</b></span>
          </div>
        </aside>
      </div>
      <StageActions onBack={onBack}>
        <p className={styles.switchHint}>Scenario changes reuse the room model, so alternatives resolve in about a second.</p>
      </StageActions>
    </section>
  );
}
