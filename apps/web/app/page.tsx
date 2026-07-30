import ScanForm from "@/components/ScanForm";
import { BOOKING_URL } from "@/lib/constants";

const FAQ = [
  {
    q: "Qu'est-ce que le GEO (Generative Engine Optimization) ?",
    a: "Le GEO consiste à optimiser la présence d'une marque dans les réponses des IA génératives (ChatGPT, Claude, Gemini, Perplexity). Quand un prospect demande « quel est le meilleur prestataire pour X », ces moteurs recommandent des marques : le GEO fait en sorte que la vôtre en fasse partie.",
  },
  {
    q: "Comment est calculé le Score de Visibilité IA ?",
    a: "Nous posons 20 à 30 questions d'intention d'achat de votre secteur aux 4 moteurs via leurs API officielles. Le score (0-100) combine votre taux de mention (50 %), votre position moyenne dans les réponses (20 %), le taux de recommandation explicite (20 %) et le sentiment (10 %).",
  },
  {
    q: "Que contient le Sprint GEO à 2 900 € ?",
    a: "Une mission de 30 jours sur 3 chantiers : technique (robots.txt, llms.txt, schema.org, pages en format réponse directe), contenu (4 à 6 pages comparatives, alternatives, FAQ et guides ciblés sur les requêtes où vous êtes absent) et citations externes (annuaires, comparateurs, pitchs presse). Livrables exacts listés avant le démarrage, paiement 50 % au début, 50 % à la livraison.",
  },
  {
    q: "Garantissez-vous un résultat ?",
    a: "Nous garantissons les actions livrées, pas un score exact : les moteurs IA intègrent les changements en 4 à 12 semaines. C'est pourquoi chaque sprint inclut un re-scan offert à J+90, avec les mêmes requêtes, pour mesurer objectivement la progression.",
  },
  {
    q: "Comment mesurez-vous sans scraper ChatGPT ?",
    a: "Uniquement via les API officielles des 4 moteurs. Les réponses des interfaces grand public peuvent différer légèrement — limite assumée, mentionnée dans chaque rapport, et identique à chaque mesure donc parfaitement comparable dans le temps.",
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

const CHANTIERS = [
  {
    n: "01",
    title: "Technique",
    auto: "~90 % automatisable",
    desc: "Crawlers IA débloqués (GPTBot, ClaudeBot, PerplexityBot…), fichier llms.txt, balisage schema.org, pages restructurées en format « réponse directe ».",
  },
  {
    n: "02",
    title: "Contenu",
    auto: "~70 % automatisable",
    desc: "Comparatifs « vous vs concurrent », pages « alternatives à », FAQ balisée, guides d'achat factuels — ciblés sur les requêtes où vous êtes aujourd'hui absent.",
  },
  {
    n: "03",
    title: "Citations externes",
    auto: "~20 % automatisable",
    desc: "Nous identifions les sources qui font gagner vos concurrents dans les données Perplexity, puis nous vous y installons : annuaires, comparateurs, presse spécialisée.",
  },
];

const STATS = [
  { v: "900 M", l: "utilisateurs hebdomadaires de ChatGPT début 2026", s: "Reuters" },
  { v: "46 %", l: "des utilisateurs d'IA démarrent leur recherche d'achat sur une IA (25 % en 2024)", s: "Alchemer 2026" },
  { v: "1 / 2", l: "acheteur B2B de logiciel commence sa recherche par un chatbot", s: "G2 Research 2026" },
];

export default function LandingPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />

      <div className="mx-auto max-w-shell px-4 lg:px-8">
        {/* ── En-tête ── */}
        <header className="flex items-baseline justify-between border-b border-rule py-6">
          <span className="font-mono text-sm tracking-wider text-bone">GEO&nbsp;SPRINT</span>
          <nav className="flex gap-6">
            <a href="/guide-geo" className="label transition-colors duration-150 ease-sharp hover:text-bone">Guide</a>
            <a href="#offre" className="label transition-colors duration-150 ease-sharp hover:text-bone">Offre</a>
          </nav>
        </header>

        {/* ── Hero asymétrique : la promesse à gauche, l'instrument à droite ── */}
        <section className="grid gap-12 py-16 lg:grid-cols-[1.1fr_460px] lg:gap-16 lg:py-24">
          <div>
            <p className="label">Agence GEO · PME et ETI francophones</p>
            <h1 className="mt-6 font-editorial text-hero text-bone">
              Votre marque est-elle{" "}
              <em className="not-italic" style={{ color: "var(--signal)" }}>
                invisible dans ChatGPT
              </em>{" "}
              ?
            </h1>
            <p className="mt-8 max-w-prose text-lg text-bone-dim">
              Testez gratuitement votre visibilité dans ChatGPT, Claude, Gemini et Perplexity en 90 secondes.
              Vous verrez les réponses réelles — y compris celles où vos concurrents sont recommandés à votre place.
            </p>

            <dl className="mt-12 border-t border-rule">
              {[
                ["Score de Visibilité IA", "0-100, mesuré sur les 4 moteurs"],
                ["Part de voix", "face aux concurrents que vous nommez"],
                ["Verbatims", "les réponses brutes, non retouchées"],
              ].map(([k, v]) => (
                <div key={k} className="flex flex-wrap items-baseline gap-x-6 border-b border-rule py-3">
                  <dt className="font-mono text-sm text-bone">{k}</dt>
                  <dd className="text-sm text-bone-faint">{v}</dd>
                </div>
              ))}
            </dl>
          </div>

          <div className="lg:pt-12">
            <ScanForm />
          </div>
        </section>

        {/* ── Preuves marché — bandeau de chiffres, filets verticaux ── */}
        <section className="grid border-y border-rule-strong sm:grid-cols-3">
          {STATS.map((s) => (
            <div key={s.v} className="border-b border-rule px-4 py-8 last:border-b-0 sm:border-b-0 sm:border-r sm:last:border-r-0">
              <p className="tnum font-mono text-3xl text-bone">{s.v}</p>
              <p className="mt-3 max-w-[34ch] text-sm text-bone-dim">{s.l}</p>
              <p className="label mt-3">{s.s}</p>
            </div>
          ))}
        </section>

        {/* ── Déroulé en 3 temps ── */}
        <section className="py-24">
          <h2 className="font-editorial text-3xl text-bone">Comment ça se passe</h2>
          <ol className="mt-12 grid gap-px bg-rule lg:grid-cols-3">
            {[
              ["Aujourd'hui", "Le scan, gratuit", "20 à 30 questions d'intention d'achat de votre secteur, posées aux 4 moteurs via leurs API officielles. Sans inscription."],
              ["Cette semaine", "Le call de restitution", "Trente minutes. On commente vos résultats requête par requête et on vous dit ce qu'un sprint changerait — y compris si la réponse est « rien »."],
              ["Sous 30 jours", "Le sprint, puis la preuve", "Nous exécutons les 3 chantiers. À J+90, re-scan offert avec les mêmes questions : la progression se mesure, elle ne se promet pas."],
            ].map(([when, title, desc], i) => (
              <li key={title} className="bg-ink p-6 lg:p-8">
                <div className="flex items-baseline gap-3">
                  <span className="tnum font-mono text-sm text-signal">{String(i + 1).padStart(2, "0")}</span>
                  <span className="label">{when}</span>
                </div>
                <h3 className="mt-4 font-editorial text-xl text-bone">{title}</h3>
                <p className="mt-3 text-sm text-bone-dim">{desc}</p>
              </li>
            ))}
          </ol>
        </section>

        {/* ── Les 3 chantiers ── */}
        <section id="offre" className="scroll-mt-8 border-t border-rule-strong py-24">
          <div className="grid gap-8 lg:grid-cols-[1fr_1.4fr]">
            <div>
              <h2 className="font-editorial text-3xl text-bone">Le Sprint GEO</h2>
              <p className="label mt-3">30 jours · 3 chantiers</p>
            </div>
            <p className="max-w-prose text-lg text-bone-dim">
              Quand vos prospects demandent une recommandation à une IA, elle cite vos concurrents. En trente jours,
              nous exécutons les trois chantiers qui la font changer d'avis.
            </p>
          </div>

          <div className="mt-16 border-t border-rule">
            {CHANTIERS.map((c) => (
              <div key={c.n} className="grid gap-4 border-b border-rule py-8 lg:grid-cols-[80px_240px_1fr] lg:gap-8">
                <span className="tnum font-mono text-2xl text-signal">{c.n}</span>
                <div>
                  <h3 className="font-editorial text-xl text-bone">{c.title}</h3>
                  <p className="label mt-2">{c.auto}</p>
                </div>
                <p className="max-w-prose text-sm text-bone-dim">{c.desc}</p>
              </div>
            ))}
          </div>

          {/* Tarifs : deux blocs à filets, largeurs inégales */}
          <div className="mt-16 grid gap-px bg-rule lg:grid-cols-[1.3fr_1fr]">
            <div className="bg-ink p-8 lg:p-12" style={{ borderTop: "2px solid var(--signal)" }}>
              <div className="flex items-baseline justify-between">
                <h3 className="font-editorial text-2xl text-bone">Sprint GEO</h3>
                <p className="tnum font-mono text-3xl text-bone">2 900 €</p>
              </div>
              <p className="label mt-2">Paiement unique · 50 % au démarrage, 50 % à la livraison</p>
              <ul className="mt-8 border-t border-rule">
                {[
                  "Audit technique complet et pose des correctifs",
                  "4 à 6 contenus stratégiques rédigés et livrés",
                  "Plan de citations, inscriptions et pitchs presse",
                  "Rapport de fin de sprint : chaque action, listée",
                  "Re-scan offert à J+90, mêmes requêtes",
                ].map((li) => (
                  <li key={li} className="flex gap-4 border-b border-rule py-3 text-sm text-bone-dim">
                    <span className="font-mono text-signal">+</span>
                    {li}
                  </li>
                ))}
              </ul>
            </div>
            <div className="bg-ink p-8 lg:p-12">
              <div className="flex items-baseline justify-between">
                <h3 className="font-editorial text-2xl text-bone-dim">Sprint Domination</h3>
                <p className="tnum font-mono text-3xl text-bone-dim">4 900 €</p>
              </div>
              <p className="label mt-2">Pour les marchés disputés</p>
              <p className="mt-8 text-sm text-bone-dim">
                Tout le Sprint GEO, plus : couverture élargie (deux langues ou deux segments), le double de contenus,
                campagne presse approfondie et session stratégique dédiée.
              </p>
            </div>
          </div>

          {/* Engagement d'honnêteté — bloc à filet signal, pas une carte molle */}
          <div className="mt-16 border-l-2 border-signal pl-6 lg:pl-8">
            <p className="label">Ce que nous ne promettons pas</p>
            <p className="mt-4 max-w-prose text-lg text-bone">
              Nous garantissons les actions livrées, pas un score exact. Les moteurs intègrent les changements en 4 à
              12 semaines et leurs réponses varient par nature. Quiconque vous vend « la première place dans
              ChatGPT » vous vend quelque chose qu'il ne contrôle pas.
            </p>
            <p className="mt-4 max-w-prose text-sm text-bone-dim">
              Ce que nous garantissons, c'est la mesure : le re-scan à J+90 rejoue exactement les mêmes questions.
              Vous voyez la progression réelle, quelle qu'elle soit. Trois sprints par mois maximum.
            </p>
          </div>

          <div className="mt-12 flex flex-wrap gap-4">
            <a href={BOOKING_URL} className="btn-signal">Réserver un call de restitution</a>
            <a href="/guide-geo" className="btn-ghost">Lire le guide GEO</a>
          </div>
        </section>

        {/* ── FAQ ── */}
        <section className="border-t border-rule-strong py-24">
          <div className="grid gap-8 lg:grid-cols-[280px_1fr] lg:gap-16">
            <h2 className="font-editorial text-3xl text-bone lg:sticky lg:top-8 lg:self-start">
              Questions fréquentes
            </h2>
            <div className="border-t border-rule">
              {FAQ.map((f) => (
                <details key={f.q} className="group border-b border-rule py-4">
                  <summary className="flex cursor-pointer items-baseline gap-4 font-mono text-sm text-bone marker:content-['']">
                    <span className="text-signal transition-transform duration-150 ease-sharp group-open:rotate-45">+</span>
                    {f.q}
                  </summary>
                  <p className="mt-3 max-w-prose pl-8 text-sm text-bone-dim">{f.a}</p>
                </details>
              ))}
            </div>
          </div>
        </section>

        <footer className="border-t border-rule py-12">
          <div className="flex flex-wrap items-baseline justify-between gap-6">
            <span className="font-mono text-sm tracking-wider text-bone">GEO&nbsp;SPRINT</span>
            <nav className="flex flex-wrap gap-x-6 gap-y-2">
              {[
                ["/guide-geo", "Guide GEO"],
                ["/geo-vs-seo", "GEO vs SEO"],
                ["/alternatives-agence-seo", "Alternatives aux agences SEO"],
                ["/mentions-legales", "Mentions légales"],
                ["/confidentialite", "Confidentialité"],
              ].map(([href, label]) => (
                <a key={href} href={href} className="label transition-colors duration-150 ease-sharp hover:text-bone">
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
