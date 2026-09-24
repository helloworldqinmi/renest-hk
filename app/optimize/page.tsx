"use client";

import { useEffect, useMemo, useState } from "react";
import { BrainCircuit, Check, CircleCheck, Maximize2, MoveUpRight, Ruler, Sparkles, Sun, X } from "lucide-react";
import { useDemo } from "@/components/state-provider";
import { FloorPlan } from "@/components/floor-plan/floor-plan";
import { MigrationAnimation } from "@/components/planning/migration-animation";
import { Button, Eyebrow, LinkButton, cn } from "@/components/common/ui";
import { demoScenario, furnitureInventory, plans } from "@/lib/demo-data";
import { validateLayout } from "@/lib/geometry";

const optimizationSteps = ["Understanding room geometry...", "Testing 1,248 possible placements...", "Checking door clearance...", "Matching your lifestyle preferences...", "Evaluating furniture reuse...", "3 optimal plans found"];

export default function OptimizePage() {
  const { selectedLayout, selectLayout } = useDemo();
  const [optimizing, setOptimizing] = useState(true);
  const [step, setStep] = useState(0);
  const [selectedFurniture, setSelectedFurniture] = useState<string | null>("desk");
  const [migrationOpen, setMigrationOpen] = useState(false);
  const currentPlan = plans.find((plan) => plan.id === selectedLayout) ?? plans[0];
  const currentFurniture = furnitureInventory.find((item) => item.id === selectedFurniture);
  const validation = useMemo(() => validateLayout(currentPlan), [currentPlan]);

  useEffect(() => {
    const timers = optimizationSteps.map((_, index) => window.setTimeout(() => setStep(index), index * 580));
    timers.push(window.setTimeout(() => setOptimizing(false), 3500));
    return () => timers.forEach(window.clearTimeout);
  }, []);

  if (optimizing) return (
    <main className="optimizer-loading">
      <div className="optimizer-radar"><div /><div /><span><Sparkles size={27} /></span></div>
      <Eyebrow>ReNest spatial optimizer</Eyebrow><h1>{optimizationSteps[step]}</h1>
      <div className="optimizer-progress"><span style={{ width: `${((step + 1) / optimizationSteps.length) * 100}%` }} /></div>
      <p>AI understands how you want to live.<br />Geometry ensures the plan actually fits.</p>
    </main>
  );

  return (
    <main className="page-shell optimize-page">
      <div className="page-head optimize-head"><div className="page-head-copy"><Eyebrow>3 feasible plans found</Eyebrow><h1>Make every centimetre count.</h1><p>Compare three strategies for Alex&apos;s 310 sq ft home. Every placement is dimensionally checked.</p></div><Button icon={MoveUpRight} variant="secondary" onClick={() => setMigrationOpen(true)}>See what moves</Button></div>
      <section className="technical-principle" aria-label="How ReNest plans">
        <div><BrainCircuit size={24} /><span><b>AI</b> understands how you want to live.</span></div>
        <div className="principle-divider" />
        <div><Ruler size={24} /><span><b>Geometry</b> ensures it actually fits.</span></div>
      </section>
      <div className="plan-tabs" role="tablist">
        {plans.map((plan, index) => (
          <button key={plan.id} role="tab" aria-selected={selectedLayout === plan.id} className={cn("plan-tab", selectedLayout === plan.id && "is-active")} onClick={() => selectLayout(plan.id)}>
            <span>{plan.name}{index === 0 ? <b>Recommended</b> : null}</span><h3>{plan.shortName}</h3>
            <div className="plan-mini-metrics"><span><b>{plan.reused}/{demoScenario.furnitureTotal}</b> reused</span><span><b>{plan.openArea} m²</b> open</span><span><b>{plan.cost ? `HK$${plan.cost.toLocaleString()}` : "HK$0"}</b> new spend</span></div>
          </button>
        ))}
      </div>
      <div className="optimization-workspace">
        <section className="plan-canvas card">
          <div className="panel-title"><div><span>{currentPlan.name.toUpperCase()} · {currentPlan.shortName.toUpperCase()}</span><h2>Northern Metropolis · 310 sq ft</h2></div><span className={cn("status-pill", validation.feasible ? "green" : "coral")}>{validation.feasible ? <CircleCheck size={12} /> : <X size={12} />}{validation.feasible ? "Geometry verified" : "Review layout"}</span></div>
          <FloorPlan mode="new" plan={currentPlan} selectedId={selectedFurniture} onSelect={setSelectedFurniture} showWalkway />
          <div className="canvas-tip"><Maximize2 size={14} /> Select furniture to inspect its placement</div>
        </section>
        <aside className="decision-panel card">
          <div className="decision-top"><div><Eyebrow>Selected plan</Eyebrow><h2>{currentPlan.shortName}</h2></div>{selectedLayout === "reuse" ? <span className="status-pill green"><Check size={12} /> Recommended</span> : null}</div>
          <div className="selected-plan-metrics">
            <div><strong>{currentPlan.reused} / {demoScenario.furnitureTotal}</strong><span>Furniture reused</span></div>
            <div><strong>HK${currentPlan.spendingAvoided.toLocaleString()}</strong><span>Replacement spend avoided</span></div>
            <div><strong>{currentPlan.openArea} m²</strong><span>Open floor area</span></div>
            <div><strong>{currentPlan.purchases}</strong><span>New {currentPlan.purchases === 1 ? "item" : "items"} required</span></div>
          </div>
          <div className="selection-title"><span>SELECTED FURNITURE</span><h3>{currentFurniture?.name ?? "Plan overview"}</h3>{currentFurniture ? <p>{Math.round(currentFurniture.dimensions.width * 100)} × {Math.round(currentFurniture.dimensions.depth * 100)} cm</p> : null}</div>
          {selectedFurniture === "desk" ? (
            <div className="object-reason"><span className="reason-icon"><Sun size={22} /></span><div><span className="status-pill green">Keep</span><b>Natural light: Excellent</b><p>You said working from home is important. This location keeps the desk 0.6 m from the bedroom window.</p></div><div className="reason-measure"><span>CLEARANCE</span><strong>76 cm ✓</strong></div></div>
          ) : selectedFurniture === "dining-table" && selectedLayout === "reuse" ? (
            <div className="table-geometry">
              <div><span>CURRENT DINING TABLE</span><strong>{demoScenario.currentTable.widthCm} × {demoScenario.currentTable.depthCm} cm</strong><b className="warning">Replace</b><dl><dt>Walking clearance</dt><dd className="warning">{demoScenario.currentTable.clearanceCm} cm ×</dd><dt>Minimum preferred</dt><dd>70 cm</dd></dl><p>Your current dining table creates a bottleneck near the living-room entrance.</p></div>
              <div><span>COMPACT FOLDING TABLE</span><strong>{demoScenario.replacementTable.widthCm} × {demoScenario.replacementTable.depthCm} cm</strong><b className="success">Verified fit</b><dl><dt>Walking clearance</dt><dd className="success">{demoScenario.replacementTable.clearanceCm} cm ✓</dd><dt>Space unlocked</dt><dd>+{demoScenario.replacementTable.spaceUnlockedSqM} m²</dd></dl></div>
            </div>
          ) : (
            <div className="object-reason"><span className="reason-icon"><Check size={22} /></span><div><span className="status-pill green">{selectedLayout === "space" && selectedFurniture === "sofa" ? "Replace" : "Keep"}</span><b>{selectedLayout === "space" ? "Open-space priority" : selectedLayout === "cost" ? "Cost-saving placement" : "Existing item retained"}</b><p>This placement stays inside the room boundary and protects the strongest available walking route.</p></div></div>
          )}
          <div className="decision-copy"><h3>Why this plan</h3><p>{selectedLayout === "reuse" ? "Keep 6 of 7 items. Replace only the oversized dining table that causes a 43 cm bottleneck." : selectedLayout === "space" ? "Use smaller living-room pieces to unlock the most open floor area." : "Keep all 7 items and spend nothing, accepting a tighter daily walking route."}</p></div>
          <div className="tradeoff"><span>TRADE-OFF</span><p>{selectedLayout === "reuse" ? "Replacing one oversized table unlocks 1.5 m² more usable circulation space while keeping the sofa and storage." : selectedLayout === "space" ? "More breathing room requires two purchases and the resale of three existing items." : "Zero purchase cost comes with two daily usability compromises."}</p></div>
          {currentPlan.compromises ? <div className="compromises">{currentPlan.compromises.map((item) => <span key={item}><X size={12} />{item}</span>)}</div> : null}
          <div className="decision-actions"><Button variant="secondary" icon={MoveUpRight} onClick={() => setMigrationOpen(true)}>See what moves</Button><LinkButton href="/shop">Choose this plan</LinkButton></div>
        </aside>
      </div>
      <MigrationAnimation open={migrationOpen} onClose={() => setMigrationOpen(false)} />
    </main>
  );
}
