"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { HelpCircle, RotateCcw } from "lucide-react";
import { useState } from "react";
import { useDemo } from "@/components/state-provider";
import { Button, Modal, cn } from "@/components/common/ui";

const stepRoutes = [
  { label: "Scan", routes: ["/scan-old", "/inventory", "/scan-new"] },
  { label: "Plan", routes: ["/preferences"] },
  { label: "Fit", routes: ["/optimize", "/shop"] },
  { label: "Move", routes: ["/move-plan", "/impact"] },
];

export function AppHeader() {
  const pathname = usePathname();
  const router = useRouter();
  const { resetDemo } = useDemo();
  const [showHow, setShowHow] = useState(false);
  const active = stepRoutes.findIndex((step) => step.routes.includes(pathname));
  const isInteractiveDemo = pathname === "/demo";

  function reset() {
    resetDemo();
    router.push("/");
  }

  return (
    <>
      <header className="app-header">
        <Link href="/" className="brand" aria-label="ReNest HK home">
          <span className="brand-mark"><span /></span>
          <span>ReNest <b>HK</b></span>
        </Link>
        {pathname !== "/" && !isInteractiveDemo ? (
          <nav className="progress-steps" aria-label="Move progress">
            {stepRoutes.map((step, index) => (
              <div key={step.label} className={cn("progress-step", index === active && "is-active", index < active && "is-done")}>
                <span>{index < active ? "✓" : index + 1}</span>
                <em>{step.label}</em>
              </div>
            ))}
          </nav>
        ) : <div className="tagline-nav">{isInteractiveDemo ? "Interactive move lab · 90-second demo" : "Move what matters. Fit what works."}</div>}
        <button className="header-action" onClick={() => setShowHow(true)}><HelpCircle size={17} /> How it works</button>
      </header>

      {pathname !== "/" && !isInteractiveDemo ? (
        <button className="demo-reset" onClick={reset} title="Reset the deterministic Alex demo">
          <RotateCcw size={15} /> Reset Demo
        </button>
      ) : null}

      <Modal open={showHow} onClose={() => setShowHow(false)} title="How ReNest works" wide>
        <div className="how-grid">
          {[
            ["01", "Spatial Capture", "iPhone RoomPlan produces room geometry and furniture dimensions."],
            ["02", "Preference Understanding", "Language models convert lifestyle requirements into measurable constraints."],
            ["03", "Spatial Optimization", "Geometry checks boundaries, collisions, door swings and circulation."],
            ["04", "Commerce Matching", "Marketplace products are dimension-filtered before recommendation."],
          ].map(([number, title, copy]) => (
            <div className="how-step" key={number}><span>{number}</span><h3>{title}</h3><p>{copy}</p></div>
          ))}
        </div>
        <div className="architecture-flow">
          <span>iPhone / RoomPlan</span><i>→</i><span>Spatial Model</span><i>→</i><span>AI Constraints</span><i>→</i><span>Geometry Optimizer</span><i>→</i><span>Move Plan</span>
        </div>
      </Modal>
    </>
  );
}
