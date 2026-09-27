import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, ArrowRight, Check, Sparkles } from "lucide-react";
import { foldingProducts } from "@/lib/folding-products";
import styles from "./recommendations.module.css";

type RecommendationsPageProps = {
  searchParams: Promise<{ from?: string; objective?: string }>;
};

export default async function RecommendationsPage({ searchParams }: RecommendationsPageProps) {
  const params = await searchParams;
  const objective = params.objective === "work" || params.objective === "host" ? params.objective : "keep";
  const returnToDemo = params.from === "demo";

  return (
    <main className={styles.page}>
      {returnToDemo ? <Link href={`/demo?resume=${objective}`} className={styles.returnLink}><ArrowLeft size={15} /> Back to my plan</Link> : null}
      <header className={styles.hero}>
        <div><span><Sparkles size={14} /> CURATED FOR YOUR NEW SPACE</span><h1>You may like this.</h1></div>
        <p>Thoughtful additions for compact homes. Keep what works, and choose only the pieces that make everyday life easier.</p>
      </header>

      <p className={styles.priceNote}>Illustrative demo prices in HKD · delivery and installation excluded.</p>
      <section className={styles.featured}>
        <Link href={`/store/${foldingProducts[0].slug}`} className={styles.featuredImage}>
          <Image src={foldingProducts[0].image} alt={foldingProducts[0].name} fill sizes="(max-width: 800px) 100vw, 62vw" priority />
        </Link>
        <div className={styles.featuredCopy}>
          <span>{foldingProducts[0].badge}</span><small>{foldingProducts[0].category}</small>
          <h2>{foldingProducts[0].name}</h2><p>{foldingProducts[0].description}</p>
          <div><strong>HK${foldingProducts[0].price.toLocaleString()}</strong><em>{foldingProducts[0].dimensions}</em></div>
          <Link href={`/store/${foldingProducts[0].slug}`}>View product <ArrowRight size={16} /></Link>
        </div>
      </section>

      <div className={styles.sectionHead}><div><span>SPACE-SAVING EDIT</span><h2>More room from every piece.</h2></div><p><Check size={15} /> Selected for compact Hong Kong homes</p></div>
      <section className={styles.grid}>
        {foldingProducts.slice(1).map((product) => (
          <Link href={`/store/${product.slug}`} className={styles.card} key={product.slug}>
            <div className={styles.cardImage}><Image src={product.image} alt={product.name} fill sizes="(max-width: 700px) 92vw, 31vw" />{product.badge ? <span>{product.badge}</span> : null}</div>
            <div className={styles.cardCopy}><small>{product.category}</small><h3>{product.name}</h3><p>{product.fitNote}</p><div><strong>HK${product.price.toLocaleString()}</strong><span>{product.foldedDimensions}</span></div></div>
          </Link>
        ))}
      </section>
    </main>
  );
}
