"use client";

import { useEffect, useMemo, useState } from "react";
import { Check, ChevronRight, CircleCheck, Maximize2, MoveUpRight, Sparkles, Sun, X } from "lucide-react";
import { useDemo } from "@/components/state-provider";
import { FloorPlan } from "@/components/floor-plan/floor-plan";
import { MigrationAnimation } from "@/components/planning/migration-animation";
import { Button, Eyebrow, LinkButton, cn } from "@/components/common/ui";
import { furnitureInventory, plans } from "@/lib/demo-data";
import { validateLayout } from "@/lib/geometry";

const optimizationSteps = ["Understanding room geometry...", "Testing 1,248 possible placements...", "Checking door clearance...", "Matching your lifestyle preferences...", "Evaluating furniture reuse...", "3 optimal plans found"];

export default function OptimizePage() {
  const { selectedLayout, selectLayout } = useDemo();
  const [optimizing, setOptimizing] = useState(true);
  const [step, setStep] = useState(0);
  const [selectedFurniture, setSelectedFurniture] = useState<string | null>("desk");
  const [migrationOpen, setMigrationOpen] = useState(false);
  const currentPlan = plans.find((plan) => plan.id === selectedLayout) ?? plans[0];
  const validation = useMemo(() => validateLayout(currentPlan), [currentPlan]);

  useEffect(() => {
    const timers = optimizationSteps.map((_, index) => window.setTimeout(() => setStep(index), index * 580));
    timers.push(window.setTimeout(() => setOptimizing(false), 3500));
    return () => timers.forEach(window.clearTimeout);
  }, []);

  if (optimizing) return (
    <main className="optimizer-loading">
      <div className="optimizer-radar"><div /><div /><span><Sparkles size={27} /></span></div>
      <Eyebrow>ReSpace spatial optimizer</Eyebrow><h1>{optimizationSteps[step]}</h1>
      <div className="optimizer-progress"><span style={{ width: `${((step + 1) / optimizationSteps.length) * 100}%` }} /></div>
      <p>AI understands how you want to live.<br />Geometry ensures the plan actually fits.</p>
    </main>
  );

  return (
    <main className="page-shell optimize-page">
      <div className="page-head optimize-head"><div className="page-head-copy"><Eyebrow>3 optimal plans found</Eyebrow><h1>Three ways to make 310 sq ft work.</h1><p>Every plan passes room boundaries, collision checks and door-clearance rules.</p></div><Button icon={MoveUpRight} variant="secondary" onClick={() => setMigrationOpen(true)}>See what moves</Button></div>
      <div className="plan-tabs" role="tablist">
        {plans.map((plan, index) => (
          <button key={plan.id} role="tab" aria-selected={selectedLayout === plan.id} className={cn("plan-tab", selectedLayout === plan.id && "is-active")} onClick={() => selectLayout(plan.id)}>
            <span>{plan.name}{index === 0 ? <b>Recommended</b> : null}</span><h3>{plan.shortName}</h3><p>{plan.description}</p>
            <div className="plan-mini-metrics"><span><b>{plan.reused}/7</b> reused</span><span><b>{plan.openArea} m²</b> open</span><span><b>{plan.cost ? `HK$${plan.cost.toLocaleString()}` : "HK$0"}</b> cost</span></div>
          </button>
        ))}
      </div>
      <div className="optimization-workspace">
        <section className="plan-canvas card">
          <div className="panel-title"><div><span>{currentPlan.name.toUpperCase()} · {currentPlan.shortName.toUpperCase()}</span><h2>Northern Metropolis · 310 sq ft</h2></div><span className={cn("status-pill", validation.feasible ? "green" : "coral")}>{validation.feasible ? <CircleCheck size={12} /> : <X size={12} />}{validation.feasible ? "Geometry verified" : "Review layout"}</span></div>
          <FloorPlan mode="new" plan={currentPlan} selectedId={selectedFurniture} onSelect={setSelectedFurniture} showWalkway={selectedLayout === "reuse"} />
          <div className="canvas-tip"><Maximize2 size={14} /> Select furniture to inspect its placement</div>
        </section>
        <aside className="decision-panel card">
          <div className="decision-top"><Eyebrow>Why ReSpace chose this</Eyebrow><h2>{selectedFurniture ? furnitureInventory.find((item) => item.id === selectedFurniture)?.name : currentPlan.shortName}</h2></div>
          {selectedFurniture === "desk" ? (
            <div className="object-reason"><span className="reason-icon"><Sun size={22} /></span><div><b>Natural light score: Excellent</b><p>Placed 0.6 m from the bedroom window because working from home is a priority.</p></div><div className="reason-measure"><span>WINDOW DISTANCE</span><strong>0.6 m</strong></div></div>
          ) : selectedFurniture === "dining-table" && selectedLayout === "reuse" ? (
            <div className="table-comparison"><div><span>CURRENT TABLE</span><strong>140 × 80 cm</strong><b className="warning">Only 43 cm circulation</b></div><ChevronRight /><div><span>REPLACEMENT</span><strong>90 × 60 cm</strong><b className="success">82 cm clearance</b></div></div>
          ) : (
            <div className="object-reason"><span className="reason-icon"><Check size={22} /></span><div><b>{selectedLayout === "space" ? "Open-space priority" : selectedLayout === "cost" ? "Cost-saving placement" : "Existing item retained"}</b><p>This placement stays within room boundaries and preserves the strongest available circulation route.</p></div></div>
          )}
          <div className="decision-copy"><h3>Plan reasoning</h3><p>{selectedLayout === "reuse" ? "ReSpace kept 6 of your 7 existing furniture items. The original dining table was replaced because it created a 43 cm bottleneck near the living-room entrance." : selectedLayout === "space" ? "The sofa, dining table and coffee table are exchanged for smaller alternatives to make the living area feel substantially more open." : "Every existing item is retained, avoiding all new purchases, with tighter circulation and less natural light at the desk."}</p></div>
          <div className="tradeoff"><span>TRADE-OFF</span><p>{selectedLayout === "reuse" ? "Replacing one oversized table unlocks 1.5 m² more usable circulation space while keeping the sofa and storage." : selectedLayout === "space" ? "More breathing room requires two purchases and the resale of three existing items." : "Zero purchase cost comes with two daily usability compromises."}</p></div>
          {currentPlan.compromises ? <div className="compromises">{currentPlan.compromises.map((item) => <span key={item}><X size={12} />{item}</span>)}</div> : null}
          <div className="decision-actions"><Button variant="secondary" icon={MoveUpRight} onClick={() => setMigrationOpen(true)}>See what moves</Button><LinkButton href="/shop">Choose this plan</LinkButton></div>
        </aside>
      </div>
      <MigrationAnimation open={migrationOpen} onClose={() => setMigrationOpen(false)} />
    </main>
  );
}
