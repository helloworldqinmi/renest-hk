"use client";

import { ArrowRight, Armchair, Check, CircleCheck, Leaf, RotateCcw, ShoppingBag } from "lucide-react";
import { useRouter } from "next/navigation";
import { useDemo } from "@/components/state-provider";
import { Button, Eyebrow, Metric } from "@/components/common/ui";

const items = ["Bed", "Desk", "Wardrobe", "Bookshelf", "Coffee table", "Sofa"];

export default function ImpactPage() {
  const router = useRouter();
  const { resetDemo } = useDemo();
  function restart() { resetDemo(); router.push("/"); }
  return (
    <main className="impact-page">
      <section className="impact-hero"><Eyebrow>Your circular move</Eyebrow><h1>You didn&apos;t need a new home full of new furniture.</h1><p>Alex&apos;s 310 sq ft home starts with what already matters, not from zero.</p><div className="impact-metrics card"><Metric label="Furniture reused" value="6 / 7" note="86% continues its journey" /><Metric label="Spending avoided" value="HK$15,500" note="Compared with replacing everything" /><Metric label="New furniture" value="1 item" note="Dimension-checked before purchase" /><Metric label="Open living space" value="+19%" note="With the compact table" accent /></div></section>
      <section className="circular-section">
        <div className="score-block"><span><Leaf size={18} /> CIRCULAR MOVE SCORE</span><div className="score"><strong>92</strong><i>/ 100</i></div><p>Most of your existing furniture continues into your new home, while one oversized item is redirected to resale instead of disposal.</p><div className="score-bar"><i><span style={{ width: "92%" }} /></i><div><span>Linear move</span><span>Circular move</span></div></div></div>
        <div className="impact-flow"><div className="impact-location old"><span>OLD HOME</span><b>Kowloon</b></div><div className="impact-travellers">{items.map((item, index) => <div className="traveller" style={{ animationDelay: `${index * .16}s` }} key={item}><Armchair size={13} /><span>{item}</span><ArrowRight size={12} /><b><Check size={11} />Reuse</b></div>)}<div className="traveller resale" style={{ animationDelay: "1s" }}><Armchair size={13} /><span>Dining table</span><ArrowRight size={12} /><b><RotateCcw size={11} />Resale</b></div><div className="traveller purchase" style={{ animationDelay: "1.16s" }}><ShoppingBag size={13} /><span>Compact table</span><ArrowRight size={12} /><b><Check size={11} />New home</b></div></div><div className="impact-location new"><span>NEW HOME</span><b>Northern Metropolis</b><CircleCheck size={24} /></div></div>
      </section>
      <section className="impact-close"><span>RESPACE HK</span><h2>Reuse more. Waste less.<br />Live better in less space.</h2><Button variant="secondary" icon={RotateCcw} onClick={restart}>Restart demo</Button></section>
    </main>
  );
}
