import { LocalText } from '@/components/locale-provider';
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, Check, PackageCheck, Ruler, Truck } from "lucide-react";
import { notFound } from "next/navigation";
import { findFoldingProduct, foldingProducts } from "@/lib/folding-products";
import { ProductActions } from "./product-actions";
import styles from "./product.module.css";

export function generateStaticParams() {
  return foldingProducts.map((product) => ({ slug: product.slug }));
}

export default async function ProductPage({ params, searchParams }: { params: Promise<{ slug: string }>; searchParams: Promise<{ from?: string }> }) {
  const [{ slug }, { from }] = await Promise.all([params, searchParams]);
  const product = findFoldingProduct(slug);
  if (!product) notFound();
  const related = foldingProducts.filter((item) => item.slug !== product.slug).slice(0, 3);

  return (
    <main className={styles.page}>
      <Link href={from === "studio" ? "/demo" : "/recommendations"} className={styles.back}><ArrowLeft size={15} /> <LocalText>{from === "studio" ? "Back to your moving studio" : "Back to recommendations"}</LocalText></Link>
      <div className={styles.product}>
        <section className={styles.gallery}>
          <div className={styles.mainImage}><Image src={product.gallery[0]} alt={product.name} fill sizes="(max-width: 850px) 100vw, 61vw" priority /></div>
          {product.gallery.length > 1 ? <div className={styles.secondaryImage}><Image src={product.gallery[1]} alt={`${product.name} in its alternate configuration`} fill sizes="(max-width: 850px) 100vw, 31vw" /></div> : null}
        </section>
        <aside className={styles.details}>
          <div className={styles.meta}><span><LocalText>{product.category}</LocalText></span>{product.badge ? <b><LocalText>{product.badge}</LocalText></b> : null}</div>
          <h1><LocalText>{product.name}</LocalText></h1><p><LocalText>{product.description}</LocalText></p>
          <div className={styles.price}><strong><LocalText>{"HK$"}</LocalText>{product.price.toLocaleString()}</strong>{product.originalPrice ? <del><LocalText>{"HK$"}</LocalText>{product.originalPrice.toLocaleString()}</del> : null}</div>
          <p className={styles.priceNote}><LocalText>{"Illustrative demo price · delivery and installation excluded."}</LocalText></p>
          <dl className={styles.specs}><div><dt><Ruler size={15} /><LocalText>{" Open size"}</LocalText></dt><dd><LocalText>{product.dimensions}</LocalText></dd></div><div><dt><PackageCheck size={15} /><LocalText>{" Space-saving mode"}</LocalText></dt><dd><LocalText>{product.foldedDimensions}</LocalText></dd></div></dl>
          <div className={styles.fit}><Check size={17} /><span><b><LocalText>{"Why it fits compact rooms"}</LocalText></b><small><LocalText>{product.fitNote}</LocalText></small></span></div>
          <ProductActions name={product.name} slug={product.slug} />
          <div className={styles.delivery}><Truck size={18} /><span><b><LocalText>{product.secondhand?"Local pickup":"Hong Kong delivery"}</LocalText></b><small><LocalText>{product.secondhand?"Confirm condition and collection with the seller":"Estimated 3–5 working days · assembly available"}</LocalText></small></span></div>
          <div className={styles.features}><span><LocalText>{"PRODUCT DETAILS"}</LocalText></span>{product.features.map((feature) => <div key={feature}><Check size={13} /><LocalText>{feature}</LocalText></div>)}</div>
        </aside>
      </div>
      <section className={styles.related}><div><span><LocalText>{"MORE FLEXIBLE PIECES"}</LocalText></span><h2><LocalText>{"You may also like."}</LocalText></h2></div><div className={styles.relatedGrid}>{related.map((item) => <Link href={`/store/${item.slug}${from==='studio'?'?from=studio':''}`} key={item.slug}><div><Image src={item.image} alt={item.name} fill sizes="(max-width: 650px) 90vw, 28vw" /></div><span><LocalText>{item.category}</LocalText></span><h3><LocalText>{item.name}</LocalText></h3><strong><LocalText>{"HK$"}</LocalText>{item.price.toLocaleString()}</strong></Link>)}</div></section>
    </main>
  );
}
