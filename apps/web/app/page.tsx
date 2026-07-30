import ScanForm from "@/components/ScanForm";
import ProofBlock from "@/components/ProofBlock";
import { BOOKING_URL } from "@/lib/constants";

const FAQ = [
  {
    q: "Comment est calculé le Score de Visibilité IA ?",
    a: "Nous posons 20 à 30 questions d'intention d'achat de votre secteur aux 4 moteurs via leurs API officielles. Le score (0-100) combine votre taux de mention (50 %), votre position moyenne dans les réponses (20 %), le taux de recommandation explicite (20 %) et le sentiment (10 %).",
  },
  {
    q: "Garantissez-vous un résultat ?",
    a: "Nous garantissons les actions livrées, pas un score exact : les moteurs IA intègrent les changements en 4 à 12 semaines. C'est pourquoi chaque sprint inclut un re-scan offert à J+90, avec les mêmes requêtes, pour mesurer objectivement la progression.",
  },
  {
    q: "Le GEO remplace-t-il le SEO ?",
    a: "Non, il le complète. Les moteurs génératifs s'appuient largement sur des pages web indexées et des sources tierces bien référencées : un bon SEO facilite le GEO. Ce que le SEO ne couvre pas, c'est l'autorisation des crawlers IA, le format « réponse directe » et la mesure dans les réponses elles-mêmes.",
  },
  {
    q: "Comment mesurez-vous sans scraper ChatGPT ?",
    a: "Uniquement via les API officielles des 4 moteurs. Les réponses des interfaces grand public peuvent différer légèrement — limite assumée, mentionnée dans chaque rapport, et identique à chaque mesure donc parfaitement comparable dans le temps.",
  },
  {
    q: "Que se passe-t-il après le scan ?",
    a: "Vous recevez votre rapport complet, gratuitement, que nous travaillions ensemble ou non. Si vous le souhaitez, nous le commentons ensemble lors d'un call de 30 minutes. Nous ne prenons que 3 sprints par mois : si votre situation ne justifie pas le nôtre, nous vous le disons.",
  },
];

const faqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: FAQ.map((f) => ({
    "@type": "Question",
    name: f.q,
    acceptedAnswer: { "@type": "Answer", text: f.a },
  })),
};

/** Inventaire précis : c'est ce qui rend un prix de 2 900 € lisible. */
const LIVRABLES = [
  ["01", "Audit technique", "Rapport complet + fichiers prêts à poser (robots.txt, llms.txt, schema.org)"],
  ["02", "Contenus rédigés", "5 pages : comparatifs, « alternatives à », FAQ balisée, guides d'achat"],
  ["03", "Citations externes", "8 cibles travaillées : inscriptions réalisées, pitchs presse envoyés"],
  ["04", "Rapport de fin de sprint", "Chaque action livrée, listée et datée"],
  ["05", "Re-scan à J+90", "Mêmes questions, mêmes moteurs — rapport avant / après"],
];

const STATS = [
  ["900 M", "utilisateurs hebdomadaires de ChatGPT début 2026", "Reuters"],
  ["46 %", "des utilisateurs d'IA démarrent leur recherche d'achat sur une IA — 25 % en 2024", "Alchemer 2026"],
  ["1 sur 2", "acheteurs B2B de logiciel commencent par un chatbot", "G2 Research 2026"],
];

export default function LandingPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />

      <div className="mx-auto max-w-shell px-4 lg:px-8">
        <header className="flex items-baseline justify-between border-b border-rule py-6">
          <span className="font-mono text-sm tracking-wider text-ink">GEO&nbsp;SPRINT</span>
          <nav className="flex gap-6">
            <a href="#offre" className="label transition-colors duration-150 ease-sharp hover:text-ink">Offre</a>
            <a href="/guide-geo" className="label transition-colors duration-150 ease-sharp hover:text-ink">Guide</a>
          </nav>
        </header>

        {/* ── 1. La promesse, en une phrase, et l'instrument ── */}
        <section id="top" className="grid scroll-mt-8 gap-12 py-16 lg:grid-cols-[1.05fr_450px] lg:gap-16 lg:py-24">
          <div>
            <p className="label">Agence GEO · PME et ETI francophones</p>
            <h1 className="mt-6 font-editorial text-hero text-ink">
              Votre marque est-elle <em className="not-italic" style={{ color: "var(--signal)" }}>invisible</em>{" "}
              dans ChatGPT ?
            </h1>
            <p className="mt-8 max-w-[46ch] text-lg text-ink-dim">
              Mesurez-le gratuitement en 90 secondes, sur les quatre moteurs.
              Vous verrez les réponses réelles, telles que vos prospects les reçoivent.
            </p>
          </div>

          <div className="lg:pt-12">
            <ScanForm />
          </div>
        </section>

        {/* ── 2. Le moment de compréhension ── */}
        <section className="pb-24">
          <ProofBlock />
          <p className="mt-6 max-w-prose text-lg text-ink">
            Le prospect a sa réponse. Il ne fera pas de deuxième recherche, et vous ne saurez jamais que cette
            occasion a existé.
          </p>
        </section>

        {/* ── 3. Pourquoi maintenant ── */}
        <section className="grid border-y border-rule-strong sm:grid-cols-3">
          {STATS.map(([v, l, s]) => (
            <div key={v} className="border-b border-rule px-4 py-8 last:border-b-0 sm:border-b-0 sm:border-r sm:px-6 sm:last:border-r-0">
              <p className="tnum font-mono text-3xl text-ink">{v}</p>
              <p className="mt-3 max-w-[32ch] text-sm text-ink-dim">{l}</p>
              <p className="label mt-4">{s}</p>
            </div>
          ))}
        </section>

        {/* ── 4. Ce que fait le scan gratuit ── */}
        <section className="py-24">
          <div className="grid gap-12 lg:grid-cols-[1fr_1.3fr] lg:gap-16">
            <div>
              <p className="label">Étape 1 — gratuit</p>
              <h2 className="mt-4 font-editorial text-3xl text-ink">La mesure</h2>
            </div>
            <div>
              <dl className="border-t border-rule">
                {[
                  ["24", "questions d'intention d'achat de votre secteur, générées puis figées"],
                  ["4", "moteurs interrogés via leurs API officielles : ChatGPT, Claude, Gemini, Perplexity"],
                  ["1", "score sur 100, une part de voix, et les réponses brutes"],
                ].map(([n, txt]) => (
                  <div key={n} className="flex items-baseline gap-6 border-b border-rule py-5">
                    <dt className="tnum w-12 shrink-0 font-mono text-2xl text-signal">{n}</dt>
                    <dd className="text-ink-dim">{txt}</dd>
                  </div>
                ))}
              </dl>
              <p className="mt-6 text-sm text-ink-faint">
                Sans inscription. Le rapport est à vous, que nous travaillions ensemble ou non.
              </p>
            </div>
          </div>
        </section>

        {/* ── 5. L'offre : inventaire précis, puis prix ── */}
        <section id="offre" className="scroll-mt-8 border-t border-rule-strong py-24">
          <div className="grid gap-12 lg:grid-cols-[1fr_1.3fr] lg:gap-16">
            <div>
              <p className="label">Étape 2 — 30 jours</p>
              <h2 className="mt-4 font-editorial text-3xl text-ink">Le Sprint GEO</h2>
              <p className="mt-6 max-w-prose text-ink-dim">
                Nous rendons votre site lisible par les IA, nous écrivons les pages qu'elles citent, et nous vous
                installons sur les sources qui font gagner vos concurrents.
              </p>
            </div>

            <div>
              <p className="label">Ce que vous recevez</p>
              <ol className="mt-4 border-t border-rule">
                {LIVRABLES.map(([n, title, desc]) => (
                  <li key={n} className="grid grid-cols-[32px_1fr] gap-4 border-b border-rule py-5">
                    <span className="tnum font-mono text-sm text-ink-faint">{n}</span>
                    <div>
                      <p className="font-mono text-sm text-ink">{title}</p>
                      <p className="mt-1 text-sm text-ink-dim">{desc}</p>
                    </div>
                  </li>
                ))}
              </ol>

              <div className="mt-12 flex flex-wrap items-end justify-between gap-6 border-t-2 border-signal pt-6">
                <div>
                  <p className="tnum font-mono text-4xl text-ink">2 900 €</p>
                  <p className="label mt-2">Paiement unique · 50 % / 50 % · sans abonnement</p>
                </div>
                <a href={BOOKING_URL} className="btn-signal">Réserver un call</a>
              </div>
              <p className="mt-4 text-sm text-ink-faint">
                Option <span className="text-ink-dim">Sprint Domination — 4 900 €</span> : deux langues ou deux
                segments, le double de contenus, campagne presse approfondie.
              </p>
            </div>
          </div>
        </section>

        {/* ── 6. L'engagement d'honnêteté ── */}
        <section className="border-t border-rule-strong py-24">
          <div className="grid gap-12 lg:grid-cols-[1fr_1.3fr] lg:gap-16">
            <div>
              <p className="label">Étape 3 — J+90</p>
              <h2 className="mt-4 font-editorial text-3xl text-ink">La preuve</h2>
            </div>
            <div className="border-l-2 border-signal pl-6 lg:pl-8">
              <p className="max-w-prose text-lg text-ink">
                Nous garantissons les actions livrées, pas un score. Les moteurs intègrent les changements en 4 à 12
                semaines et leurs réponses varient. Qui vous vend « la première place dans ChatGPT » vous vend
                quelque chose qu'il ne contrôle pas.
              </p>
              <p className="mt-6 max-w-prose text-ink-dim">
                Ce que nous garantissons, c'est la mesure. À J+90, nous rejouons exactement les mêmes questions, sur
                les mêmes moteurs, avec la même méthode de calcul. Vous voyez la progression réelle — quelle
                qu'elle soit.
              </p>
              <p className="label mt-8">Trois sprints par mois maximum</p>
            </div>
          </div>
        </section>

        {/* ── 7. FAQ ── */}
        <section className="border-t border-rule-strong py-24">
          <div className="grid gap-12 lg:grid-cols-[1fr_1.3fr] lg:gap-16">
            <h2 className="font-editorial text-3xl text-ink lg:sticky lg:top-8 lg:self-start">Questions</h2>
            <div className="border-t border-rule">
              {FAQ.map((f) => (
                <details key={f.q} className="group border-b border-rule py-4">
                  <summary className="flex cursor-pointer items-baseline gap-4 font-mono text-sm text-ink marker:content-['']">
                    <span className="text-signal transition-transform duration-150 ease-sharp group-open:rotate-45">+</span>
                    {f.q}
                  </summary>
                  <p className="mt-3 max-w-prose pl-8 text-sm text-ink-dim">{f.a}</p>
                </details>
              ))}
            </div>
          </div>
        </section>

        {/* ── 8. Rappel du scan ── */}
        <section className="border border-signal">
          <div className="grid gap-8 p-8 lg:grid-cols-[1fr_auto] lg:items-center lg:p-12">
            <div>
              <h2 className="font-editorial text-3xl text-ink">Commencez par mesurer</h2>
              <p className="mt-3 max-w-prose text-ink-dim">
                Quatre-vingt-dix secondes, sans inscription. Vous saurez exactement où vous en êtes.
              </p>
            </div>
            <a href="#top" className="btn-signal whitespace-nowrap text-center">Lancer le scan</a>
          </div>
        </section>

        <footer className="border-t border-rule py-12">
          <div className="flex flex-wrap items-baseline justify-between gap-6">
            <span className="font-mono text-sm tracking-wider text-ink">GEO&nbsp;SPRINT</span>
            <nav className="flex flex-wrap gap-x-6 gap-y-2">
              {[
                ["/guide-geo", "Guide GEO"],
                ["/geo-vs-seo", "GEO vs SEO"],
                ["/alternatives-agence-seo", "Alternatives aux agences SEO"],
                ["/mentions-legales", "Mentions légales"],
                ["/confidentialite", "Confidentialité"],
              ].map(([href, label]) => (
                <a key={href} href={href} className="label transition-colors duration-150 ease-sharp hover:text-ink">
                  {label}
                </a>
              ))}
            </nav>
          </div>
        </footer>
      </div>
    </>
  );
}
