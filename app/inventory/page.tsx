"use client";

import { useState } from "react";
import { Armchair, BedDouble, Check, CircleDollarSign, Monitor, Star, Warehouse } from "lucide-react";
import { useDemo } from "@/components/state-provider";
import { FloorPlan } from "@/components/floor-plan/floor-plan";
import { Eyebrow, LinkButton, cn } from "@/components/common/ui";
import { demoScenario, furnitureInventory } from "@/lib/demo-data";

const icons = { sofa: Armchair, desk: Monitor, bed: BedDouble, storage: Warehouse, table: CircleDollarSign };

export default function InventoryPage() {
  const { selectedFurniture, priorityFurniture, toggleFurniture, togglePriority } = useDemo();
  const [selected, setSelected] = useState<string | null>("bed");
  const selectedValue = furnitureInventory.filter((item) => selectedFurniture.includes(item.id)).reduce((sum, item) => sum + (item.estimatedValue ?? 0), 0);

  return (
    <main className="page-shell inventory-page">
      <div className="page-head">
        <div className="page-head-copy"><Eyebrow>Scan complete · {demoScenario.furnitureTotal} items detected</Eyebrow><h1>Review what&apos;s coming with you.</h1><p>We found {demoScenario.furnitureTotal} items in your current home. Keep the scan accurate, then mark what matters most.</p></div>
        <LinkButton href="/scan-new">Scan my new home</LinkButton>
      </div>
      <div className="inventory-layout">
        <section className="inventory-plan card">
          <div className="panel-title"><div><span>CURRENT HOME</span><h2>{demoScenario.currentHome.name} · {demoScenario.currentHome.areaSqFt} sq ft</h2></div><span className="status-pill green"><Check size={12} /> Measured</span></div>
          <FloorPlan mode="old" selectedId={selected} onSelect={setSelected} />
          <div className="inventory-value"><span>Estimated replacement value</span><strong>HK${selectedValue.toLocaleString()}</strong><p>Reusing what already works can significantly reduce move-in costs.</p></div>
        </section>
        <section className="inventory-side">
          <div className="inventory-side-head"><div><span>FURNITURE INVENTORY</span><h2>What definitely needs to move?</h2></div><b>{selectedFurniture.length} / {demoScenario.furnitureTotal} kept</b></div>
          <div className="inventory-list">
            {furnitureInventory.map((item) => {
              const Icon = icons[item.category];
              const kept = selectedFurniture.includes(item.id);
              const priority = priorityFurniture.includes(item.id);
              return (
                <article key={item.id} onClick={() => setSelected(item.id)} className={cn("inventory-item", selected === item.id && "is-selected", !kept && "is-off")}>
                  <div className={`furniture-thumb ${item.category}`}><Icon size={23} strokeWidth={1.7} /></div>
                  <div className="inventory-item-copy"><h3>{item.name}</h3><span>{Math.round(item.dimensions.width * 100)} × {Math.round(item.dimensions.depth * 100)} × {Math.round(item.dimensions.height * 100)} cm</span><b>HK${item.estimatedValue?.toLocaleString()} replacement</b></div>
                  <button aria-label={`${priority ? "Remove" : "Mark"} ${item.name} priority`} className={cn("priority-button", priority && "is-priority")} onClick={(event) => { event.stopPropagation(); togglePriority(item.id); }}><Star size={15} fill={priority ? "currentColor" : "none"} />{priority ? "Priority" : "Priority"}</button>
                  <label className="keep-toggle" onClick={(event) => event.stopPropagation()}><input type="checkbox" checked={kept} onChange={() => toggleFurniture(item.id)} /><span>{kept ? "Keep" : "Leave"}</span></label>
                </article>
              );
            })}
          </div>
        </section>
      </div>
      <div className="mobile-next"><LinkButton href="/scan-new">Scan my new home</LinkButton></div>
    </main>
  );
}
