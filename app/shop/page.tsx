"use client";

import { useState } from "react";
import { ArrowUpRight, Check, CircleCheck, Ruler, Tag } from "lucide-react";
import { useDemo } from "@/components/state-provider";
import { FloorPlan } from "@/components/floor-plan/floor-plan";
import { Button, Eyebrow, LinkButton, Modal, cn } from "@/components/common/ui";
import { marketplaceProducts, plans } from "@/lib/demo-data";
import type { MarketplaceProduct } from "@/types";

function ProductVisual({ product }: { product: MarketplaceProduct }) {
  return <div className={`product-visual ${product.tone}`}><div className="table-top" /><i /><i /><i /><i /><span>{Math.round(product.width * 100)} cm</span></div>;
}

export default function ShopPage() {
  const { selectedProduct, selectProduct, listingReady, setListingReady } = useDemo();
  const [trial, setTrial] = useState<MarketplaceProduct | null>(null);
  const [details, setDetails] = useState<MarketplaceProduct | null>(null);
  const [listingOpen, setListingOpen] = useState(false);
  const chosen = marketplaceProducts.find((product) => product.id === selectedProduct)!;

  return (
    <main className="page-shell shop-page">
      <div className="page-head"><div className="page-head-copy"><Eyebrow>Dimension-matched marketplace</Eyebrow><h1>Buy only what actually fits.</h1><p>These recommendations have already been checked against your selected floor plan.</p></div><div className="fit-rule"><Ruler size={18} /><span><b>Max footprint</b>90 × 65 cm</span></div></div>
      <section className="recommendation-intro"><div><span>REPLACEMENT NEEDED</span><h2>Your 140 cm table creates a 43 cm bottleneck.</h2></div><p>All results below provide at least 78 cm of circulation clearance in Plan A.</p></section>
      <div className="product-grid">
        {marketplaceProducts.map((product, index) => (
          <article className={cn("product-card card", selectedProduct === product.id && "is-chosen")} key={product.id}>
            <div className="product-badges"><span>{product.type}</span><b>{product.fitScore}% Fit</b></div>
            <ProductVisual product={product} />
            <div className="product-copy"><span className="seller">{product.seller}</span><h3>{product.name}</h3><div className="product-spec"><span>{Math.round(product.width * 100)} × {Math.round(product.depth * 100)} cm</span><strong>HK${product.price.toLocaleString()}</strong></div><p><Check size={13} /> Unlocks {index === 0 ? 39 : product.clearance - 43} cm additional walkway clearance</p></div>
            <div className="product-actions"><Button onClick={() => setTrial(product)}>Try in my room</Button><Button variant="secondary" icon={ArrowUpRight} onClick={() => setDetails(product)} aria-label={`View ${product.name}`} /></div>
          </article>
        ))}
      </div>

      <section className="resale-section">
        <div className="resale-visual"><div className="resale-table"><i /><i /><i /><i /></div><span>140 × 80 cm</span></div>
        <div className="resale-copy"><Eyebrow>Circular move</Eyebrow><h2>Your old table still has value.</h2><p>Its dimensions are already verified, so a resale listing takes seconds.</p></div>
        <div className="resale-value"><span>ESTIMATED RESALE VALUE</span><strong>HK$700–900</strong><Button variant={listingReady ? "secondary" : "primary"} onClick={() => setListingOpen(true)} icon={listingReady ? CircleCheck : Tag}>{listingReady ? "Listing ready" : "List for resale"}</Button></div>
      </section>
      <div className="shop-footer"><div><CircleCheck size={18} /><span><b>{chosen.name}</b> selected · HK${chosen.price.toLocaleString()}</span></div><LinkButton href="/move-plan">Build my move plan</LinkButton></div>

      <Modal open={!!trial} onClose={() => setTrial(null)} title="Try it in your room" wide>
        {trial ? <div className="try-room"><div className="try-plan"><FloorPlan mode="new" plan={plans[0]} trialProduct={trial} compact /></div><aside><span className="status-pill green"><Check size={12} /> Fits perfectly</span><h3>{trial.name}</h3><div className="try-metric"><span>Walking clearance</span><strong>{trial.clearance} cm</strong></div><div className="try-metric"><span>Fit score</span><strong>{trial.fitScore}%</strong></div><div className="try-price">HK${trial.price.toLocaleString()}</div><Button onClick={() => { selectProduct(trial.id); setTrial(null); }}>Use this in my plan</Button></aside></div> : null}
      </Modal>
      <Modal open={!!details} onClose={() => setDetails(null)} title="Product details">
        {details ? <div className="product-detail"><ProductVisual product={details} /><h3>{details.name}</h3><p>A compact, dimension-checked table matched to the door clearance and circulation path in your selected layout.</p><div className="product-spec"><span>{Math.round(details.width * 100)} × {Math.round(details.depth * 100)} × {Math.round(details.height * 100)} cm</span><strong>HK${details.price.toLocaleString()}</strong></div><Button onClick={() => { setDetails(null); setTrial(details); }}>Try in my room</Button></div> : null}
      </Modal>
      <Modal open={listingOpen} onClose={() => setListingOpen(false)} title="Generated listing preview">
        <div className="listing-preview"><span className="status-pill blue">Mock integration</span><h3>Wooden Dining Table — 140 × 80 cm</h3><p>Well-maintained dining table suitable for 4–6 people. Dimensions automatically verified by ReSpace scan.</p><dl><div><dt>Dimensions</dt><dd>140 × 80 × 75 cm</dd></div><div><dt>Suggested price</dt><dd>HK$800</dd></div><div><dt>Condition</dt><dd>Good</dd></div></dl><div className="listing-actions"><Button variant="secondary" onClick={() => setListingOpen(false)}>Cancel</Button><Button onClick={() => { setListingReady(true); setListingOpen(false); }}>Publish listing</Button></div><small>No external marketplace will be contacted in this demo.</small></div>
      </Modal>
    </main>
  );
}
