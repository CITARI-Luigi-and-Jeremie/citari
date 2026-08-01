import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";

import { Apparition } from "@/components/apparition";
import { ChampTexte } from "@/components/fond";

import { LogoLien, Logo } from "@/components/logo";
import { Btn, Champ, Choix, Etiquette, Field, Label, Rule } from "@/components/kit";
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

              <Label>Votre visibilité dans ChatGPT, Claude, Gemini et Perplexity</Label>
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
        <Mesure />
        <Sprint />
        <Garanties />
        <PourQui />

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

const MOTEURS_DEMO = ["ChatGPT", "Claude", "Gemini", "Perplexity"] as const;
type MoteurDemo = (typeof MOTEURS_DEMO)[number];

function BlocPreuve() {
  const [metier, setMetier] = useState<Metier>(METIERS[0]);
  const [ville, setVille] = useState<string>(VILLES[0]);
  const [moteur, setMoteur] = useState<MoteurDemo>(MOTEURS_DEMO[0]);
  const ex = exemple(metier, ville);
  const decalage = MOTEURS_DEMO.indexOf(moteur) % ex.concurrents.length;
  const classement = ex.concurrents.map((_, i) => ex.concurrents[(i + decalage) % ex.concurrents.length]);

  return (
    <div>
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
          {fr("Exemple illustratif : les noms sont fictifs. Votre scan interroge ChatGPT, Claude, Gemini et Perplexity avec vos vrais concurrents.")}
        </p>
      </div>
    </div>
    <p className="mt-7 max-w-[34ch] font-display text-[24px] font-light leading-[1.2]">
      Une IA ne donne pas dix liens. Elle donne trois noms.
    </p>
    </div>
  );

}


/* ---------------- Aperçu du rapport ---------------- */

const ENGINES_SCAN = ["ChatGPT", "Claude", "Gemini", "Perplexity"];

function ApercuRapport() {
  return (
    <div className="grid gap-5 sm:grid-cols-2">
      <div className="carte bg-paper-2/50 p-5">
        <Label>ce que vous obtiendrez</Label>
        <ul className="mt-4 grid gap-3 text-[14px] leading-snug text-ink-2">
          <li className="flex gap-3">
            <span className="mt-0.5 h-1.5 w-1.5 rounded-full bg-bordeaux" />
            <span>{fr("Un score de visibilité de 0 à 100 sur les 4 moteurs.")}</span>
          </li>
          <li className="flex gap-3">
            <span className="mt-0.5 h-1.5 w-1.5 rounded-full bg-bordeaux" />
            <span>{fr("Le classement de vos concurrents question par question.")}</span>
          </li>
          <li className="flex gap-3">
            <span className="mt-0.5 h-1.5 w-1.5 rounded-full bg-bordeaux" />
            <span>{fr("Les phrases exactes citées par l’IA à votre sujet.")}</span>
          </li>
        </ul>
      </div>
      <div className="carte bg-paper-2/50 p-5">
        <Label>moteurs interrogés</Label>
        <div className="mt-4 flex flex-wrap gap-2">
          {ENGINES_SCAN.map((m) => (
            <span
              key={m}
              className="inline-flex rounded-full border border-rule-strong bg-paper px-3 py-1 text-[12px] font-medium text-ink-2"
            >
              {m}
            </span>
          ))}
        </div>
        <div className="mt-4 border-t border-rule pt-4">
          <div className="flex items-start gap-3">
            <span className="font-display text-[42px] font-light leading-[0.9] text-ink-3">24</span>
            <span className="max-w-[18ch] pt-2 text-[13px] leading-snug text-ink-3">
              {fr("questions d’intention d’achat, générées à partir de votre secteur.")}
            </span>
          </div>
        </div>
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
            {fr("Votre score de visibilité dans ChatGPT, Claude, Gemini et Perplexity.")}
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

/* ---------------- 1. La mesure ---------------- */

const FORMULE: [string, string][] = [
  ["taux de mention", "50 %"],
  ["position moyenne", "20 %"],
  ["recommandation explicite", "20 %"],
  ["sentiment", "10 %"],
];

const ETAPES: [string, string][] = [
  [
    "Vingt-quatre questions écrites pour votre marché",
    "Générées à partir de votre secteur et de votre ville : dix comparatives, six sur un problème à résoudre, cinq locales, trois sur la confiance. Ce sont des questions d’acheteur, pas des mots-clés.",
  ],
  [
    "Quatre moteurs interrogés en direct",
    "ChatGPT, Claude, Gemini et Perplexity répondent à chacune des vingt-quatre questions, par les API officielles des éditeurs. Quatre-vingt-seize réponses réelles, collectées pendant votre scan. Jamais de capture d’écran, jamais de scraping.",
  ],
  [
    "Chaque réponse est décortiquée",
    "Quelles marques sont nommées, dans quel ordre, laquelle est explicitement recommandée, sur quel ton. Et la phrase exacte, mot pour mot, où cela se joue.",
  ],
  [
    "Un score, et tout ce qu’il y a derrière",
    "Sur cent points : présence dans la réponse 50, rang 20, recommandation explicite 20, tonalité 10. La formule est publiée parce que vous devez pouvoir la recalculer, et la contester.",
  ],
  [
    "Les questions sont scellées",
    "Elles sont enregistrées telles quelles, le premier jour. À J+90 nous rejouons exactement les mêmes, sur les mêmes moteurs, avec la même formule. Nous ne pouvons pas choisir nos questions après coup : c’est ce qui rend le avant/après incontestable.",
  ],
];

function Mesure() {
  return (
    <Apparition as="section" className="mt-40 border-t border-rule pt-10 sm:mt-52">
      <Label className="pb-6">la mesure</Label>
      <h2 className="max-w-[15ch] text-balance text-[38px] leading-[1.02] sm:text-[62px]">
        {frTitre("Nous ne prononçons jamais votre nom.")}
      </h2>
      <p className="mt-10 max-w-[62ch] text-[16px] leading-relaxed text-ink-2">
        {fr(
          "C’est la seule façon d’obtenir une mesure honnête. Si nous demandions à ChatGPT ce qu’il pense de votre entreprise, il en dirait du bien — nous lui aurions soufflé la réponse. Nous posons donc les questions que vos acheteurs posent réellement, sans jamais citer votre marque, et nous regardons si elle apparaît d’elle-même.",
        )}
      </p>

      <ol className="mt-20 border-t border-rule">
        {ETAPES.map(([titre, texte], i) => (
          <li
            key={titre}
            className="grid gap-4 border-b border-rule py-10 md:grid-cols-[minmax(0,26ch)_1fr] md:gap-16"
          >
            <div className="flex items-baseline gap-4">
              <span className="num text-[11px] tracking-[0.14em] text-bordeaux">
                {String(i + 1).padStart(2, "0")}
              </span>
              <h3 className="max-w-[22ch] font-display text-[24px] font-light leading-[1.15]">
                {frTitre(titre)}
              </h3>
            </div>
            <div>
              <p className="max-w-[62ch] text-[15px] leading-relaxed text-ink-2">{fr(texte)}</p>
              {i === 3 ? (
                <dl className="mt-8 max-w-[46ch] border-t border-rule">
                  {FORMULE.map(([k, v]) => (
                    <div
                      key={k}
                      className="flex items-baseline justify-between gap-6 border-b border-rule py-3.5"
                    >
                      <dt className="text-[14px] text-ink-2">{k}</dt>
                      <dd className="font-display text-[26px] font-light leading-none">
                        {v.replace(" ", NBSP)}
                      </dd>
                    </div>
                  ))}
                </dl>
              ) : null}
            </div>
          </li>
        ))}
      </ol>
    </Apparition>
  );
}


/* ---------------- 2. Le Sprint GEO ---------------- */

const CHANTIERS: [string, string, string, string][] = [
  [
    "Elle ne peut pas vous lire",
    "Technique",
    "La plupart des sites bloquent les robots d’IA sans le savoir : un réglage par défaut du CMS, hérité de 2023. Nous ouvrons l’accès à GPTBot, ClaudeBot et PerplexityBot, nous publions un fichier llms.txt, nous balisons vos pages clés en schema.org et nous réécrivons vos pages principales au format réponse directe — celui que les modèles savent citer.",
    "Le rapport d’audit, les fichiers prêts à poser, et un cahier de spécifications si c’est votre agence qui publie.",
  ],
  [
    "Elle n’a rien à citer de vous",
    "Contenu",
    "Une IA ne cite pas une plaquette. Elle cite une page qui répond à une question précise avec des faits vérifiables. Nous partons des questions de votre scan où vous êtes absent, et nous écrivons les pages qui manquent : comparatifs, alternatives, FAQ métier, guides d’achat.",
    "Cinq contenus rédigés, en Markdown et en HTML, balisage intégré, prêts à publier. Sujets validés avec vous avant rédaction.",
  ],
  [
    "Personne d’autre ne parle de vous",
    "Citations",
    "Les moteurs s’appuient sur des sources tierces qu’ils consultent en direct. Nous identifions celles sur lesquelles ils s’appuient pour recommander vos concurrents, et nous vous y installons.",
    "Huit cibles traitées — inscriptions faites, pitchs presse rédigés et envoyés, relances assurées, statut de chacune suivi.",
  ],
];

const REPERES: [string, string][] = [
  ["J1", "cadrage"],
  ["J7", "correctifs posés"],
  ["J14", "premiers contenus"],
  ["J30", "rapport"],
  ["J+90", "re-scan offert"],
];

function Sprint() {
  return (
    <Apparition as="section" className="mt-40 border-t border-rule pt-10">
      <Label className="pb-6">ce que nous faisons</Label>
      <h2 className="max-w-[17ch] text-balance text-[38px] leading-[1.02] sm:text-[62px]">
        {frTitre("Le Sprint GEO — trente jours, trois chantiers.")}
      </h2>
      <p className="mt-10 max-w-[62ch] text-[16px] leading-relaxed text-ink-2">
        {fr(
          "Une IA ne vous cite pas pour trois raisons possibles : elle ne peut pas vous lire, elle n’a rien à citer de vous, ou personne d’autre ne parle de vous. Nous traitons les trois.",
        )}
      </p>

      <div className="mt-16 grid gap-y-14 border-t border-rule sm:grid-cols-3 sm:gap-x-12 lg:gap-x-16">
        {CHANTIERS.map(([cause, technique, texte, livrable], i) => (
          <div
            key={cause}
            className={`pt-8 ${i > 0 ? "sm:border-l sm:border-rule sm:pl-12 lg:pl-16" : ""}`}
          >
            <span className="num text-[11px] tracking-[0.14em] text-bordeaux">
              {String(i + 1).padStart(2, "0")}
            </span>
            <h3 className="mt-3 max-w-[18ch] font-display text-[26px] font-light leading-[1.12]">
              {cause}
            </h3>
            <div className="label-xs mt-3 text-ink-3">{technique}</div>
            <p className="mt-5 max-w-[42ch] text-[14px] leading-relaxed text-ink-2">{fr(texte)}</p>
            <div className="mt-6 border-t border-rule pt-4">
              <div className="label-xs pb-2">vous recevez</div>
              <p className="max-w-[42ch] text-[14px] leading-relaxed">{fr(livrable)}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-20 border-t border-rule pt-8">
        <Label className="pb-5">déroulé du sprint</Label>
        <ol className="grid border-t border-rule sm:grid-flow-col sm:auto-cols-fr">
          {REPERES.map(([jour, quoi], i) => (
            <li
              key={jour}
              className={`border-b border-rule py-5 sm:border-b-0 sm:py-6 ${
                i > 0 ? "sm:border-l sm:border-rule sm:pl-6" : ""
              }`}
            >
              <div className="num text-[11px] tracking-[0.12em] text-ink-3">
                {jour.replace(/ /g, NBSP)}
              </div>
              <div className="mt-2 max-w-[16ch] text-[15px] leading-snug text-ink-2">{quoi}</div>
            </li>
          ))}
        </ol>
      </div>

      <div className="mt-20 grid gap-10 border-t border-rule pt-10 lg:grid-cols-[auto_minmax(0,44ch)] lg:gap-20">
        <div className="font-display text-[56px] font-light leading-none sm:text-[72px]">
          {euros(2900)} <span className="text-[24px] text-ink-3">HT</span>
        </div>
        <div>
          <p className="text-[17px] leading-relaxed">
            {fr(
              "Paiement unique. 50 % à la commande, 50 % à la livraison. Aucun abonnement, aucune reconduction. Re-scan à J+90 inclus.",
            )}
          </p>
          <p className="mt-6 text-[17px] leading-relaxed">
            Trois sprints par mois, pas davantage. Un seul client par secteur et par zone.
          </p>
          <p className="mt-8 text-[13px] leading-relaxed text-ink-3">
            {fr(
              "Option Sprint Domination : 4 900 € HT — dix contenus, seize cibles de citation, deux langues.",
            )}
          </p>
        </div>
      </div>
    </Apparition>
  );
}


/* ---------------- 3. Garanties ---------------- */

const NOUS_GARANTISSONS = [
  "L’exécution intégrale des trois chantiers, documentée action par action dans le rapport de fin de mission.",
  "Une mesure identique avant et après : mêmes questions, mêmes moteurs, même formule. Le re-scan à J+90 est inclus, que le résultat nous arrange ou non.",
  "Un interlocuteur unique : celui qui exécute.",
];

const NOUS_NE_GARANTISSONS_PAS = [
  "Un score précis à une date précise. Les moteurs intègrent les changements en quatre à douze semaines, et personne ne contrôle ce délai.",
  "Une position. « Premier dans ChatGPT » n’existe pas : il n’y a pas de classement, seulement une réponse rédigée qui varie d’une fois sur l’autre.",
  "Un effet immédiat. Ce travail se cumule dans le temps — c’est précisément pour cela que les places se prennent maintenant.",
];

function Garanties() {
  return (
    <Apparition as="section" className="mt-40 border-t border-rule pt-10">
      <h2 className="max-w-[17ch] text-balance text-[38px] leading-[1.02] sm:text-[62px]">
        {frTitre("Nos engagements, et leurs limites.")}
      </h2>
      <div className="mt-16 grid gap-12 border-t border-rule pt-8 lg:grid-cols-2 lg:gap-20">
        <div>
          <Label className="pb-5">nous garantissons</Label>
          <ul className="grid">
            {NOUS_GARANTISSONS.map((t) => (
              <li
                key={t}
                className="max-w-[54ch] border-b border-rule py-5 text-[15px] leading-relaxed"
              >
                {fr(t)}
              </li>
            ))}
          </ul>
        </div>
        <div>
          <Label className="pb-5">nous ne garantissons pas</Label>
          <ul className="grid">
            {NOUS_NE_GARANTISSONS_PAS.map((t) => (
              <li
                key={t}
                className="max-w-[54ch] border-b border-rule py-5 text-[15px] leading-relaxed text-ink-3"
              >
                {fr(t)}
              </li>
            ))}
          </ul>
        </div>
      </div>
      <p className="mx-auto mt-32 mb-16 max-w-[24ch] text-balance text-center font-display text-[30px] font-light leading-[1.18] sm:text-[42px]">
        {frTitre(
          "Si votre score est bon, nous vous le dirons et nous ne vous vendrons rien.",
        )}
      </p>
    </Apparition>
  );
}



/* ---------------- FAQ ---------------- */

function Faq() {
  return (
    <Apparition as="section" className="mt-40 border-t border-rule pt-10">
      <h2 className="text-[34px] leading-none sm:text-[52px]">Questions fréquentes</h2>
      <dl className="mt-12 border-t border-rule">
        {FAQ.map((f) => (
          <div
            key={f.q}
            className="grid gap-3 border-b border-rule py-7 md:grid-cols-[minmax(0,30ch)_1fr] md:gap-16"
          >
            <dt className="max-w-[30ch] text-[17px] font-medium leading-snug">{f.q}</dt>
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
      className="mt-40 grid items-end gap-8 border-t border-rule pt-10 lg:grid-cols-[1fr_auto] lg:gap-16"
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

/* ---------------- 4. À qui cela s’adresse ---------------- */

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
    <Apparition as="section" className="mt-40 border-t border-rule pt-10">
      <h2 className="text-[34px] leading-none sm:text-[52px]">À qui cela s’adresse</h2>
      <div className="mt-14 grid gap-12 border-t border-rule pt-8 lg:grid-cols-2 lg:gap-20">
        <div>
          <Label className="pb-5">le sprint a du sens si</Label>
          <ul className="grid">
            {POUR.map((t) => (
              <li
                key={t}
                className="max-w-[48ch] border-b border-rule py-4 text-[15px] leading-relaxed"
              >
                {fr(t)}
              </li>
            ))}
          </ul>
        </div>
        <div>
          <Label className="pb-5">nous vous le déconseillons si</Label>
          <ul className="grid">
            {PAS_POUR.map((t) => (
              <li
                key={t}
                className="max-w-[48ch] border-b border-rule py-4 text-[15px] leading-relaxed text-ink-3"
              >
                {fr(t)}
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

