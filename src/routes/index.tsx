import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";

import { Apparition } from "@/components/apparition";
import { Btn, Champ, Choix, Etiquette, Field, Label, LigneVide, Rule } from "@/components/kit";
import { FAQ, LANGUES, METIERS, SECTEURS, VILLES, exemple, type Metier } from "@/data/contenu";
import { lancerScan } from "@/lib/scan.functions";
import { NBSP, euros, fr, frTitre } from "@/lib/typo";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "GEO Sprint — êtes-vous cité par ChatGPT ? Scan gratuit" },
      {
        name: "description",
        content:
          "Mesurez gratuitement la visibilité de votre marque dans ChatGPT, Claude, Gemini et Perplexity. 24 questions d’achat, 4 moteurs, 1 score. Sprint GEO de 30 jours à 2 900 €.",
      },
      { property: "og:title", content: "GEO Sprint — êtes-vous cité par ChatGPT ?" },
      {
        property: "og:description",
        content:
          "Scan gratuit de visibilité IA sur ChatGPT, Claude, Gemini et Perplexity. Sans inscription.",
      },
    ],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: FAQ.map((f) => ({
            "@type": "Question",
            name: f.q,
            acceptedAnswer: { "@type": "Answer", text: f.r },
          })),
        }),
      },
    ],
  }),
  component: Accueil,
});

function Accueil() {
  return (
    <>
      <EnTete />
      <div className="mx-auto max-w-[1240px] px-6 lg:px-10">
        {/* Premier écran : titre + formulaire + preuve */}
        <section className="grid gap-16 pt-14 lg:grid-cols-[1.06fr_0.94fr] lg:gap-20 lg:pt-24">
          <div>
            <Apparition>
              <Label>visibilité dans les moteurs génératifs</Label>
              <h1 className="mt-6 text-balance text-[46px] leading-[0.95] sm:text-[68px] lg:text-[84px]">
                Votre marque est-elle <em className="not-italic text-bordeaux">invisible</em> dans
                ChatGPT{NBSP}?
              </h1>
            </Apparition>
            <Apparition delai={90}>
              <p className="mt-8 max-w-[46ch] text-[16px] leading-[1.72] text-ink-2 sm:text-[17px]">
                {fr(
                  "Quand un dirigeant demande conseil à une IA, la réponse cite deux ou trois marques. Il n’y a pas de deuxième page. Si la vôtre n’y figure pas, vous perdez l’affaire sans jamais l’apprendre.",
                )}
              </p>
            </Apparition>
            <Apparition delai={160} className="mt-14 hidden lg:block">
              <BlocPreuve />
            </Apparition>
          </div>

          <Apparition delai={60} className="lg:pt-2">
            <Formulaire />
          </Apparition>

          <Apparition delai={60} className="lg:hidden">
            <BlocPreuve />
          </Apparition>
        </section>

        <StatistiqueExergue />
        <LaMesure />
        <Offre />
        <Engagement />
        <Faq />
        <AppelFinal />
        <PiedDePage />
      </div>
    </>
  );
}

const NAV = [
  ["/guide-geo", "Guide du GEO"],
  ["/geo-vs-seo", "GEO vs SEO"],
  ["/alternatives-agence-seo", "Alternatives"],
] as const;

function EnTete() {
  return (
    <header className="sticky top-0 z-40 border-b border-rule bg-paper/80 backdrop-blur-md">
      <div className="mx-auto grid max-w-[1240px] grid-cols-[minmax(0,1fr)_auto] items-center gap-4 px-6 py-4 lg:px-10">
        <Link
          to="/"
          className="truncate font-display text-[21px] leading-none transition-colors duration-300 hover:text-bordeaux"
        >
          GEO&nbsp;Sprint
        </Link>
        <nav className="flex shrink-0 items-center gap-5 sm:gap-7">
          {NAV.map(([to, label]) => (
            <Link key={to} to={to} className="label-xs lien-nav hidden sm:inline-block">
              {label}
            </Link>
          ))}
          <a href="#scan" className="label-xs lien-nav text-bordeaux sm:hidden">
            Scan gratuit
          </a>
        </nav>
      </div>
    </header>
  );
}

/* ---------------- Bloc de preuve interactif ---------------- */

function BlocPreuve() {
  const [metier, setMetier] = useState<Metier>(METIERS[0]);
  const [ville, setVille] = useState<string>(VILLES[0]);
  const ex = exemple(metier, ville);

  return (
    <div className="carte carte-i p-6 sm:p-8">
      <div className="flex flex-wrap items-center gap-2">
        <Etiquette>exemple</Etiquette>
        <Etiquette ton="bordeaux">noms de concurrents fictifs</Etiquette>
      </div>

      <p className="mt-6 font-display text-[27px] leading-[1.2] sm:text-[34px]">
        Je suis{" "}
        <select
          value={metier}
          onChange={(e) => setMetier(e.target.value as Metier)}
          className="select-edito font-display text-[27px] sm:text-[34px]"
          aria-label="Choisir un métier"
        >
          {METIERS.map((m) => (
            <option key={m} value={m}>
              {m}
            </option>
          ))}
        </select>{" "}
        à{" "}
        <select
          value={ville}
          onChange={(e) => setVille(e.target.value)}
          className="select-edito font-display text-[27px] sm:text-[34px]"
          aria-label="Choisir une ville"
        >
          {VILLES.map((v) => (
            <option key={v} value={v}>
              {v}
            </option>
          ))}
        </select>
      </p>

      <div
        key={`${metier}-${ville}`}
        className="rise mt-7 grid gap-5 border-t border-rule pt-6 sm:grid-cols-[auto_1fr] sm:gap-x-8 sm:gap-y-6"
      >
        <Label className="sm:pt-1">question posée</Label>
        <p className="text-[14px] leading-snug">{fr(ex.question)}</p>

        <Label className="sm:pt-1">réponse de l’IA</Label>
        <p className="max-w-[52ch] text-[15px] leading-relaxed text-ink-2">{ex.reponse}</p>

        <Label className="sm:pt-1">marques citées</Label>
        <ol className="flex flex-wrap gap-x-5 gap-y-1 text-[14px]">
          {ex.concurrents.map((c, i) => (
            <li key={c}>
              <span className="num text-[11px] text-ink-3">{String(i + 1).padStart(2, "0")}</span> {c}
            </li>
          ))}
        </ol>
      </div>

      <LigneVide legende="votre marque" className="mt-9" />
    </div>
  );
}


/* ---------------- Formulaire de scan ---------------- */

function Formulaire() {
  const navigate = useNavigate();
  const demarrer = useServerFn(lancerScan);
  const [envoi, setEnvoi] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErreur(null);
    const f = new FormData(e.currentTarget);
    const marque = String(f.get("marque") ?? "").trim();
    if (!marque) return setErreur("Le nom de la marque est obligatoire.");
    setEnvoi(true);
    try {
      const res = await demarrer({
        data: {
          marque,
          url: String(f.get("url") ?? "").trim() || null,
          secteur: String(f.get("secteur") ?? SECTEURS[0]),
          ville: String(f.get("ville") ?? "").trim() || null,
          concurrents: [1, 2, 3]
            .map((i) => String(f.get(`c${i}`) ?? "").trim())
            .filter(Boolean),
          langue: String(f.get("langue") ?? "fr") as "fr" | "it" | "en",
        },
      });
      if ("erreur" in res && res.erreur) {
        setErreur(res.erreur);
        setEnvoi(false);
        return;
      }
      if ("id" in res) await navigate({ to: "/scan/$id", params: { id: res.id } });
    } catch {
      setErreur("Le scan n’a pas pu démarrer. Réessayez dans un instant.");
      setEnvoi(false);
    }
  }

  return (
    <form
      id="scan"
      onSubmit={onSubmit}
      className="carte carte-i scroll-mt-24 p-6 sm:p-9"
    >
      <div className="flex items-baseline justify-between gap-4">
        <h2 className="text-[27px] leading-none sm:text-[30px]">Scan gratuit</h2>
        <span className="label-xs shrink-0">sans inscription</span>
      </div>
      <Rule className="my-6" />


      <div className="grid gap-5">
        <Field label="Marque">
          <Champ name="marque" required maxLength={80} placeholder="Cabinet Vaurel" />
        </Field>
        <Field label="Site web">
          <Champ name="url" maxLength={200} placeholder="https://…" inputMode="url" />
        </Field>
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Secteur">
            <Choix name="secteur" defaultValue={SECTEURS[0]}>
              {SECTEURS.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </Choix>
          </Field>
          <Field label="Ville principale">
            <Champ name="ville" maxLength={80} placeholder="Lyon" />
          </Field>
        </div>
        <div>
          <Label className="pb-1.5">Concurrents (jusqu’à 3)</Label>
          <div className="grid gap-3">
            {[1, 2, 3].map((i) => (
              <Champ key={i} name={`c${i}`} maxLength={80} placeholder={`Concurrent ${i}`} />
            ))}
          </div>
        </div>
        <Field label="Langue des questions">
          <Choix name="langue" defaultValue="fr">
            {LANGUES.map((l) => (
              <option key={l.code} value={l.code}>
                {l.label}
              </option>
            ))}
          </Choix>
        </Field>
      </div>

      {erreur ? <p className="num mt-5 text-[12px] text-bordeaux">{erreur}</p> : null}

      <Btn type="submit" size="lg" className="mt-7 w-full" disabled={envoi}>
        {envoi ? "Lancement…" : "Mesurer ma visibilité"}
      </Btn>
      <p className="mt-4 text-[12px] leading-snug text-ink-3">
        {fr(
          "Environ 90 secondes. 3 scans par jour et par connexion. Aucune donnée n’est transmise à un tiers en dehors des quatre moteurs interrogés.",
        )}
      </p>
    </form>
  );
}

/* ---------------- Statistique en exergue ---------------- */

function StatistiqueExergue() {
  return (
    <section className="mt-32 grid gap-8 border-t border-rule-strong pt-8 lg:grid-cols-[1fr_260px] lg:gap-20">
      <p className="font-display text-[40px] leading-[1.06] sm:text-[62px]">
        <span className="num text-bordeaux">46{NBSP}%</span> des utilisateurs d’IA démarrent leur
        recherche d’achat directement sur une IA.
      </p>
      <div className="lg:pt-4">
        <Label className="pb-2">sources</Label>
        <ul className="text-[12px] leading-relaxed text-ink-3">
          <li>Alchemer, 2026</li>
          <li>G2 Research, 2026</li>
          <li>Reuters</li>
        </ul>
      </div>
    </section>
  );
}

/* ---------------- La mesure ---------------- */

function LaMesure() {
  return (
    <section className="mt-28">
      <h2 className="text-[38px] leading-none sm:text-[48px]">La mesure</h2>
      <div className="mt-6 flex flex-wrap items-baseline gap-x-8 gap-y-4 border-y border-rule-strong py-6">
        <span className="num text-[52px] leading-none">24</span>
        <span className="text-[16px] text-ink-2">questions d’intention d’achat, figées</span>
        <span className="num text-[52px] leading-none">4</span>
        <span className="text-[16px] text-ink-2">moteurs : ChatGPT, Claude, Gemini, Perplexity</span>
        <span className="num text-[52px] leading-none">1</span>
        <span className="text-[16px] text-ink-2">score de 0 à 100</span>
      </div>
      <div className="mt-8 grid gap-x-16 gap-y-6 md:grid-cols-[minmax(0,42ch)_1fr]">
        <p className="text-[15px] leading-relaxed text-ink-2">
          {fr(
            "L’échantillon se répartit en 40 % de questions comparatives, 25 % de questions problème, 20 % de questions locales et 15 % de questions de confiance. Il est généré une fois, puis figé : le re-scan à J+90 rejoue exactement les mêmes, sinon la comparaison ne vaut rien.",
          )}
        </p>
        <dl className="grid grid-cols-2 gap-y-4 self-start sm:grid-cols-4">
          {[
            ["taux de mention", "50 %"],
            ["position moyenne", "20 %"],
            ["recommandation", "20 %"],
            ["sentiment", "10 %"],
          ].map(([k, v]) => (
            <div key={k}>
              <dt className="label-xs">{k}</dt>
              <dd className="num text-[24px]">{v.replace(" ", NBSP)}</dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}

/* ---------------- Offre ---------------- */

const LIVRABLES = [
  ["Audit technique", "Accès des robots d’IA, données structurées, pages qui répondent réellement aux questions."],
  ["Cinq contenus rédigés", "Format réponse directe, publiés sur votre site, sur les questions où vous êtes absent."],
  ["Huit cibles de citation", "Annuaires, comparateurs et médias sectoriels réellement consultés par les moteurs."],
  ["Rapport de fin de sprint", "Ce qui a été livré, ce qui reste, et les cibles encore en cours d’obtention."],
  ["Re-scan à J+90", "Mêmes 24 questions, mêmes moteurs, rapport comparatif avant/après."],
];

function Offre() {
  return (
    <section className="mt-32">
      <h2 className="text-[38px] leading-none sm:text-[48px]">Le Sprint GEO</h2>
      <div className="mt-8 grid gap-12 lg:grid-cols-[1fr_300px] lg:gap-20">
        <ol>
          {LIVRABLES.map(([titre, desc], i) => (
            <li key={titre} className="grid grid-cols-[28px_1fr] gap-4 border-b border-rule py-4">
              <span className="num pt-1 text-[11px] text-ink-3">{String(i + 1).padStart(2, "0")}</span>
              <div>
                <div className="text-[18px] font-medium">{titre}</div>
                <p className="mt-1 max-w-[54ch] text-[14px] leading-snug text-ink-2">{desc}</p>
              </div>
            </li>
          ))}
        </ol>

        <aside className="carte h-max p-6">
          <Label>mission de 30 jours</Label>
          <div className="num mt-2 text-[46px] leading-none">{euros(2900)}</div>
          <p className="mt-3 text-[13px] leading-snug text-ink-2">
            Paiement unique, réparti 50{NBSP}/{NBSP}50 : moitié au lancement, moitié à la livraison.
            Sans abonnement.
          </p>
          <Rule className="my-5" />
          <Label>option</Label>
          <div className="num mt-1 text-[22px]">Sprint Domination · {euros(4900)}</div>
          <p className="mt-2 text-[13px] leading-snug text-ink-2">
            Périmètre élargi : dix contenus, seize cibles de citation, deux langues.
          </p>
          <Rule className="my-5" />
          <p className="text-[13px] leading-snug text-ink-2">
            {fr("Le scan et le call de restitution de 30 minutes sont gratuits et sans engagement.")}
          </p>
        </aside>
      </div>
    </section>
  );
}

/* ---------------- Engagement ---------------- */

function Engagement() {
  return (
    <Apparition
      as="section"
      className="mt-32 grid gap-10 border-t border-rule pt-10 lg:grid-cols-[minmax(0,34ch)_1fr]"
    >
      <div>
        <Label className="pb-3">engagement d’honnêteté</Label>
        <p className="font-display text-[30px] leading-[1.12]">
          {frTitre("Nous garantissons les actions livrées, pas un score.")}
        </p>
        <p className="mt-5 text-[14px] leading-relaxed text-ink-2">
          {fr(
            "Les moteurs génératifs intègrent les changements de contenu et de citations en 4 à 12 semaines. Personne ne peut honnêtement promettre un chiffre dans cette fenêtre : nous nous engageons donc sur ce qui est produit, et nous le mesurons à J+90.",
          )}
        </p>
        <p className="mt-4 text-[14px] leading-relaxed text-ink-2">
          {fr(
            "Vous ne trouverez sur ce site ni témoignage, ni logo client, ni résultat chiffré présenté comme un cas réel. L’agence est jeune : la crédibilité vient de la clarté de la méthode, pas d’une preuve sociale fabriquée.",
          )}
        </p>
      </div>
      <div className="lg:pt-14">
        <LigneVide legende="ce que nous ne promettons pas" />
      </div>
    </section>
  );
}

/* ---------------- FAQ ---------------- */

function Faq() {
  return (
    <Apparition as="section" className="mt-32">
      <h2 className="text-[34px] leading-none sm:text-[46px]">Questions fréquentes</h2>
      <dl className="mt-8 border-t border-rule">
        {FAQ.map((f) => (
          <div
            key={f.q}
            className="ligne-i -mx-3 grid gap-2 border-b border-rule px-3 py-6 md:grid-cols-[minmax(0,32ch)_1fr] md:gap-12"
          >
            <dt className="text-[16px] font-medium leading-snug">{f.q}</dt>
            <dd className="max-w-[62ch] text-[15px] leading-relaxed text-ink-2">{f.r}</dd>
          </div>
        ))}
      </dl>
    </Apparition>
  );
}

/* ---------------- Appel final ---------------- */

function AppelFinal() {
  return (
    <Apparition
      as="section"
      className="mt-32 grid items-end gap-8 border-t border-rule pt-10 lg:grid-cols-[1fr_auto] lg:gap-16"
    >
      <div>
        <Label className="pb-4">première étape</Label>
        <p className="max-w-[24ch] text-balance font-display text-[38px] font-light leading-[1.06] sm:text-[54px]">
          {frTitre("Commencez par savoir où vous en êtes.")}
        </p>
        <p className="mt-5 max-w-[52ch] text-[15px] leading-relaxed text-ink-2">
          {fr(
            "Le scan est gratuit, sans inscription et sans relance automatique : 24 questions, 4 moteurs, un score et un rapport complet.",
          )}
        </p>
      </div>
      <a href="#scan" className="shrink-0">
        <Btn size="lg" className="w-full sm:w-auto">
          Lancer le scan gratuit
        </Btn>
      </a>
    </Apparition>
  );
}

function PiedDePage() {
  return (
    <footer className="mt-28 border-t border-rule py-10">
      <div className="flex flex-wrap items-baseline justify-between gap-x-8 gap-y-6">
        <span className="font-display text-[20px]">GEO&nbsp;Sprint</span>
        <nav className="flex flex-wrap gap-x-7 gap-y-3">
          {[
            ["/guide-geo", "Guide du GEO"],
            ["/geo-vs-seo", "GEO vs SEO"],
            ["/alternatives-agence-seo", "Alternatives"],
            ["/mentions-legales", "Mentions légales"],
            ["/confidentialite", "Confidentialité"],
          ].map(([to, label]) => (
            <Link key={to} to={to} className="label-xs lien-nav">
              {label}
            </Link>
          ))}
        </nav>
      </div>
      <p className="num mt-8 text-[11px] leading-relaxed text-ink-3">
        Mesure par API officielles des éditeurs · aucun scraping des interfaces grand public
      </p>
    </footer>
  );
}

