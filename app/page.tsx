import Image from "next/image";
import { ArrowDown, MoveRight, Ruler, ScanLine, ShoppingBag } from "lucide-react";
import { LinkButton, Eyebrow } from "@/components/common/ui";
import { demoScenario } from "@/lib/demo-data";

export default function HomePage() {
  return (
    <main className="landing">
      <section className="hero">
        <div className="hero-photo">
          <Image
            src="/photos/hero-migration.webp"
            alt="Alex's furniture moving from a lived-in Kowloon apartment into a compact empty new home"
            fill
            sizes="(max-width: 900px) 920px, 72vw"
            preload
          />
        </div>
        <div className="hero-wash" />
        <div className="hero-content">
          <Eyebrow>Furniture migration for compact homes</Eyebrow>
          <h1>Your furniture already has a home.<br />Let&apos;s find its next one.</h1>
          <p>Scan your old home and new home. ReNest tells you what to keep, where it fits, and what you actually need to buy.</p>
          <div className="hero-actions">
            <LinkButton href="/demo">Run 90-sec Demo</LinkButton>
            <LinkButton href="#difference" variant="secondary">How it works</LinkButton>
          </div>
          <div className="hero-proof"><span><b>{demoScenario.currentHome.areaSqFt}</b> sq ft today</span><MoveRight size={16} /><span><b>{demoScenario.newHome.areaSqFt}</b> sq ft next</span><i /><span className="verified">{demoScenario.reused} of {demoScenario.furnitureTotal} items reused</span></div>
        </div>
        <a href="#difference" className="scroll-cue" aria-label="See how it works"><ArrowDown size={16} /></a>
      </section>

      <section className="difference-band" id="difference">
        <div className="difference-head">
          <Eyebrow>Furniture migration, not image generation</Eyebrow>
          <h2>Not another AI interior designer.</h2>
        </div>
        <div className="difference-steps">
          <div><span>01</span><ScanLine size={23} /><h3>Scan what you own</h3><p>Capture existing furniture and its real dimensions.</p></div>
          <div><span>02</span><Ruler size={23} /><h3>Fit it into your new home</h3><p>Geometry optimization verifies whether furniture physically fits.</p></div>
          <div><span>03</span><ShoppingBag size={23} /><h3>Buy only what&apos;s missing</h3><p>Only see products already checked against your room dimensions.</p></div>
        </div>
      </section>
    </main>
  );
}
