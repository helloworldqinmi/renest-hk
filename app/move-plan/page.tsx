"use client";

import { Check, CircleCheck, ShoppingBag, Truck, WalletCards } from "lucide-react";
import { useDemo } from "@/components/state-provider";
import { FloorPlan } from "@/components/floor-plan/floor-plan";
import { Eyebrow, LinkButton } from "@/components/common/ui";
import { marketplaceProducts, plans } from "@/lib/demo-data";

const bring = ["Double Bed", "Study Desk", "Wardrobe", "Bookshelf", "Coffee Table", "2-seat Sofa"];

export default function MovePlanPage() {
  const { selectedProduct, listingReady } = useDemo();
  const product = marketplaceProducts.find((item) => item.id === selectedProduct) ?? marketplaceProducts[0];
  return (
    <main className="page-shell move-page">
      <div className="page-head"><div className="page-head-copy"><Eyebrow>Move plan · Ready</Eyebrow><h1>Your new home is ready.</h1><p>One coordinated plan for what comes with you, what moves on, and what needs to arrive.</p></div><div className="readiness-ring"><strong>100%</strong><span>Move readiness</span></div></div>
      <div className="move-layout">
        <section className="final-plan card"><div className="panel-title"><div><span>FINAL LAYOUT · REUSE MAX</span><h2>Northern Metropolis · 310 sq ft</h2></div><span className="status-pill green"><CircleCheck size={12} /> Ready</span></div><FloorPlan mode="new" plan={plans[0]} showWalkway /><div className="final-plan-note"><span><b>6</b> existing items</span><span><b>1</b> compact replacement</span><span><b>74 cm</b> min. clearance</span></div></section>
        <aside className="move-checklist">
          <section className="checklist-group"><div className="checklist-title"><span className="check-icon bring"><Truck size={17} /></span><div><b>Bring with you</b><span>6 existing items</span></div></div>{bring.map((item) => <div className="checklist-row" key={item}><Check size={14} /><span>{item}</span><b>KEEP</b></div>)}</section>
          <section className="checklist-group"><div className="checklist-title"><span className="check-icon sell"><WalletCards size={17} /></span><div><b>Sell</b><span>{listingReady ? "Listing ready" : "Listing prepared"}</span></div></div><div className="checklist-row"><Check size={14} /><span>Dining Table</span><b>HK$700–900</b></div></section>
          <section className="checklist-group"><div className="checklist-title"><span className="check-icon buy"><ShoppingBag size={17} /></span><div><b>Buy</b><span>1 dimension-checked item</span></div></div><div className="buy-row"><div><span>{product.name}</span><small>{Math.round(product.width * 100)} × {Math.round(product.depth * 100)} cm</small></div><strong>HK${product.price.toLocaleString()}</strong></div></section>
          <LinkButton href="/impact" className="impact-cta">View my impact</LinkButton>
        </aside>
      </div>
    </main>
  );
}
