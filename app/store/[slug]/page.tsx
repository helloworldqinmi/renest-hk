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

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const product = findFoldingProduct((await params).slug);
  if (!product) notFound();
  const related = foldingProducts.filter((item) => item.slug !== product.slug).slice(0, 3);

  return (
    <main className={styles.page}>
      <Link href="/recommendations" className={styles.back}><ArrowLeft size={15} /> Back to recommendations</Link>
      <div className={styles.product}>
        <section className={styles.gallery}>
          <div className={styles.mainImage}><Image src={product.gallery[0]} alt={product.name} fill sizes="(max-width: 850px) 100vw, 61vw" priority /></div>
          {product.gallery.length > 1 ? <div className={styles.secondaryImage}><Image src={product.gallery[1]} alt={`${product.name} in its alternate configuration`} fill sizes="(max-width: 850px) 100vw, 31vw" /></div> : null}
        </section>
        <aside className={styles.details}>
          <div className={styles.meta}><span>{product.category}</span>{product.badge ? <b>{product.badge}</b> : null}</div>
          <h1>{product.name}</h1><p>{product.description}</p>
          <div className={styles.price}><strong>HK${product.price.toLocaleString()}</strong>{product.originalPrice ? <del>HK${product.originalPrice.toLocaleString()}</del> : null}</div>
          <dl className={styles.specs}><div><dt><Ruler size={15} /> Open size</dt><dd>{product.dimensions}</dd></div><div><dt><PackageCheck size={15} /> Space-saving mode</dt><dd>{product.foldedDimensions}</dd></div></dl>
          <div className={styles.fit}><Check size={17} /><span><b>Selected for your plan</b><small>{product.fitNote}</small></span></div>
          <ProductActions name={product.name} />
          <div className={styles.delivery}><Truck size={18} /><span><b>Hong Kong delivery</b><small>Estimated 3–5 working days · assembly available</small></span></div>
          <div className={styles.features}><span>PRODUCT DETAILS</span>{product.features.map((feature) => <div key={feature}><Check size={13} />{feature}</div>)}</div>
        </aside>
      </div>
      <section className={styles.related}><div><span>MORE FLEXIBLE PIECES</span><h2>You may also like.</h2></div><div className={styles.relatedGrid}>{related.map((item) => <Link href={`/store/${item.slug}`} key={item.slug}><div><Image src={item.image} alt={item.name} fill sizes="(max-width: 650px) 90vw, 28vw" /></div><span>{item.category}</span><h3>{item.name}</h3><strong>HK${item.price.toLocaleString()}</strong></Link>)}</div></section>
    </main>
  );
}
