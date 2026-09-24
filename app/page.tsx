import { ArrowDown, ArrowRight, Box, MoveRight, ScanLine, Sparkles } from "lucide-react";
import { LinkButton, Eyebrow } from "@/components/common/ui";
import { FloorPlan } from "@/components/floor-plan/floor-plan";
import { plans } from "@/lib/demo-data";

export default function HomePage() {
  return (
    <main className="landing">
      <section className="hero">
        <div className="hero-plan" aria-hidden="true"><FloorPlan mode="new" plan={plans[0]} showWalkway compact /></div>
        <div className="hero-wash" />
        <div className="hero-content">
          <Eyebrow>Furniture migration for compact homes</Eyebrow>
          <h1>Your furniture already has a home.<br />Let&apos;s find its next one.</h1>
          <p>Scan your current home and your new home. ReSpace figures out what fits, where it goes, and what you actually need to buy.</p>
          <div className="hero-actions">
            <LinkButton href="/scan-old">Start my move</LinkButton>
            <LinkButton href="/optimize" variant="secondary">Watch demo</LinkButton>
          </div>
          <div className="hero-proof"><span><b>380</b> sq ft today</span><MoveRight size={16} /><span><b>310</b> sq ft next</span><i /><span className="verified">Geometry verified</span></div>
        </div>
        <a href="#workflow" className="scroll-cue" aria-label="See how it works"><ArrowDown size={16} /></a>
      </section>

      <section className="workflow-band" id="workflow">
        <div className="workflow-intro">
          <Eyebrow>Alex&apos;s move</Eyebrow>
          <h2>Move into less space.<br />Keep more of what matters.</h2>
        </div>
        <div className="workflow-track">
          <div><span><ScanLine size={20} /></span><b>OLD HOME</b><h3>Scan what you own</h3><p>Room geometry and seven existing items.</p></div>
          <ArrowRight className="workflow-arrow" />
          <div><span><Sparkles size={20} /></span><b>AI SPACE PLANNING</b><h3>Optimize what fits</h3><p>Lifestyle intent meets measurable constraints.</p></div>
          <ArrowRight className="workflow-arrow" />
          <div><span><Box size={20} /></span><b>NEW HOME</b><h3>Buy only what&apos;s missing</h3><p>Every recommendation is dimension-checked.</p></div>
        </div>
      </section>
    </main>
  );
}
