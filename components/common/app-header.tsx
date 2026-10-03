"use client";

import { LanguageSwitch, useLocale } from "@/components/locale-provider";
import Link from "@/components/common/motion-link";
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
  const {t,tr}=useLocale();
  const pathname = usePathname();
  const [showHow, setShowHow] = useState(false);
  const active = stepRoutes.findIndex((step) => step.routes.includes(pathname) || (pathname.startsWith("/store/") && step.label === "Fit"));
  const isEditorial = pathname === "/" || pathname === "/about" || pathname === "/recommendations" || pathname.startsWith("/store/");
  const isInteractiveDemo = pathname === "/demo";

  if (isInteractiveDemo) return null;

  return (
    <>
      <header style={{ viewTransitionName: "site-header" }} className={`app-header ${pathname === "/" ? "home-header" : ""}`}>
        <Link href="/" className="brand" aria-label={t("ReNest HK home")}>
          <BrandLogo />
        </Link>
        {!isEditorial && !isInteractiveDemo ? (
          <nav className="progress-steps" aria-label={t("Move progress")}>
            {stepRoutes.map((step, index) => (
              <div key={step.label} className={cn("progress-step", index === active && "is-active", index < active && "is-done")}>
                <span>{index < active ? "✓" : index + 1}</span>
                <em>{step.label}</em>
              </div>
            ))}
          </nav>
        ) : isEditorial ? <nav className="header-nav" aria-label={t("Main navigation")}><Link href="/recommendations">{t("Furniture shop")}</Link><Link href="/demo">{tr("My moving studio","我的布置","我的佈置")}</Link><Link href="/#how-it-works">{t("How it works")}</Link><Link href="/about" aria-current={pathname === "/about" ? "page" : undefined}>{t("About us")}</Link></nav> : <span className="workspace-label">{t("YOUR MOVING WORKSPACE")}</span>}
        <div className="header-end"><LanguageSwitch/><Link href="/#saved-plans">{tr("Past arrangements","过往布置","過往佈置")}</Link>{isEditorial && <Link href="/about" className="mobile-about" aria-current={pathname === "/about" ? "page" : undefined}>{t("About us")}</Link>}{isEditorial ? <Link href="/demo?step=old" className="button button-primary">{t("Try the demo")}<ArrowRight size={14} /></Link> : <button className="header-action" onClick={() => setShowHow(true)}>{t("How it works")}</button>}</div>
      </header>

      <Modal open={showHow} onClose={() => setShowHow(false)} title={t("How your move works")} wide>
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
