"use client";

import Link from "next/link";
import { BrandLogo } from "./brand-logo";
import { usePathname } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { useState } from "react";
import { Modal, cn } from "@/components/common/ui";

const stepRoutes = [
  { label: "Scan", routes: ["/scan-old", "/inventory", "/scan-new"] },
  { label: "Plan", routes: ["/preferences"] },
  { label: "Fit", routes: ["/optimize", "/shop", "/recommendations"] },
  { label: "Move", routes: ["/move-plan", "/impact"] },
];

export function AppHeader() {
  const pathname = usePathname();
  const [showHow, setShowHow] = useState(false);
  const active = stepRoutes.findIndex((step) => step.routes.includes(pathname) || (pathname.startsWith("/store/") && step.label === "Fit"));
  const isInteractiveDemo = pathname === "/demo";

  if (isInteractiveDemo) return null;

  return (
    <>
      <header className={`app-header ${pathname === "/" ? "home-header" : ""}`}>
        <Link href="/" className="brand" aria-label="ReNest HK home">
          <BrandLogo />
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
        ) : pathname === "/" ? <nav className="header-nav" aria-label="Main navigation"><Link href="/recommendations">Furniture shop</Link><Link href="/#how-it-works">How it works</Link></nav> : <span className="workspace-label">YOUR MOVING WORKSPACE</span>}
        <div className="header-end">{pathname === "/" ? <Link href="/demo" className="button button-primary">Try the demo <ArrowRight size={14} /></Link> : <button className="header-action" onClick={() => setShowHow(true)}>How it works</button>}</div>
      </header>

      <Modal open={showHow} onClose={() => setShowHow(false)} title="How your move works" wide>
        <div className="how-grid">
          {[
            ["01", "Scan your rooms", "Capture the old home, new home and the furniture moving with you."],
            ["02", "Check what fits", "See boundaries, door swings and the walking space each item leaves."],
            ["03", "Complete the move", "Keep what works and only shop for the space that remains."],
          ].map(([number, title, copy]) => (
            <div className="how-step" key={number}><span>{number}</span><h3>{title}</h3><p>{copy}</p></div>
          ))}
        </div>
      </Modal>
    </>
  );
}
