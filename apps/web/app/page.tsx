import ScanForm from "@/components/ScanForm";
import ProofBlock from "@/components/ProofBlock";
import { BOOKING_URL } from "@/lib/constants";
import { fr } from "@/lib/typo";

const FAQ = [
  {
    q: "Comment est calculé le Score de Visibilité IA ?",
    a: "Nous posons 20 à 30 questions d’intention d’achat de votre secteur aux 4 moteurs, via leurs API officielles. Le score sur 100 combine votre taux de mention (50 %), votre position moyenne dans les réponses (20 %), le taux de recommandation explicite (20 %) et le sentiment (10 %).",
  },
  {
    q: "Garantissez-vous un résultat ?",
    a: "Nous garantissons les actions livrées, pas un score. Les moteurs intègrent les changements en 4 à 12 semaines et leurs réponses varient par nature. C’est pourquoi le re-scan à J+90 est inclus : il rejoue les mêmes questions et montre la progression réelle, quelle qu’elle soit.",
  },
  {
    q: "Le GEO remplace-t-il le SEO ?",
    a: "Non, il le complète. Les moteurs génératifs s’appuient largement sur des pages indexées et des sources tierces bien référencées : un bon SEO facilite le GEO. Ce que le SEO ne traite pas, c’est l’autorisation des crawlers IA, le format « réponse directe » et la mesure dans les réponses elles-mêmes.",
  },
  {
    q: "Comment mesurez-vous sans scraper ChatGPT ?",
    a: "Uniquement via les API officielles des quatre moteurs. Les interfaces grand public peuvent répondre légèrement différemment — limite assumée et mentionnée dans chaque rapport. La mesure étant identique à chaque scan, elle reste parfaitement comparable dans le temps.",
  },
  {
    q: "Que se passe-t-il après le scan ?",
    a: "Vous recevez votre rapport complet, gratuitement, que nous travaillions ensemble ou non. Si vous le souhaitez, nous le commentons lors d’un call de 30 minutes. Nous ne prenons que trois sprints par mois : si votre situation ne le justifie pas, nous vous le disons.",
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

/** Inventaire, pas séquence : donc aucune numérotation décorative. */
const LIVRABLES: [string, string][] = [
  ["Audit technique", "Rapport complet et fichiers prêts à poser : robots.txt, llms.txt, balisage schema.org"],
  ["Cinq contenus rédigés", "Comparatifs, pages « alternatives à », FAQ balisée, guides d’achat factuels"],
  ["Huit cibles de citation", "Inscriptions réalisées, pitchs presse écrits et envoyés, relances assurées"],
  ["Rapport de fin de sprint", "Chaque action livrée, listée et datée"],
  ["Re-scan à J+90", "Mêmes questions, mêmes moteurs, rapport avant / après"],
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

        {/* ── Premier écran : la promesse, l’instrument, et surtout la preuve.
             Le geste signature doit être visible sans défiler. ── */}
        <section id="top" className="scroll-mt-8 pb-24 pt-12">
          <div className="grid gap-8 lg:grid-cols-[1.05fr_450px] lg:gap-16">
            <div className="stagger">
              <p className="label">Agence GEO · PME et ETI francophones</p>
              <h1 className="mt-4 max-w-[16ch] font-editorial text-hero text-ink">
                Votre marque est-elle <em className="not-italic" style={{ color: "var(--signal)" }}>invisible</em>{" "}
                {/* Instrument Serif n’a pas le glyphe U+202F : l’espace fine y
                    tombe à zéro. On retombe sur l’insécable classique, seule
                    solution qui rende dans cette police. */}
                dans ChatGPT&nbsp;?
              </h1>
              <p className="mt-6 max-w-[44ch] text-ink-dim">
                {fr(
                  "Mesurez-le gratuitement en 90 secondes, sur les quatre moteurs. Vous verrez les réponses réelles, telles que vos prospects les reçoivent."
                )}
              </p>

              {/* Ce que le visiteur repart avec — équilibre la colonne face au formulaire */}
              <dl className="mt-12 max-w-[44ch] border-t border-rule">
                {[
                  ["Score de Visibilité IA", "sur 100, moteur par moteur"],
                  ["Part de voix", "face aux concurrents que vous nommez"],
                  ["Verbatims", "les réponses brutes, non retouchées"],
                ].map(([k, v]) => (
                  <div key={k} className="flex flex-wrap items-baseline gap-x-4 border-b border-rule py-3">
                    <dt className="font-mono text-sm text-ink">{k}</dt>
                    <dd className="text-sm text-ink-faint">{v}</dd>
                  </div>
                ))}
              </dl>
            </div>

            <div>
              <ScanForm />
            </div>
          </div>

          <div className="mt-12">
            <ProofBlock />
          </div>
        </section>

        {/* ── Pourquoi maintenant : traitement éditorial, pas bandeau de stats ── */}
        <section className="border-t border-rule-strong py-24">
          <blockquote className="max-w-[24ch] font-editorial text-4xl leading-none text-ink lg:max-w-[20ch] lg:text-5xl">
            <span style={{ color: "var(--signal)" }}>46&nbsp;%</span> des utilisateurs d’IA démarrent leur
            recherche d’achat directement sur une IA.
          </blockquote>
          <p className="mt-8 max-w-prose text-lg text-ink-dim">
            {fr(
              "Ils étaient 25 % en 2024. En B2B, un acheteur de logiciel sur deux commence désormais par un chatbot — et ChatGPT dépassait 900 millions d’utilisateurs hebdomadaires début 2026."
            )}
          </p>
          <p className="label mt-6">Sources : Alchemer 2026 · G2 Research 2026 · Reuters</p>
        </section>

        {/* ── La mesure : chiffres alignés, rythme distinct des sections voisines ── */}
        <section className="border-t border-rule py-24">
          <div className="flex flex-wrap items-baseline justify-between gap-4">
            <h2 className="font-editorial text-3xl text-ink">La mesure</h2>
            <p className="label">Étape 1 — gratuite, sans inscription</p>
          </div>

          <dl className="mt-12 grid gap-8 sm:grid-cols-3 sm:gap-6">
            {[
              ["24", "questions d’intention d’achat de votre secteur, générées puis figées pour toujours"],
              ["4", "moteurs interrogés via leurs API officielles : ChatGPT, Claude, Gemini, Perplexity"],
              ["1", "score sur 100, une part de voix, et les réponses brutes non retouchées"],
            ].map(([n, txt]) => (
              <div key={n} className="border-t-2 border-ink pt-4">
                <dt className="tnum font-mono text-4xl leading-none text-ink">{n}</dt>
                <dd className="mt-4 text-sm text-ink-dim">{fr(txt as string)}</dd>
              </div>
            ))}
          </dl>
        </section>

        {/* ── L’offre ── */}
        <section id="offre" className="scroll-mt-8 border-t border-rule py-24">
          <div className="flex flex-wrap items-baseline justify-between gap-4">
            <h2 className="font-editorial text-3xl text-ink">Le Sprint GEO</h2>
            <p className="label">Étape 2 — trente jours</p>
          </div>

          <p className="mt-8 max-w-prose text-lg text-ink-dim">
            Nous rendons votre site lisible par les IA, nous écrivons les pages qu’elles citent, et nous vous
            installons sur les sources qui font gagner vos concurrents.
          </p>

          <dl className="mt-16 border-t border-rule">
            {LIVRABLES.map(([title, desc]) => (
              <div key={title} className="grid gap-2 border-b border-rule py-6 lg:grid-cols-[280px_1fr] lg:gap-12">
                <dt className="font-mono text-sm text-ink">{title}</dt>
                <dd className="text-ink-dim">{fr(desc)}</dd>
              </div>
            ))}
          </dl>

          <div className="mt-16 flex flex-wrap items-end justify-between gap-8">
            <div>
              <p className="tnum font-editorial text-5xl text-ink">2&nbsp;900&nbsp;€</p>
              <p className="label mt-3">Paiement unique · 50&nbsp;% au démarrage, 50&nbsp;% à la livraison</p>
              <p className="mt-4 max-w-[42ch] text-sm text-ink-faint">
                {fr(
                  "Sprint Domination à 4 900 € : deux langues ou deux segments, le double de contenus, campagne presse approfondie."
                )}
              </p>
            </div>
            <a href={BOOKING_URL} className="btn-signal">Réserver un call</a>
          </div>
        </section>

        {/* ── L’engagement : colonne étroite, mesure de lecture longue ── */}
        <section className="border-t border-rule py-24">
          <div className="flex flex-wrap items-baseline justify-between gap-4">
            <h2 className="font-editorial text-3xl text-ink">La preuve</h2>
            <p className="label">Étape 3 — J+90, inclus</p>
          </div>

          <div className="mt-12 max-w-[54ch] border-l-2 border-signal pl-8">
            <p className="font-editorial text-2xl leading-snug text-ink">
              Nous garantissons les actions livrées, pas un score.
            </p>
            <p className="mt-6 text-ink-dim">
              {fr(
                "Les moteurs intègrent les changements en 4 à 12 semaines et leurs réponses varient par nature. Qui vous vend « la première place dans ChatGPT » vous vend quelque chose qu’il ne contrôle pas."
              )}
            </p>
            <p className="mt-4 text-ink-dim">
              {fr(
                "Ce que nous garantissons, c’est la mesure. À J+90, nous rejouons exactement les mêmes questions, sur les mêmes moteurs, avec la même méthode de calcul. Vous voyez la progression réelle — quelle qu’elle soit."
              )}
            </p>
          </div>

          <p className="label mt-12">Trois sprints par mois maximum</p>
        </section>

        {/* ── FAQ ── */}
        <section className="border-t border-rule py-24">
          <div className="grid gap-12 lg:grid-cols-[260px_1fr] lg:gap-16">
            <h2 className="font-editorial text-3xl text-ink lg:sticky lg:top-8 lg:self-start">Questions</h2>
            <div className="border-t border-rule">
              {FAQ.map((f) => (
                <details key={f.q} className="group border-b border-rule py-4">
                  <summary className="flex cursor-pointer items-baseline gap-4 font-mono text-sm text-ink marker:content-['']">
                    <span className="text-signal transition-transform duration-150 ease-sharp group-open:rotate-45">+</span>
                    {fr(f.q)}
                  </summary>
                  <p className="mt-3 max-w-prose pl-8 text-sm text-ink-dim">{fr(f.a)}</p>
                </details>
              ))}
            </div>
          </div>
        </section>

        {/* ── Rappel ── */}
        <section className="border border-signal">
          <div className="grid gap-8 p-8 lg:grid-cols-[1fr_auto] lg:items-center lg:p-12">
            <div>
              <h2 className="font-editorial text-3xl text-ink">Commencez par mesurer</h2>
              <p className="mt-3 max-w-prose text-ink-dim">
                {fr("Quatre-vingt-dix secondes, sans inscription. Vous saurez exactement où vous en êtes.")}
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
