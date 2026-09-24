"use client";

import { useState } from "react";
import Image from "next/image";
import { ArrowUpRight, Check, CircleCheck, Ruler, Tag } from "lucide-react";
import { useDemo } from "@/components/state-provider";
import { FloorPlan } from "@/components/floor-plan/floor-plan";
import { Button, Eyebrow, LinkButton, Modal, cn } from "@/components/common/ui";
import { demoScenario, marketplaceProducts, plans } from "@/lib/demo-data";
import type { MarketplaceProduct } from "@/types";

function ProductVisual({ product }: { product: MarketplaceProduct }) {
  const image = product.id === "fold-table-1"
    ? "/photos/recommend-folding-table.webp"
    : product.id === "secondhand-table"
      ? "/photos/furniture-dining-table.webp"
      : null;
  if (image) return <div className={`product-visual product-photo ${product.tone}`}><Image src={image} alt={product.name} fill sizes="(max-width: 520px) 92vw, 31vw" /><span>{Math.round(product.width * 100)} × {Math.round(product.depth * 100)} cm</span></div>;
  return <div className={`product-visual ${product.tone}`}><div className="table-top" /><i /><i /><i /><i /><span>{Math.round(product.width * 100)} cm</span></div>;
}

export default function ShopPage() {
  const { selectedProduct, selectProduct, listingReady, setListingReady } = useDemo();
  const [trial, setTrial] = useState<MarketplaceProduct | null>(null);
  const [details, setDetails] = useState<MarketplaceProduct | null>(null);
  const [listingOpen, setListingOpen] = useState(false);
  const chosen = marketplaceProducts.find((product) => product.id === selectedProduct);

  return (
    <main className="page-shell shop-page">
      <div className="page-head"><div className="page-head-copy"><Eyebrow>Dimension-matched marketplace</Eyebrow><h1>Buy only what actually fits.</h1><p>These recommendations have already been checked against your selected floor plan.</p></div><div className="fit-rule"><Ruler size={18} /><span><b>Max footprint</b>90 × 65 cm</span></div></div>
      <section className="recommendation-intro"><div><span>REPLACEMENT NEEDED</span><h2>Your {demoScenario.currentTable.widthCm} cm table creates a {demoScenario.currentTable.clearanceCm} cm bottleneck.</h2></div><p>Only three products pass the selected layout&apos;s dimension and circulation checks.</p></section>
      <div className="product-grid">
        {marketplaceProducts.map((product) => (
          <article className={cn("product-card card", selectedProduct === product.id && "is-chosen")} key={product.id}>
            <div className="product-badges"><span>{product.type}</span><b>{product.fitScore}% Fit</b></div>
            <ProductVisual product={product} />
            <div className="product-copy"><span className="seller">{product.seller}</span><h3>{product.name}</h3><div className="product-spec"><span>{Math.round(product.width * 100)} × {Math.round(product.depth * 100)} cm</span><strong>HK${product.price.toLocaleString()}</strong></div><ul className="fit-checks"><li><Check size={13} />Fits selected layout</li><li><Check size={13} />{product.clearance} cm walkway clearance</li><li><Check size={13} />Within Alex&apos;s budget</li></ul></div>
            <div className="product-actions"><Button onClick={() => setTrial(product)}>Try in my room</Button><Button variant="secondary" icon={ArrowUpRight} onClick={() => setDetails(product)}>View product</Button></div>
          </article>
        ))}
      </div>

      <section className="resale-section">
        <div className="resale-visual"><div className="resale-table"><i /><i /><i /><i /></div><span>{demoScenario.currentTable.widthCm} × {demoScenario.currentTable.depthCm} cm</span></div>
        <div className="resale-copy"><Eyebrow>Circular move</Eyebrow><h2>Your old table still has value.</h2><p>Its dimensions are already verified, so a resale listing takes seconds.</p></div>
        <div className="resale-value"><span>ESTIMATED RESALE VALUE</span><strong>HK${demoScenario.currentTable.resaleLow}–{demoScenario.currentTable.resaleHigh}</strong><Button variant={listingReady ? "secondary" : "primary"} onClick={() => setListingOpen(true)} icon={listingReady ? CircleCheck : Tag}>{listingReady ? "Listing ready ✓" : "List for resale"}</Button></div>
      </section>
      <div className="shop-footer"><div><CircleCheck size={18} /><span>{chosen ? <><b>{chosen.name}</b> selected · HK${chosen.price.toLocaleString()}</> : "Try a verified-fit product, then add it to your plan."}</span></div><LinkButton href="/move-plan" className={!chosen ? "disabled-link" : ""}>Build my move plan</LinkButton></div>

      <Modal open={!!trial} onClose={() => setTrial(null)} title="Try it in your room" wide>
        {trial ? <div className="try-room"><div className="try-plan"><FloorPlan mode="new" plan={plans[0]} trialProduct={trial} compact /><div className="try-photo-inset"><Image src="/photos/fit-result.webp" alt="Photorealistic preview of Alex's existing furniture fitted into the new apartment" fill sizes="280px" /><span>ROOM PREVIEW</span></div><div className="try-swap"><span>140 × 80 cm · out</span><ArrowUpRight size={15} /><b>{Math.round(trial.width * 100)} × {Math.round(trial.depth * 100)} cm · in</b></div></div><aside><span className="status-pill green"><Check size={12} /> Fits perfectly ✓</span><h3>{trial.name}</h3><div className="try-metric"><span>Walking clearance</span><strong>{trial.clearance} cm</strong></div><div className="try-metric"><span>Usable circulation</span><strong>+{demoScenario.replacementTable.spaceUnlockedSqM} m²</strong></div><div className="try-metric"><span>Fit score</span><strong>{trial.fitScore}%</strong></div><div className="try-price">HK${trial.price.toLocaleString()}</div><Button onClick={() => { selectProduct(trial.id); setTrial(null); }}>Use this in my plan</Button></aside></div> : null}
      </Modal>
      <Modal open={!!details} onClose={() => setDetails(null)} title="Product details">
        {details ? <div className="product-detail"><ProductVisual product={details} /><h3>{details.name}</h3><p>A compact, dimension-checked table matched to the door clearance and circulation path in your selected layout.</p><div className="product-spec"><span>{Math.round(details.width * 100)} × {Math.round(details.depth * 100)} × {Math.round(details.height * 100)} cm</span><strong>HK${details.price.toLocaleString()}</strong></div><Button onClick={() => { setDetails(null); setTrial(details); }}>Try in my room</Button></div> : null}
      </Modal>
      <Modal open={listingOpen} onClose={() => setListingOpen(false)} title="Generated listing preview">
        <div className="listing-preview"><span className="status-pill blue">Demo marketplace integration</span><h3>Wooden Dining Table — 140 × 80 cm</h3><p>Well-maintained dining table suitable for 4–6 people. Dimensions automatically verified by ReNest scan.</p><dl><div><dt>Dimensions</dt><dd>140 × 80 × 75 cm</dd></div><div><dt>Suggested price</dt><dd>HK$800</dd></div><div><dt>Condition</dt><dd>Good</dd></div></dl><div className="listing-actions"><Button variant="secondary" onClick={() => setListingOpen(false)}>Cancel</Button><Button onClick={() => { setListingReady(true); setListingOpen(false); }}>Prepare listing</Button></div><small>Preview only. Nothing is published to an external marketplace.</small></div>
      </Modal>
    </main>
  );
}
