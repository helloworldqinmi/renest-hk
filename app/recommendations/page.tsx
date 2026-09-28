import { LocalText } from '@/components/locale-provider';
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
  const returnToDemo = params.from === "demo" || params.from === "studio";

  return (
    <main className={styles.page}>
      {returnToDemo ? <Link href="/demo" className={styles.returnLink}><ArrowLeft size={15} /><LocalText>{" Back to my plan"}</LocalText></Link> : null}
      <header className={styles.hero}>
        <div><span><Sparkles size={14} /><LocalText>{" CURATED FOR YOUR NEW SPACE"}</LocalText></span><h1><LocalText>{"You may like this."}</LocalText></h1></div>
        <p><LocalText>{"Thoughtful additions for compact homes. Keep what works, and choose only the pieces that make everyday life easier."}</LocalText></p>
      </header>

      <p className={styles.priceNote}><LocalText>{"Illustrative demo prices in HKD · delivery and installation excluded."}</LocalText></p>
      <section className={styles.featured}>
        <Link href={`/store/${foldingProducts[0].slug}${returnToDemo?'?from=studio':''}`} className={styles.featuredImage}>
          <Image src={foldingProducts[0].image} alt={foldingProducts[0].name} fill sizes="(max-width: 800px) 100vw, 62vw" priority />
        </Link>
        <div className={styles.featuredCopy}>
          <span><LocalText>{foldingProducts[0].badge}</LocalText></span><small><LocalText>{foldingProducts[0].category}</LocalText></small>
          <h2><LocalText>{foldingProducts[0].name}</LocalText></h2><p><LocalText>{foldingProducts[0].description}</LocalText></p>
          <div><strong><LocalText>{"HK$"}</LocalText>{foldingProducts[0].price.toLocaleString()}</strong><em>{foldingProducts[0].dimensions}</em></div>
          <Link href={`/store/${foldingProducts[0].slug}${returnToDemo?'?from=studio':''}`}><LocalText>{"View product "}</LocalText><ArrowRight size={16} /></Link>
        </div>
      </section>

      <div className={styles.sectionHead}><div><span><LocalText>{"SPACE-SAVING EDIT"}</LocalText></span><h2><LocalText>{"More room from every piece."}</LocalText></h2></div><p><Check size={15} /><LocalText>{" Selected for compact Hong Kong homes"}</LocalText></p></div>
      <section className={styles.grid}>
        {foldingProducts.slice(1).map((product) => (
          <Link href={`/store/${product.slug}${returnToDemo?'?from=studio':''}`} className={styles.card} key={product.slug}>
            <div className={styles.cardImage}><Image src={product.image} alt={product.name} fill sizes="(max-width: 700px) 92vw, 31vw" />{product.badge ? <span><LocalText>{product.badge}</LocalText></span> : null}</div>
            <div className={styles.cardCopy}><small><LocalText>{product.category}</LocalText></small><h3><LocalText>{product.name}</LocalText></h3><p><LocalText>{product.fitNote}</LocalText></p><div><strong><LocalText>{"HK$"}</LocalText>{product.price.toLocaleString()}</strong><span><LocalText>{product.foldedDimensions}</LocalText></span></div></div>
          </Link>
        ))}
      </section>
    </main>
  );
}
