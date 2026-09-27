import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, ArrowUpRight, Leaf, House, Sparkles } from 'lucide-react';
import { BrandLogo } from '@/components/common/brand-logo';
import styles from './about.module.css';

export const metadata: Metadata = {
 title: 'About us — ReNest',
 description: 'A more thoughtful move to the Northern Metropolis: reuse furniture, make compact homes work better, and help residents settle into a new chapter.',
 alternates: { canonical: '/about' },
 openGraph: { title: 'About us — ReNest', description: 'A new address should not mean starting over. Discover the purpose and goals behind ReNest.', url: '/about' },
};
const goals = [
 { icon: Leaf, number: '01', title: 'Give good furniture a longer life.', text: 'Make reuse the starting point for a move to the Northern Metropolis. Help residents bring useful furniture along, reduce unnecessary purchases, and work towards keeping good pieces out of the waste stream.' },
 { icon: House, number: '02', title: 'Make small spaces feel full of possibility.', text: 'Design around everyday routines, from focused work to dinner with friends. Explore flexible furniture and spaces that can do more than one thing.' },
 { icon: Sparkles, number: '03', title: 'Make the next move easier to imagine.', text: 'Help new residents feel at home sooner with a clear visual plan before moving. Longer term, we want to connect pieces that no longer fit with people in the community who can use them.' },
];
export default function AboutPage() {
 return <main className={styles.about}>
  <section className={styles.hero}>
   <div className={styles.heroCopy}><span className={styles.eyebrow}>ABOUT US · SUSTAINABLE NORTHERN METROPOLIS</span><h1>A new address.<br/>Still <em>your story.</em></h1><p>We believe moving home should carry your life forward — the familiar pieces, the everyday rituals, the things that make a place yours.</p><a href="#our-goals" className={styles.textLink}>Explore our goals <ArrowRight size={16}/></a></div>
   <figure className={styles.heroImage}><Image src="/photos/final-home.webp" alt="A warm living space with a familiar sofa, wooden furniture and natural light" fill sizes="(max-width:740px) 100vw, 55vw" priority/><figcaption>MORE THAN A FLOOR PLAN. A PLACE TO BELONG.</figcaption></figure>
  </section>
  <section className={styles.purpose}><span className={styles.eyebrow}>WHY WE STARTED</span><div><h2>Good things deserve<br/><em>a next chapter.</em></h2><div><p>A move brings a thousand small decisions. Will the sofa fit? Where will we work? Do we really need to buy everything again?</p><p>ReNest is a moving and spatial-planning concept created for the Sustainable Northern Metropolis challenge, with a focus on people settling into new homes in northern Hong Kong. We bring the home you know and the home ahead into one visual experience, helping you explore how familiar furniture can support a different way of living.</p></div></div></section>
  <section className={styles.northern}><span className={styles.eyebrow}>OUR STARTING POINT · 北部都會區</span><div><h2>A sustainable new town<br/>starts <em>at home.</em></h2><div><p>Our contribution to the Northern Metropolis begins with the move itself. We want to help residents bring useful furniture into their next home, make compact spaces work for different households, and avoid unnecessary replacement.</p><p>We connect the challenge’s housing, waste and community themes through everyday decisions: what to keep, how to make it fit, and what could find another home.</p><span className={styles.themeTags}><b>Thoughtful move-in costs</b><b>Furniture reuse</b><b>Settling into a new community</b></span></div></div></section>
  <section className={styles.goals} id="our-goals"><div className={styles.sectionHeading}><span className={styles.eyebrow}>WHAT WE ARE WORKING TOWARDS</span><h2>Our goals</h2><p>Less starting over. More room for what matters.</p></div><div className={styles.goalGrid}>{goals.map(goal=><article key={goal.number}><div><goal.icon size={25} strokeWidth={1.2}/><span>{goal.number}</span></div><h3>{goal.title}</h3><p>{goal.text}</p></article>)}</div></section>
  <section className={styles.vision}><div className={styles.visionImage}><Image src="/models/v2/previews/new-home-c.png" alt="A ReNest 3D apartment layout combining existing furniture with flexible workspaces" fill sizes="(max-width:740px) 100vw, 50vw"/></div><div className={styles.visionCopy}><span className={styles.eyebrow}>OUR VISION FOR GENERATIVE AI</span><h2>Start with how you live.<br/><em>See what could change.</em></h2><p>Our ambition is to translate everyday wishes into spatial possibilities: understand what matters, propose arrangements, explain the trade-offs, and refine the plan with you.</p><div className={styles.demoNote}><b>Where we are today</b><p>ReNest is a hackathon prototype. Scanning and AI-style generation are simulated with supplied 3D models and three curated layouts. Furniture selection changes the displayed arrangements; live scanning and generative planning are future goals.</p></div><Link href="/demo?step=preferences" className={styles.textLink}>Explore the design preview <ArrowUpRight size={16}/></Link></div></section>
  <section className={styles.closing}><span className={styles.eyebrow}>MOVE WHAT MATTERS.</span><h2>Your next chapter<br/>starts with what you <em>keep.</em></h2><Link href="/demo">Step inside ReNest <ArrowRight size={16}/></Link></section>
  <footer className={styles.footer}><Link href="/" aria-label="ReNest home"><BrandLogo/></Link><Link href="/">Back to home <ArrowUpRight size={14}/></Link><span>A NEW CHAPTER IN THE NORTHERN METROPOLIS</span></footer>
 </main>;
}
