import Image from "next/image";
import Link from "next/link";
import { ArrowDown, ArrowRight, MoveRight } from "lucide-react";
import { LinkButton } from "@/components/common/ui";
import { demoScenario } from "@/lib/demo-data";
import styles from "./home.module.css";

export default function HomePage() {
  return (
    <main className={styles.home}>
      <section className={styles.hero}>
        <div className={styles.heroCopy}>
          <h1>Same furniture.<br /><em>A new chapter.</em></h1>
          <p>Bring the pieces you love into your next home. See what fits, find a better layout, and buy only what’s missing.</p>
          <div className={styles.actions}>
            <LinkButton href="/demo">Try the demo</LinkButton>
            <LinkButton href="/recommendations" variant="secondary">Shop space-saving furniture</LinkButton>
            <a href="#how-it-works" className={styles.textLink}>See how it works <ArrowDown size={15} /></a>
          </div>
          <div className={styles.heroNote}><span className={styles.smallRule} /> A little less space. Just as much home.</div>
        </div>
        <figure className={styles.heroImage}>
          <Image src="/photos/old-home.webp" alt="A lived-in Hong Kong apartment with a linen sofa, oak furniture and afternoon light through the windows" fill sizes="(max-width: 760px) 100vw, 62vw" loading="eager" preload />
          <figcaption><span>KOWLOON, HONG KONG</span><span>THE HOME YOU KNOW</span></figcaption>
        </figure>
      </section>
      <div className={styles.moveStrip}>
        <span className={styles.stripLabel}>ONE MOVE. MORE POSSIBILITY.</span>
        <div><span>{demoScenario.currentHome.areaSqFt} SQ FT TODAY</span><MoveRight size={22} /><span>{demoScenario.newHome.areaSqFt} SQ FT NEXT</span></div>
        <span className={styles.reuse}><i /> {demoScenario.reused} / {demoScenario.furnitureTotal} ITEMS REUSED</span>
      </div>
      <section className={styles.story} id="how-it-works">
        <div className={styles.storyHeading}>
          <span className="eyebrow">01 / A THOUGHTFUL MOVE</span>
          <h2>A new address.<br />Not a fresh start on everything.</h2>
          <p>Your sofa, your favourite table, the bookshelf you’ve filled over the years. Start with what you own. We’ll help you find its place.</p>
        </div>
        <div className={styles.journey}>
          <article>
            <div className={styles.journeyImage}><Image src="/photos/old-home.webp" alt="The current furnished apartment" fill sizes="(max-width: 760px) 90vw, 28vw" /></div>
            <div className={styles.journeyCaption}><span>01</span><h3>The home you know</h3></div>
            <p>Capture your room and the pieces coming with you.</p>
          </article>
          <article>
            <div className={styles.furnitureSet}>
              <Image src="/photos/furniture-sofa.webp" alt="Your familiar linen sofa" width={300} height={210} sizes="(max-width: 760px) 65vw, 20vw" />
              <Image src="/photos/furniture-coffee-table.webp" alt="Your oak coffee table" width={140} height={140} sizes="110px" />
            </div>
            <div className={styles.journeyCaption}><span>02</span><h3>The things you keep</h3></div>
            <p>A measured inventory. Every piece accounted for.</p>
          </article>
          <article>
            <div className={styles.planImage}><Image src="/photos/spatial-room.webp" alt="A warm, furnished apartment viewed from above" fill sizes="(max-width: 760px) 90vw, 32vw" /></div>
            <div className={styles.journeyCaption}><span>03</span><h3>A place for what matters</h3></div>
            <p>See what fits before a single box is packed.</p>
          </article>
        </div>
        <Link href="/demo" className={styles.textLink}>Explore the move, step by step <ArrowRight size={17} /></Link>
      </section>
      <section className={styles.newChapter}>
        <figure className={styles.lifestyleImage}><Image src="/photos/final-home.webp" alt="Familiar furniture thoughtfully arranged in a bright, compact new Hong Kong home" fill sizes="(max-width: 760px) 100vw, 62vw" /><figcaption>310 SQ FT · A NEW WAY TO FEEL AT HOME</figcaption></figure>
        <div className={styles.chapterCopy}><span className="eyebrow">02 / ROOM FOR YOUR LIFE</span><h2>A smaller space.<br /><em>A fuller life.</em></h2><p>A clear path to the window. A proper place to work. Room for dinner with someone you love.</p><p>Explore layouts around the way you live, with the furniture that already feels like you.</p><Link href="/demo" className={styles.textLink}>Find your arrangement <ArrowRight size={17} /></Link></div>
      </section>
      <section className={styles.shopFeature}>
        <div className={styles.shopFeatureCopy}><span className="eyebrow">THE SPACE-SAVING STORE</span><h2>Small footprint.<br /><em>More possibilities.</em></h2><p>Fold-away desks, clever coffee tables and dining sets that make room for everyday life.</p><LinkButton href="/recommendations">Explore the furniture store</LinkButton><small>Flexible furniture from HK$390</small></div>
        <Link href="/store/lift-top-coffee-table" className={styles.shopFeatureCard}><div><Image src="/products/lift-table-product.png" alt="Oak lift-top coffee table with two nesting stools" fill sizes="(max-width: 760px) 90vw, 28vw" /></div><span>Lift-top Coffee Table <b>HK$990</b></span></Link>
        <Link href="/store/nesting-drop-leaf-table" className={styles.shopFeatureCard}><div><Image src="/products/drop-leaf-table-lifestyle.png" alt="Compact oak folding dining table with stools" fill sizes="(max-width: 760px) 90vw, 28vw" /></div><span>Drop-leaf Dining Set <b>HK$1,290</b></span></Link>
      </section>
      <section className={styles.impact} id="less-waste">
        <div><span className="eyebrow">03 / KEEP MORE. NEED LESS.</span><h2>Good for your next home.<br />Better for the one we share.</h2><p>The most thoughtful purchase is sometimes the one you don’t need to make.</p></div>
        <div className={styles.impactNumbers}><div><strong>6<span>/ 7</span></strong><p>familiar pieces reused</p></div><div><strong><small>HK$</small>15,500</strong><p>estimated replacement spending avoided</p></div><span className={styles.demoNote}>FROM OUR 380 → 310 SQ FT DEMO MOVE</span></div>
      </section>
      <section className={styles.finalCta}><span className="eyebrow">YOUR NEXT CHAPTER STARTS HERE</span><h2>Make yourself at home.<br /><em>Again.</em></h2><div className={styles.finalActions}><LinkButton href="/demo">Try the demo</LinkButton><LinkButton href="/recommendations" variant="secondary">Shop flexible furniture</LinkButton></div><p>No sign-up. Just a little room to imagine.</p></section>
      <footer className={styles.footer}><Link href="/" className={styles.footerBrand}>ReNest<span>HK</span></Link><p>Move what matters. Fit what works.</p><span>MADE FOR HONG KONG HOMES</span></footer>
    </main>
  );
}
