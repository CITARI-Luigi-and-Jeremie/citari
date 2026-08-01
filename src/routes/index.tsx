import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";

import { Apparition } from "@/components/apparition";
import { ChampTexte } from "@/components/fond";

import { LogoLien, Logo } from "@/components/logo";
import { Btn, Champ, Choix, Etiquette, Field, Label, LigneVide, Rule } from "@/components/kit";
import { FAQ, LANGUES, METIERS, SECTEURS, VILLES, exemple, type Metier } from "@/data/contenu";
import { lancerScan } from "@/lib/scan.functions";
import { NBSP, euros, fr, frTitre } from "@/lib/typo";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Citari — êtes-vous cité par ChatGPT ? Scan gratuit" },
      {
        name: "description",
        content:
          "Mesurez gratuitement la visibilité de votre marque dans ChatGPT, Claude, Gemini et Perplexity. 24 questions d’achat, 4 moteurs, 1 score. Sprint GEO de 30 jours à 2 900 €.",
      },
      { property: "og:title", content: "Citari — êtes-vous cité par ChatGPT ?" },
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
        <section className="relative grid gap-16 pt-14 lg:grid-cols-[1.06fr_0.94fr] lg:gap-20 lg:pt-24">
          <ChampTexte />
          <div className="relative z-[2]">
            <Apparition>

              <Label>Votre visibilité dans ChatGPT, Claude, Gemini, Grok et Perplexity</Label>
              <h1 className="mt-6 text-balance text-[46px] leading-[0.95] sm:text-[68px] lg:text-[84px]">
                Vos clients ne cherchent plus sur{" "}
                <em className="not-italic text-ink-3">Google</em>.
              </h1>
            </Apparition>
            <Apparition delai={90}>
              <p className="mt-8 max-w-[44ch] text-[17px] leading-[1.68] text-ink-2 sm:text-[19px]">
                Ils demandent à ChatGPT. Qui recommande votre concurrent. Savoir lequel prend 90
                secondes.
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
        <BandeauConfiance />
        <StatistiqueExergue />
        <CoutInvisibilite />
        <ScanRevele />
        <LaMesure />
        <Pivot />
        <Offre />
        <Deroule />
        <PourQui />
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
      <div className="mx-auto grid max-w-[1240px] grid-cols-[minmax(0,1fr)_auto] items-center gap-4 px-6 py-5 lg:px-10">
        <LogoLien hauteur={36} className="justify-self-start" />
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

function PilulePreuve({
  valeur,
  onChange,
  options,
  aria,
}: {
  valeur: string;
  onChange: (v: string) => void;
  options: readonly string[];
  aria: string;
}) {
  return (
    <span className="group relative inline-flex max-w-full items-center gap-1.5 rounded-full border border-bordeaux/35 bg-paper px-3 py-1 align-middle transition-colors duration-300 hover:border-bordeaux focus-within:border-bordeaux">
      <span className="truncate text-[15px] text-bordeaux sm:text-[16px]">{valeur}</span>
      <svg
        aria-hidden="true"
        viewBox="0 0 12 12"
        className="h-2.5 w-2.5 shrink-0 text-bordeaux/70 transition-transform duration-300 group-hover:translate-y-px"
      >
        <path d="M2 4.5 6 8.5 10 4.5" fill="none" stroke="currentColor" strokeWidth="1.6" />
      </svg>
      <select
        value={valeur}
        onChange={(e) => onChange(e.target.value)}
        aria-label={aria}
        className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
      >
        {options.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
    </span>
  );
}

const MOTEURS_DEMO = ["ChatGPT", "Claude", "Gemini", "Perplexity", "Grok"] as const;
type MoteurDemo = (typeof MOTEURS_DEMO)[number];

function BlocPreuve() {
  const [metier, setMetier] = useState<Metier>(METIERS[0]);
  const [ville, setVille] = useState<string>(VILLES[0]);
  const [moteur, setMoteur] = useState<MoteurDemo>(MOTEURS_DEMO[0]);
  const ex = exemple(metier, ville);
  const decalage = MOTEURS_DEMO.indexOf(moteur) % ex.concurrents.length;
  const classement = ex.concurrents.map((_, i) => ex.concurrents[(i + decalage) % ex.concurrents.length]);

  return (
    <div className="carte carte-i overflow-hidden">
      {/* Réglage : une phrase, deux mots à changer. */}
      <div className="border-b border-rule bg-paper-2/60 px-5 py-4 sm:px-7">
        <span className="label-xs">démonstration</span>
        <p className="mt-2 text-[15px] leading-relaxed text-ink-2 sm:text-[16px]">
          Je suis{" "}
          <PilulePreuve
            aria="métier"
            valeur={metier}
            options={METIERS}
            onChange={(v) => setMetier(v as Metier)}
          />{" "}
          à{" "}
          <PilulePreuve aria="ville" valeur={ville} options={VILLES} onChange={setVille} />
        </p>
      </div>

      {/* Choix du moteur : les cinq que nous interrogeons. */}
      <div className="flex flex-wrap items-center gap-x-1 gap-y-1.5 border-b border-rule px-5 py-3 sm:px-7">
        {MOTEURS_DEMO.map((m) => {
          const actif = m === moteur;
          return (
            <button
              key={m}
              type="button"
              onClick={() => setMoteur(m)}
              aria-pressed={actif}
              className={`rounded-full px-3 py-1.5 text-[12px] tracking-[0.02em] transition-[background-color,color] duration-300 ease-[cubic-bezier(0.2,0.7,0.2,1)] ${
                actif ? "bg-ink text-paper" : "text-ink-3 hover:bg-paper-2 hover:text-ink"
              }`}
            >
              {m}
            </button>
          );
        })}
      </div>

      <div key={`${metier}-${ville}-${moteur}`} className="rise px-5 py-6 sm:px-7 sm:py-8">
        <div className="flex justify-end">
          <div className="max-w-[36ch]">
            <span className="label-xs mb-2 block text-right">votre client</span>
            <p className="rounded-2xl rounded-br-md bg-ink px-4 py-3 text-[14px] leading-snug text-paper shadow-soft">
              {fr(ex.question)}
            </p>
          </div>
        </div>

        <div className="mt-7 flex items-center gap-2.5">
          <span className="h-1.5 w-1.5 rounded-full bg-bordeaux" />
          <span className="label-xs">{fr(`${moteur} répond`)}</span>
        </div>

        <ol className="mt-4 overflow-hidden rounded-lg border border-rule bg-card">
          {classement.map((c, i) => (
            <li key={c} className="ligne-i flex items-center gap-4 border-b border-rule px-4 py-3.5">
              <span className="num w-5 shrink-0 text-[12px] text-ink-3">{String(i + 1).padStart(2, "0")}</span>
              <span className="min-w-0 flex-1 text-[16px] leading-snug">{c}</span>
              <span className="label-xs shrink-0 text-ink-3">cité</span>
            </li>
          ))}
          <li className="relative flex items-center gap-4 bg-bordeaux-wash px-4 py-4">
            <span className="absolute inset-y-0 left-0 w-px bg-bordeaux" />
            <span className="num w-5 shrink-0 text-center text-[12px] text-bordeaux/60">—</span>
            <span className="min-w-0 flex-1 font-display text-[20px] italic leading-tight text-bordeaux">
              votre marque
            </span>
            <Etiquette ton="bordeaux">absente</Etiquette>
          </li>
        </ol>

        <p className="mt-5 text-[13px] leading-relaxed text-ink-3">
          {fr("Exemple illustratif : les noms sont fictifs. Votre scan interroge ChatGPT, Claude, Gemini, Perplexity et Grok avec vos vrais concurrents.")}
        </p>
      </div>
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
        <div>
          <h2 className="text-[27px] leading-none sm:text-[30px]">Scan gratuit</h2>
          <p className="mt-2 text-[14px] leading-snug text-ink-2">
            {fr("Votre score de visibilité dans ChatGPT, Claude, Gemini, Grok et Perplexity.")}
          </p>
        </div>
        <span className="label-xs shrink-0">sans inscription</span>
      </div>
      <Rule className="my-6" />

      <ApercuRapport />
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
        {envoi ? "Lancement…" : "Lancer mon scan gratuit"}
      </Btn>
      <p className="mt-4 text-center text-[12px] leading-snug text-ink-3">
        Gratuit · Sans compte · Sans carte bancaire · Résultat en 90 secondes
      </p>
      <p className="mt-2 text-center text-[12px] leading-snug text-ink-3">
        {fr(
          "3 scans par jour et par connexion. Aucune donnée n’est transmise à un tiers en dehors des moteurs interrogés.",
        )}
      </p>
    </form>
  );
}

/* ---------------- Statistique en exergue ---------------- */

function StatistiqueExergue() {
  return (
    <Apparition
      as="section"
      className="mt-32 grid gap-8 border-t border-rule pt-10 lg:grid-cols-[1fr_240px] lg:gap-20"
    >
      <p className="text-balance font-display text-[34px] font-light leading-[1.1] sm:text-[56px]">
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
    </Apparition>
  );
}

/* ---------------- La mesure ---------------- */

function LaMesure() {
  return (
    <Apparition as="section" className="mt-28">
      <h2 className="text-[34px] leading-none sm:text-[46px]">La mesure</h2>
      <dl className="mt-8 grid gap-x-10 gap-y-6 border-y border-rule py-8 sm:grid-cols-3">
        {[
          ["24", "questions d’intention d’achat, figées"],
          ["4", "moteurs : ChatGPT, Claude, Gemini, Perplexity"],
          ["1", "score de 0 à 100"],
        ].map(([n, t]) => (
          <div key={n} className="flex items-baseline gap-4">
            <dt className="font-display text-[46px] font-light leading-none">{n}</dt>
            <dd className="max-w-[26ch] text-[14px] leading-snug text-ink-2">{t}</dd>
          </div>
        ))}
      </dl>
      <div className="mt-10 grid gap-x-16 gap-y-8 md:grid-cols-[minmax(0,42ch)_1fr]">
        <p className="text-[15px] leading-relaxed text-ink-2">
          {fr(
            "L’échantillon se répartit en 40 % de questions comparatives, 25 % de questions problème, 20 % de questions locales et 15 % de questions de confiance. Il est généré une fois, puis figé : le re-scan à J+90 rejoue exactement les mêmes, sinon la comparaison ne vaut rien.",
          )}
        </p>
        <dl className="grid grid-cols-2 gap-y-6 self-start sm:grid-cols-4">
          {[
            ["taux de mention", "50 %"],
            ["position moyenne", "20 %"],
            ["recommandation", "20 %"],
            ["sentiment", "10 %"],
          ].map(([k, v]) => (
            <div key={k}>
              <dt className="label-xs">{k}</dt>
              <dd className="num mt-1.5 text-[22px]">{v.replace(" ", NBSP)}</dd>
            </div>
          ))}
        </dl>
      </div>
    </Apparition>
  );
}

/* ---------------- Offre ---------------- */

const LIVRABLES = [
  [
    "Nous rendons votre site lisible par les IA.",
    "La plupart des sites bloquent les robots des IA sans le savoir. Nous ouvrons la porte, nous étiquetons chaque page, nous structurons vos réponses pour qu’une machine puisse les citer.",
  ],
  [
    "Nous créons les pages que les IA citent.",
    "Comparatifs, alternatives, guides d’achat, questions fréquentes. Des faits, des chiffres, des réponses directes : le seul type de contenu qu’une IA reprend.",
  ],
  [
    "Nous faisons parler de vous ailleurs.",
    "Une IA ne croit pas ce que vous dites de vous. Elle croit ce que les autres en disent. Annuaires du secteur, presse spécialisée, comparateurs, forums : nous allons chercher les citations là où vos concurrents les ont déjà.",
  ],
];

function Pivot() {
  return (
    <Apparition as="section" className="mt-32 border-t border-rule pt-10">
      <p className="max-w-[22ch] text-balance font-display text-[40px] font-light leading-[1.04] sm:text-[64px]">
        Le scan vous dit où vous en êtes. Il ne change rien.
      </p>
      <p className="mt-6 font-display text-[30px] leading-none text-bordeaux sm:text-[40px]">
        Le Sprint GEO, si.
      </p>
    </Apparition>
  );
}

function Offre() {
  return (
    <Apparition as="section" className="mt-20">
      <h2 className="max-w-[18ch] text-balance text-[34px] leading-[1.04] sm:text-[46px]">
        30 jours pour entrer dans les réponses.
      </h2>
      <p className="mt-5 max-w-[46ch] text-[15px] leading-relaxed text-ink-2">
        Nous ne vous vendons pas un tableau de bord de plus. Nous faisons le travail.
      </p>
      <div className="mt-10 grid gap-12 lg:grid-cols-[1fr_320px] lg:gap-20">
        <ol className="border-t border-rule">
          {LIVRABLES.map(([titre, desc], i) => (
            <li
              key={titre}
              className="ligne-i -mx-3 grid grid-cols-[30px_1fr] gap-4 border-b border-rule px-3 py-5"
            >
              <span className="num pt-1 text-[10px] tracking-[0.14em] text-ink-3">
                {String(i + 1).padStart(2, "0")}
              </span>
              <div>
                <div className="text-[17px] font-medium">{titre}</div>
                <p className="mt-1.5 max-w-[54ch] text-[14px] leading-relaxed text-ink-2">
                  {fr(desc)}
                </p>
              </div>
            </li>
          ))}
        </ol>

        <aside className="carte carte-i h-max p-7">
          <Label>mission de 30 jours</Label>
          <div className="mt-3 font-display text-[52px] font-light leading-none">{euros(2900)}</div>
          <p className="mt-3 text-[14px] font-medium">Une fois. Pas d’abonnement.</p>
          <p className="mt-3 text-[13px] leading-relaxed text-ink-2">
            50{NBSP}% à la commande, 50{NBSP}% à la livraison. Nous garantissons l’exécution
            intégrale des trois chantiers, détaillée dans un rapport de fin de mission.
          </p>
          <Rule className="my-6" />
          <Label>option</Label>
          <div className="mt-2 text-[16px] font-medium">
            Sprint Domination · <span className="num">{euros(4900)}</span>
          </div>
          <p className="mt-2 text-[13px] leading-relaxed text-ink-2">
            Périmètre élargi : dix contenus, seize cibles de citation, deux langues.
          </p>
          <Rule className="my-6" />
          <Label>disponibilité</Label>
          <p className="mt-2 text-[13px] leading-relaxed text-ink-2">
            Trois sprints par mois. Nous n’en prenons pas davantage. Un seul client par secteur et
            par zone.
          </p>
        </aside>
      </div>
    </Apparition>
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
        <p className="mt-6 max-w-[34ch] text-balance font-display text-[26px] leading-[1.15] text-bordeaux">
          {frTitre(
            "Si votre score est bon, nous vous le dirons et nous ne vous vendrons rien.",
          )}
        </p>
      </div>
      <div className="lg:pt-14">
        <LigneVide legende="ce que nous ne promettons pas" />
      </div>
    </Apparition>
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
          {frTitre("Commencez par le scan.")}
        </p>
        <p className="mt-5 max-w-[52ch] text-[15px] leading-relaxed text-ink-2">
          {fr(
            "Il est gratuit, et il vous dira si vous avez un problème. 24 questions, 4 moteurs, un score, un rapport complet.",
          )}
        </p>
      </div>
      <a href="#scan" className="shrink-0">
        <Btn size="lg" className="w-full sm:w-auto">
          Lancer mon scan gratuit
        </Btn>
      </a>
    </Apparition>
  );
}

/* ---------------- Bandeau de confiance ---------------- */

const CONFIANCE = [
  ["96", "réponses d’IA analysées, une par question et par moteur"],
  ["90 s", "pour obtenir votre score, sans inscription"],
  ["J+90", "re-scan offert, mêmes questions, mêmes moteurs"],
  ["0", "abonnement, 0 engagement, 0 reconduction tacite"],
];

function BandeauConfiance() {
  return (
    <Apparition as="section" className="mt-20 border-y border-rule">
      <dl className="grid divide-y divide-rule sm:grid-cols-2 sm:divide-y-0 lg:grid-cols-4 lg:divide-x">
        {CONFIANCE.map(([n, t]) => (
          <div key={n} className="px-0 py-6 sm:px-6 lg:first:pl-0 lg:last:pr-0">
            <dt className="font-display text-[38px] font-light leading-none">
              {n.replace(" ", NBSP)}
            </dt>
            <dd className="mt-2 max-w-[28ch] text-[13px] leading-snug text-ink-2">{t}</dd>
          </div>
        ))}
      </dl>
    </Apparition>
  );
}

/* ---------------- Le contexte ---------------- */

function CoutInvisibilite() {
  return (
    <Apparition as="section" className="mt-32">
      <Label className="pb-4">ce qui se joue</Label>
      <h2 className="max-w-[22ch] text-balance text-[34px] leading-[1.04] sm:text-[52px]">
        {frTitre(
          "Sur Google, on vous trouve. Dans ChatGPT, on vous recommande — ou pas.",
        )}
      </h2>
      <div className="mt-10 grid gap-x-16 gap-y-10 lg:grid-cols-[1fr_1fr]">
        <div className="carte carte-i p-7">
          <Label>la réponse d’une IA</Label>
          <ol className="mt-5 grid gap-3 text-[15px]">
            {["Concurrent A", "Concurrent B", "Concurrent C"].map((c, i) => (
              <li key={c} className="flex items-baseline gap-3 border-b border-rule pb-3">
                <span className="num text-[11px] text-ink-3">{String(i + 1).padStart(2, "0")}</span>
                <span className="text-ink-2">{c}</span>
              </li>
            ))}
          </ol>
          <LigneVide legende="votre marque" className="mt-7" />
        </div>
        <div className="self-center">
          <p className="text-[15px] leading-relaxed text-ink-2">
            {fr(
              "Un moteur de recherche affiche dix liens et laisse l’acheteur choisir. Une IA donne trois noms. Parfois deux.",
            )}
          </p>
          <p className="mt-5 text-[15px] leading-relaxed text-ink-2">
            {fr(
              "Il n’y a pas de deuxième page. Il n’y a pas de « voir plus de résultats ». Vous êtes dans la réponse, ou vous n’existez pas.",
            )}
          </p>
          <p className="mt-6 font-display text-[26px] leading-[1.15]">
            {frTitre("Le référencement vous plaçait dans une liste. L’IA, elle, choisit.")}
          </p>
        </div>
      </div>
    </Apparition>
  );
}

/* ---------------- Ce que le scan révèle ---------------- */

const REVELE = [
  "Votre score de visibilité, de 0 à 100, mesuré sur ChatGPT, Claude, Gemini et Perplexity.",
  "Combien de fois vos concurrents sont cités sur les questions où vous ne l’êtes pas.",
  "Les phrases exactes que l’IA prononce à votre sujet. Mot pour mot.",
  "Les sources sur lesquelles elle s’appuie pour recommander vos concurrents plutôt que vous.",
];

function ScanRevele() {
  return (
    <Apparition as="section" className="mt-32">
      <div className="flex flex-wrap items-baseline justify-between gap-4">
        <h2 className="text-[34px] leading-none sm:text-[46px]">Ce que le scan révèle</h2>
        <span className="label-xs">en 90 secondes, gratuitement</span>
      </div>
      <ol className="mt-10 border-t border-rule">
        {REVELE.map((t, i) => (
          <li
            key={t}
            className="ligne-i -mx-3 grid grid-cols-[30px_1fr] gap-4 border-b border-rule px-3 py-5"
          >
            <span className="num pt-1.5 text-[10px] tracking-[0.14em] text-ink-3">
              {String(i + 1).padStart(2, "0")}
            </span>
            <p className="max-w-[70ch] text-[16px] leading-relaxed sm:text-[18px]">{fr(t)}</p>
          </li>
        ))}
      </ol>
    </Apparition>
  );
}

/* ---------------- Déroulé du sprint ---------------- */

const ETAPES = [
  ["J0", "Scan et call de restitution", "On lit le rapport ensemble, 30 minutes. Vous repartez avec le diagnostic, que vous travailliez avec nous ou non."],
  ["J1 — J7", "Audit et plan de bataille", "Accès des robots d’IA, données structurées, questions perdues : le périmètre exact est arrêté et validé avec vous."],
  ["J8 — J25", "Production", "Cinq contenus au format réponse directe, publiés. Huit cibles de citation travaillées une à une."],
  ["J26 — J30", "Livraison", "Rapport de fin de sprint : ce qui a été livré, ce qui reste en cours d’obtention, et pourquoi."],
  ["J+90", "Re-scan", "Mêmes 24 questions, mêmes moteurs. Comparatif avant/après, sans mise en scène."],
];

function Deroule() {
  return (
    <Apparition as="section" className="mt-32">
      <h2 className="text-[34px] leading-none sm:text-[46px]">Le déroulé, jour par jour</h2>
      <ol className="mt-10 border-t border-rule">
        {ETAPES.map(([jour, titre, desc]) => (
          <li
            key={jour}
            className="ligne-i -mx-3 grid gap-2 border-b border-rule px-3 py-6 md:grid-cols-[110px_minmax(0,26ch)_1fr] md:gap-10"
          >
            <span className="num pt-1 text-[11px] tracking-[0.12em] text-bordeaux">
              {jour.replace(/ /g, NBSP)}
            </span>
            <div className="text-[17px] font-medium leading-snug">{titre}</div>
            <p className="max-w-[58ch] text-[14px] leading-relaxed text-ink-2">{fr(desc)}</p>
          </li>
        ))}
      </ol>
    </Apparition>
  );
}

/* ---------------- Pour qui / pas pour qui ---------------- */

const POUR = [
  "Vous vendez un service à forte valeur, où une recommandation pèse lourd.",
  "Vos prospects se renseignent avant de vous appeler.",
  "Vous avez un site que l’on peut modifier et publier dessus.",
  "Vous acceptez une mesure honnête, y compris quand elle est mauvaise.",
];

const PAS_POUR = [
  "Vous cherchez une garantie de position chiffrée sous 30 jours.",
  "Vous voulez du volume de contenu plutôt que des réponses utiles.",
  "Votre marché ne se cherche pas, il se démarche exclusivement.",
  "Vous ne pouvez rien publier ni modifier sur votre site.",
];

function PourQui() {
  return (
    <Apparition as="section" className="mt-32 border-t border-rule pt-10">
      <h2 className="text-[34px] leading-none sm:text-[46px]">À qui cela s’adresse</h2>
      <div className="mt-10 grid gap-10 lg:grid-cols-2 lg:gap-20">
        <div>
          <Label className="pb-4">le sprint a du sens si</Label>
          <ul className="grid gap-4">
            {POUR.map((t) => (
              <li key={t} className="flex gap-4 border-b border-rule pb-4 text-[15px] leading-relaxed">
                <span className="mt-2 h-px w-6 shrink-0 bg-bordeaux" aria-hidden />
                <span>{fr(t)}</span>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <Label className="pb-4">nous vous le déconseillons si</Label>
          <ul className="grid gap-4">
            {PAS_POUR.map((t) => (
              <li
                key={t}
                className="flex gap-4 border-b border-rule pb-4 text-[15px] leading-relaxed text-ink-3"
              >
                <span className="mt-2 h-px w-6 shrink-0 bg-rule-strong" aria-hidden />
                <span>{fr(t)}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </Apparition>
  );
}

function PiedDePage() {

  return (
    <footer className="mt-28 border-t border-rule py-10">
      <div className="flex flex-wrap items-baseline justify-between gap-x-8 gap-y-6">
        <Logo hauteur={22} />
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

