import Image from "next/image";
import { ArrowDown, MoveRight } from "lucide-react";
import { LinkButton, Eyebrow } from "@/components/common/ui";
import { demoScenario } from "@/lib/demo-data";

export default function HomePage() {
  return (
    <main className="landing">
      <section className="hero">
        <div className="hero-photo">
          <Image
            src="/photos/hero-migration.webp"
            alt="Furniture moving from your lived-in Kowloon apartment into a compact empty new home"
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
            <LinkButton href="/demo">Start Demo</LinkButton>
            <LinkButton href="#difference" variant="ghost" className="hero-secondary-link">How it works</LinkButton>
          </div>
          <div className="hero-proof"><span><b>{demoScenario.currentHome.areaSqFt}</b> sq ft today</span><MoveRight size={16} /><span><b>{demoScenario.newHome.areaSqFt}</b> sq ft next</span><i /><span className="verified">{demoScenario.reused} of {demoScenario.furnitureTotal} items reused</span></div>
        </div>
        <a href="#difference" className="scroll-cue" aria-label="See how it works"><ArrowDown size={16} /></a>
      </section>

      <section className="difference-band" id="difference">
        <div className="difference-head">
          <h2>Furniture migration, not image generation.</h2>
        </div>
        <div className="difference-steps">
          <div><span>01</span><h3>Scan what you own</h3><p>Room and furniture dimensions, captured together.</p></div>
          <MoveRight className="difference-arrow" size={20} />
          <div><span>02</span><h3>Fit it into your new home</h3><p>Every item tested against real clearance.</p></div>
          <MoveRight className="difference-arrow" size={20} />
          <div><span>03</span><h3>Buy only what&apos;s missing</h3><p>Only remaining gaps become recommendations.</p></div>
        </div>
      </section>
    </main>
  );
}
