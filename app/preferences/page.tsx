"use client";

import { useState } from "react";
import { Check, CircleDollarSign, LayoutGrid, PartyPopper, Recycle, SlidersHorizontal, Warehouse, Laptop } from "lucide-react";
import { useDemo } from "@/components/state-provider";
import { Button, Eyebrow, LinkButton, cn } from "@/components/common/ui";
import { preferenceOptions } from "@/lib/demo-data";

const prefIcons = [LayoutGrid, Recycle, Laptop, PartyPopper, Warehouse, CircleDollarSign];

export default function PreferencesPage() {
  const { selectedPreferences, togglePreference, naturalLanguagePreference, setNaturalLanguagePreference, constraints, interpretPreferences } = useDemo();
  const [interpreting, setInterpreting] = useState(false);

  function interpret() {
    setInterpreting(true);
    window.setTimeout(() => { interpretPreferences(); setInterpreting(false); }, 1100);
  }

  return (
    <main className="page-shell preferences-page">
      <div className="page-head"><div className="page-head-copy"><Eyebrow>Step 3 · Lifestyle</Eyebrow><h1>How should your new home work for you?</h1><p>A few priorities are enough. ReNest turns them into spatial rules the optimizer can measure.</p></div></div>
      <section className="preference-section">
        <div className="section-number">01</div>
        <div className="preference-content"><div className="question-head"><h2>What matters most?</h2><span>Select all that apply</span></div>
          <div className="preference-grid">
            {preferenceOptions.map((preference, index) => { const Icon = prefIcons[index]; const active = selectedPreferences.includes(preference); return (
              <button key={preference} className={cn("preference-card", active && "is-selected")} onClick={() => togglePreference(preference)}><Icon size={21} /><span>{preference}</span>{active ? <Check size={15} className="preference-check" /> : null}</button>
            ); })}
          </div>
        </div>
      </section>
      <section className="preference-section language-section">
        <div className="section-number">02</div>
        <div className="preference-content"><div className="question-head"><h2>Tell ReNest anything else</h2><span>Natural language</span></div>
          <div className="language-box">
            <textarea value={naturalLanguagePreference} onChange={(event) => setNaturalLanguagePreference(event.target.value)} aria-label="Tell ReNest anything else" />
            <Button onClick={interpret} icon={SlidersHorizontal} disabled={interpreting || !naturalLanguagePreference.trim()}>{interpreting ? "Understanding your priorities..." : constraints.length ? "Re-interpret priorities" : "Understand my priorities"}</Button>
          </div>
          {(interpreting || constraints.length > 0) ? (
            <div className="constraint-panel"><div className="constraint-panel-head"><span><SlidersHorizontal size={14} /> LAYOUT CONSTRAINTS</span><b>{interpreting ? "Interpreting..." : `${constraints.length} constraints created`}</b></div>
              <div className="constraint-chips">{interpreting ? [1,2,3,4,5].map((value) => <i key={value} style={{ width: `${100 + value * 17}px` }} />) : constraints.map((constraint) => <span key={constraint}><Check size={12} />{constraint.replace("->", "→")}</span>)}</div>
            </div>
          ) : null}
        </div>
      </section>
      <div className="preference-footer"><p>Your priorities shape the plan. <b>Geometry</b> verifies it fits.</p><LinkButton href="/optimize" className={!constraints.length ? "disabled-link" : ""}>Generate my layouts</LinkButton></div>
    </main>
  );
}
