import Link from "next/link";
import { OrbitalTwin } from "@/components/orbital-twin";
import { SiteNav } from "@/components/site-nav";
import { MetricLabel, PrimaryButton } from "@/components/ui/finance";

const journey = [
  { n: "01", eyebrow: "WHERE AM I?", title: "See the state beneath the noise.", copy: "A living model of your income, burn, assets, and resilience — translated into one clear signal." },
  { n: "02", eyebrow: "WHAT IF?", title: "Pressure-test the next decision.", copy: "Change the inputs. Watch your twin respond. Understand the cost of a job loss, a move, or a bold new plan." },
  { n: "03", eyebrow: "WHAT SHOULD I DO?", title: "Turn clarity into momentum.", copy: "Your financial future is not a forecast to accept. It is a system to tune, one high-leverage move at a time." },
];

export default function Page() {
  return (
    <main className="landing">
      <SiteNav />
      <section className="hero" aria-labelledby="hero-title">
        <div className="hero-copy">
          <MetricLabel>FINANCEGUARD / FINANCIAL DIGITAL TWIN</MetricLabel>
          <h1 id="hero-title">See your financial future <em>before</em> you live it.</h1>
          <p>Turn your current financial state into a living model so you can understand where you stand, test what could happen, and make better decisions before reality forces them.</p>
        </div>
        <div className="hero-visual"><OrbitalTwin /><div className="orb-caption"><span>MODEL / 01</span><span>LIVE STATE</span></div></div>
        <div className="hero-actions"><PrimaryButton href="/login">EXPLORE YOUR TWIN</PrimaryButton><Link className="text-link" href="#story">SEE HOW IT WORKS <span>↓</span></Link></div>
      </section>
      <section className="story" id="story" aria-labelledby="story-title">
        <div className="story-intro"><MetricLabel>THE MODEL</MetricLabel><h2 id="story-title">A clearer way to move through uncertainty.</h2></div>
        <div className="journey">{journey.map((item, i) => <article className={`journey-item journey-${i + 1}`} key={item.n}><span className="journey-number">{item.n}</span><div><MetricLabel>{item.eyebrow}</MetricLabel><h3>{item.title}</h3><p>{item.copy}</p></div><span className="journey-mark" aria-hidden="true">↗</span></article>)}</div>
      </section>
      <section className="closing" aria-labelledby="closing-title"><MetricLabel>THE NEXT MOVE</MetricLabel><h2 id="closing-title">Your future isn&apos;t fixed.<br /><span>Test it.</span></h2><PrimaryButton href="/login">ENTER YOUR FINANCIAL TWIN</PrimaryButton></section>
      <footer className="site-footer"><span>© 2026 FINANCEGUARD</span><span>PRIVATE BY DESIGN / DEMO MODE</span></footer>
    </main>
  );
}
