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
    n: "1",
    title: "Technique",
    desc: "Votre site devient lisible par les IA : crawlers débloqués (GPTBot, ClaudeBot, PerplexityBot…), fichier llms.txt, balisage schema.org, pages restructurées en format « réponse directe ».",
  },
  {
    n: "2",
    title: "Contenu",
    desc: "Nous créons les pages que les IA citent : comparatifs « vous vs concurrent », pages « alternatives à », FAQ balisée, guides d'achat factuels — ciblés sur les requêtes où vous êtes aujourd'hui absent.",
  },
  {
    n: "3",
    title: "Citations externes",
    desc: "Les moteurs citent leurs sources : nous identifions celles qui font gagner vos concurrents (données Perplexity), et nous vous y installons — annuaires, comparateurs, presse spécialisée.",
  },
];

export default function LandingPage() {
  return (
    <main>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />

      {/* Hero + formulaire au-dessus de la ligne de flottaison */}
      <section className="bg-gradient-to-b from-accent-light to-white">
        <div className="mx-auto grid max-w-6xl gap-10 px-4 py-16 lg:grid-cols-2 lg:items-center">
          <div>
            <p className="mb-3 inline-block rounded-full bg-accent/10 px-3 py-1 text-sm font-medium text-accent">
              Agence GEO pour PME francophones
            </p>
            <h1 className="text-4xl font-extrabold leading-tight sm:text-5xl">
              Votre marque est-elle <span className="text-accent">invisible dans ChatGPT</span> ?
            </h1>
            <p className="mt-4 text-lg text-slate-600">
              Testez gratuitement votre visibilité dans ChatGPT, Claude, Gemini et Perplexity en 90 secondes.
            </p>
            <ul className="mt-6 space-y-2 text-sm text-slate-600">
              <li>✓ Score de Visibilité IA (0-100) sur les 4 moteurs</li>
              <li>✓ Part de voix face à vos concurrents</li>
              <li>✓ Les réponses réelles où vos concurrents sont recommandés… et pas vous</li>
            </ul>
          </div>
          <ScanForm />
        </div>
      </section>

      {/* Preuves marché */}
      <section className="border-y border-slate-100 bg-white">
        <div className="mx-auto grid max-w-6xl gap-6 px-4 py-10 text-center sm:grid-cols-3">
          <div>
            <p className="text-3xl font-extrabold text-accent">~900 M</p>
            <p className="mt-1 text-sm text-slate-600">d'utilisateurs hebdomadaires sur ChatGPT début 2026 — vos clients y sont déjà.</p>
          </div>
          <div>
            <p className="text-3xl font-extrabold text-accent">46 %</p>
            <p className="mt-1 text-sm text-slate-600">des utilisateurs d'IA démarrent leur recherche d'achat sur ChatGPT, Gemini ou Perplexity (25 % en 2024).</p>
          </div>
          <div>
            <p className="text-3xl font-extrabold text-accent">1 sur 2</p>
            <p className="mt-1 text-sm text-slate-600">acheteur B2B de logiciels commence désormais sa recherche par un chatbot IA (étude G2).</p>
          </div>
        </div>
        <p className="pb-6 text-center text-xs text-slate-400">
          Sources : Reuters (fév. 2026), Alchemer 2026 Retail Report, G2 Research 2026 — détails dans notre <a className="underline" href="/guide-geo">guide GEO</a>.
        </p>
      </section>

      {/* Comment ça marche */}
      <section className="mx-auto max-w-6xl px-4 py-16">
        <h2 className="text-center text-3xl font-bold">Comment ça marche</h2>
        <div className="mt-8 grid gap-6 md:grid-cols-3">
          <div className="rounded-2xl bg-slate-50 p-6">
            <p className="text-sm font-bold text-accent">Étape 1 — aujourd'hui</p>
            <h3 className="mt-1 font-semibold">Scannez votre visibilité (gratuit)</h3>
            <p className="mt-2 text-sm text-slate-600">
              20 à 30 questions d'intention d'achat de votre secteur, posées aux 4 moteurs via leurs API officielles.
              Score 0-100, part de voix, réponses réelles. En 90 secondes, sans inscription.
            </p>
          </div>
          <div className="rounded-2xl bg-slate-50 p-6">
            <p className="text-sm font-bold text-accent">Étape 2 — cette semaine</p>
            <h3 className="mt-1 font-semibold">Call de restitution (gratuit, 30 min)</h3>
            <p className="mt-2 text-sm text-slate-600">
              On commente vos résultats requête par requête : où vos concurrents gagnent, quelles sources les font
              citer, et ce qu'un sprint changerait. Sans engagement.
            </p>
          </div>
          <div className="rounded-2xl bg-slate-50 p-6">
            <p className="text-sm font-bold text-accent">Étape 3 — 30 jours</p>
            <h3 className="mt-1 font-semibold">Sprint GEO, puis preuve à J+90</h3>
            <p className="mt-2 text-sm text-slate-600">
              Nous exécutons les 3 chantiers, vous recevez chaque livrable. À J+90, re-scan offert avec les mêmes
              questions : la progression se mesure, elle ne se promet pas.
            </p>
          </div>
        </div>
      </section>

      {/* Offre Sprint GEO */}
      <section className="mx-auto max-w-6xl px-4 py-20">
        <h2 className="text-center text-3xl font-bold">Le Sprint GEO — 30 jours pour devenir visible</h2>
        <p className="mx-auto mt-3 max-w-2xl text-center text-slate-600">
          Quand vos prospects demandent une recommandation à une IA, elle cite vos concurrents. En 30 jours, nous
          exécutons les 3 chantiers qui la font changer d'avis.
        </p>

        <div className="mt-10 grid gap-6 md:grid-cols-3">
          {CHANTIERS.map((c) => (
            <div key={c.n} className="rounded-2xl border border-slate-200 p-6">
              <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-accent font-bold text-white">{c.n}</div>
              <h3 className="text-lg font-semibold">Chantier {c.n} — {c.title}</h3>
              <p className="mt-2 text-sm text-slate-600">{c.desc}</p>
            </div>
          ))}
        </div>

        <div className="mt-10 grid gap-6 lg:grid-cols-2">
          <div className="rounded-2xl border-2 border-accent p-8">
            <h3 className="text-xl font-bold">Sprint GEO</h3>
            <p className="mt-1 text-4xl font-extrabold">2 900 € <span className="text-base font-normal text-slate-500">paiement unique</span></p>
            <ul className="mt-4 space-y-2 text-sm text-slate-700">
              <li>✓ Audit technique complet + pose des fixes (robots.txt, llms.txt, schema.org)</li>
              <li>✓ 4 à 6 contenus stratégiques rédigés et livrés (comparatifs, alternatives, FAQ, guides)</li>
              <li>✓ Plan de citations externes + inscriptions annuaires + pitchs presse préparés</li>
              <li>✓ Rapport de fin de sprint : chaque action livrée, listée</li>
              <li>✓ Re-scan offert à J+90 : mêmes requêtes, progression mesurée</li>
            </ul>
          </div>
          <div className="rounded-2xl border border-slate-200 p-8">
            <h3 className="text-xl font-bold">Sprint Domination</h3>
            <p className="mt-1 text-4xl font-extrabold">4 900 €</p>
            <p className="mt-4 text-sm text-slate-700">
              Tout le Sprint GEO, plus : couverture élargie des requêtes (2 langues ou 2 segments), le double de
              contenus, campagne presse approfondie et session stratégique dédiée.
            </p>
          </div>
        </div>

        <div className="mx-auto mt-8 max-w-2xl rounded-xl bg-slate-50 p-6 text-sm text-slate-600">
          <p><strong>Notre engagement d'honnêteté :</strong> nous garantissons les actions livrées, pas un score exact — les
          moteurs IA intègrent les changements en 4 à 12 semaines. C'est précisément pour ça que le re-scan J+90 est
          inclus : la progression se mesure, elle ne se promet pas.</p>
          <p className="mt-3"><strong>3 sprints par mois maximum.</strong> Paiement 50 % au démarrage, 50 % à la livraison.</p>
        </div>

        <div className="mt-8 text-center">
          <a href={BOOKING_URL} className="inline-block rounded-lg bg-accent px-6 py-3 font-semibold text-white hover:bg-accent-dark">
            Réserver un call de restitution gratuit (30 min)
          </a>
        </div>
      </section>

      {/* FAQ */}
      <section className="bg-slate-50 py-20">
        <div className="mx-auto max-w-3xl px-4">
          <h2 className="text-center text-3xl font-bold">Questions fréquentes</h2>
          <div className="mt-8 space-y-4">
            {FAQ.map((f) => (
              <details key={f.q} className="rounded-xl border border-slate-200 bg-white p-5">
                <summary className="cursor-pointer font-semibold">{f.q}</summary>
                <p className="mt-3 text-sm text-slate-600">{f.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      <footer className="py-10 text-center text-sm text-slate-500">
        <p>GEO Sprint — Agence Generative Engine Optimization · <a className="underline" href={BOOKING_URL}>Réserver un call</a></p>
        <p className="mt-2">
          <a className="underline" href="/guide-geo">Guide : qu'est-ce que le GEO ?</a> · <a className="underline" href="/geo-vs-seo">GEO vs SEO</a> ·{" "}
          <a className="underline" href="/alternatives-agence-seo">Alternatives aux agences SEO</a>
        </p>
        <p className="mt-2 text-xs text-slate-400">
          <a className="underline" href="/mentions-legales">Mentions légales</a> · <a className="underline" href="/confidentialite">Politique de confidentialité</a>
        </p>
      </footer>
    </main>
  );
}
