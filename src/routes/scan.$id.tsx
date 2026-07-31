import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useCallback, useEffect, useRef, useState } from "react";

import { Btn, Champ, Etiquette, Field, Label, LigneVide, Rule } from "@/components/kit";
import { PartDeVoix, ScoresMoteurs } from "@/components/rapport";
import { chargerTeaser, debloquerRapport, suivreScan } from "@/lib/scan.functions";
import { NBSP, fr, verdict } from "@/lib/typo";

export const Route = createFileRoute("/scan/$id")({
  head: () => ({
    meta: [
      { title: "Mesure en cours — Citari" },
      {
        name: "description",
        content:
          "Interrogation de ChatGPT, Claude, Gemini et Perplexity sur 24 questions d’intention d’achat.",
      },
      { name: "robots", content: "noindex" },
      { property: "og:title", content: "Mesure en cours — Citari" },
      { property: "og:description", content: "Votre score de visibilité IA est en cours de calcul." },
    ],
  }),
  component: Attente,
});

const PHASES = [
  ["init", "Initialisation"],
  ["questions", "Génération des questions"],
  ["interrogation", "Interrogation des moteurs"],
  ["analyse", "Analyse"],
] as const;

type Etat = {
  status: string;
  phase: string;
  error: string | null;
  brand: string;
  reportToken: string;
  questions: { rank: number; text: string; intent: string }[];
  collectees: number;
  total: number;
  progression: number;
} | null;

function Attente() {
  const { id } = Route.useParams();
  const avancer = useServerFn(suivreScan);
  const [etat, setEtat] = useState<Etat>(null);
  const [abandon, setAbandon] = useState(false);
  const echecs = useRef(0);
  const actif = useRef(true);

  useEffect(() => {
    actif.current = true;
    let timer: ReturnType<typeof setTimeout>;

    const boucle = async () => {
      try {
        const res = (await avancer({ data: { id } })) as Etat;
        echecs.current = 0;
        if (!actif.current) return;
        setEtat(res);
        if (res && (res.status === "done" || res.status === "error")) return;
      } catch {
        echecs.current += 1;
        // On tolère plusieurs erreurs réseau consécutives avant d'abandonner.
        if (echecs.current >= 8) {
          if (actif.current) setAbandon(true);
          return;
        }
      }
      timer = setTimeout(boucle, 1500);
    };

    void boucle();
    return () => {
      actif.current = false;
      clearTimeout(timer);
    };
  }, [avancer, id]);

  if (etat?.status === "done") return <Teaser id={id} />;

  return (
    <div className="mx-auto max-w-[1000px] px-6 py-16 lg:px-10">
      <Link to="/" className="label-xs">
        Citari
      </Link>

      <div className="mt-16 flex items-end justify-between gap-6 border-b border-rule pb-5">
        <div className="font-display text-[100px] font-light leading-[0.78] tracking-[-0.03em] sm:text-[156px]">
          {etat?.progression ?? 2}
          <span className="text-[40px] text-ink-3">{NBSP}%</span>
        </div>
        <div className="pb-3 text-right">
          <Label>réponses collectées</Label>
          <div className="num mt-1 text-[26px] leading-none">
            {etat?.collectees ?? 0}
            <span className="text-ink-3">/{etat?.total ?? 96}</span>
          </div>
        </div>
      </div>

      {/* Filet de progression pleine largeur */}
      <div className="h-[2px] w-full bg-paper-3">
        <div
          className="h-[2px] bg-bordeaux transition-[width] duration-500 ease-[cubic-bezier(0.2,0.7,0.2,1)]"
          style={{ width: `${etat?.progression ?? 2}%` }}
        />
      </div>


      <ol className="mt-10 grid gap-x-10 gap-y-3 sm:grid-cols-4">
        {PHASES.map(([clef, label], i) => {
          const idx = PHASES.findIndex((p) => p[0] === (etat?.phase ?? "init"));
          const etatPhase = i < idx ? "faite" : i === idx ? "encours" : "attente";
          return (
            <li key={clef} className="border-t border-rule-strong pt-2">
              <div className="num text-[10px] tracking-[0.16em] text-ink-3">
                {String(i + 1).padStart(2, "0")}
              </div>
              <div
                className={
                  etatPhase === "attente"
                    ? "text-[15px] text-ink-3"
                    : etatPhase === "encours"
                      ? "text-[15px] text-bordeaux"
                      : "text-[15px]"
                }
              >
                {label}
                {etatPhase === "encours" ? "…" : etatPhase === "faite" ? " ✓" : ""}
              </div>
            </li>
          );
        })}
      </ol>

      {abandon || etat?.status === "error" ? (
        <div className="mt-14 border-t border-bordeaux pt-4">
          <Etiquette ton="bordeaux">interruption</Etiquette>
          <p className="mt-3 max-w-[54ch] text-[15px] text-ink-2">
            {etat?.error ??
              "La connexion au serveur a été perdue. Rechargez cette page : la mesure reprend là où elle s’est arrêtée."}
          </p>
          <Btn className="mt-5" onClick={() => window.location.reload()}>
            Reprendre
          </Btn>
        </div>
      ) : null}

      <div className="mt-16">
        <Label className="pb-3">questions générées</Label>
        <Rule />
        {etat?.questions?.length ? (
          <ol>
            {etat.questions.map((q) => (
              <li key={q.rank} className="rise grid grid-cols-[32px_1fr] gap-4 border-b border-rule py-2.5">
                <span className="num pt-1 text-[10px] tracking-[0.14em] text-ink-3">
                  {String(q.rank).padStart(2, "0")}
                </span>
                <span className="text-[14px] leading-snug text-ink-2">{fr(q.text)}</span>
              </li>
            ))}
          </ol>
        ) : (
          <p className="py-3 text-[14px] text-ink-3">
            {fr("L’échantillon est en cours de génération…")}
          </p>
        )}
      </div>
    </div>
  );
}

/* ---------------- Teaser ---------------- */

function Teaser({ id }: { id: string }) {
  const charger = useServerFn(chargerTeaser);
  const [data, setData] = useState<Awaited<ReturnType<typeof chargerTeaser>>>(null);

  useEffect(() => {
    void charger({ data: { id } }).then(setData);
  }, [charger, id]);

  const affiche = useCompteur(data?.score ?? 0);

  if (!data) {
    return (
      <div className="mx-auto max-w-[1000px] px-6 py-24">
        <p className="num text-[13px] text-ink-3">Préparation du résultat…</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[1080px] px-6 py-16 lg:px-10">
      <Link to="/" className="label-xs">
        Citari
      </Link>

      <header className="mt-14 border-b border-rule pb-8">
        <Label>score de visibilité IA · {data.marque}</Label>
        <p className="mt-3 text-[15px] text-ink-2">
          Sur 24 questions posées par vos acheteurs potentiels
        </p>
        <div className="mt-5 flex flex-wrap items-end gap-x-14 gap-y-4">
          <div className="font-display text-[130px] font-light leading-[0.76] tracking-[-0.03em] sm:text-[196px]">
            {affiche}
          </div>
          <div className="pb-5">
            <div className="font-display text-[40px] font-light leading-none text-bordeaux">
              {verdict(data.score)}
            </div>
            <div className="num mt-3 text-[11px] tracking-[0.14em] text-ink-3">sur 100</div>
          </div>
        </div>
      </header>

      <section className="mt-10">
        <ScoresMoteurs scores={data.parMoteur} />
      </section>

      <section className="mt-16 grid gap-12 lg:grid-cols-[1fr_minmax(0,42ch)] lg:gap-20">
        <div>
          <h2 className="text-[30px] leading-none">Part de voix</h2>
          <div className="mt-5">
            <PartDeVoix items={data.pdv} />
          </div>
        </div>

        <div>
          <h2 className="text-[30px] leading-none">
            Voici ce que l’IA a répondu. Mot pour mot.
          </h2>
          {data.verbatim ? (
            <figure className="mt-5 border-t border-rule-strong pt-3">
              <p className="num text-[12px] text-ink-3">{fr(data.verbatim.question)}</p>
              <blockquote className="mt-3 font-display text-[24px] leading-[1.25]">
                « {data.verbatim.texte} »
              </blockquote>
              <figcaption className="num mt-3 text-[11px] text-ink-3">
                {data.verbatim.moteur} · cite {data.verbatim.marque}
              </figcaption>
              <LigneVide legende="et ne cite pas" className="mt-8" />
            </figure>
          ) : (
            <p className="mt-5 text-[14px] text-ink-3">
              Aucun extrait comparatif exploitable sur cet échantillon.
            </p>
          )}
        </div>
      </section>

      <Deblocage id={id} />
    </div>
  );
}

function Deblocage({ id }: { id: string }) {
  const navigate = useNavigate();
  const debloquer = useServerFn(debloquerRapport);
  const [envoi, setEnvoi] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErreur(null);
    setEnvoi(true);
    const f = new FormData(e.currentTarget);
    try {
      const res = await debloquer({
        data: {
          scanId: id,
          email: String(f.get("email") ?? ""),
          prenom: String(f.get("prenom") ?? ""),
        },
      });
      await navigate({ to: "/rapport/$jeton", params: { jeton: res.reportToken } });
    } catch {
      setErreur("Adresse invalide ou serveur indisponible.");
      setEnvoi(false);
    }
  }

  return (
    <section className="mt-20 grid gap-10 border-t border-rule-strong pt-8 lg:grid-cols-[minmax(0,40ch)_1fr] lg:gap-20">
      <div>
        <h2 className="text-[34px] leading-none">Le rapport complet, par email.</h2>
        <p className="mt-4 text-[15px] leading-relaxed text-ink-2">
          {fr(
            "Le détail moteur par moteur, question par question, les sources qui font gagner vos concurrents, et vos 10 actions prioritaires. Accessible par lien, sans compte.",
          )}
        </p>
      </div>
      <form onSubmit={onSubmit} className="max-w-[46ch]">
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Prénom">
            <Champ name="prenom" maxLength={80} />
          </Field>
          <Field label="Email professionnel">
            <Champ name="email" type="email" required maxLength={200} />
          </Field>
        </div>
        {erreur ? <p className="num mt-4 text-[12px] text-bordeaux">{erreur}</p> : null}
        <Btn type="submit" size="lg" className="mt-6 w-full" disabled={envoi}>
          {envoi ? "Ouverture…" : "Débloquer le rapport"}
        </Btn>
        <p className="mt-4 text-[12px] leading-snug text-ink-3">
          {fr(
            "Votre email sert à vous transmettre le rapport et à vous proposer un call de restitution de 30 minutes. Aucune revente, aucun partage publicitaire. Vous pouvez demander la suppression à tout moment.",
          )}{" "}
          <Link to="/confidentialite" className="ink-link">
            Politique de confidentialité
          </Link>
        </p>
      </form>
    </section>
  );
}

/** Révélation du score : un des deux seuls moments chorégraphiés du site. */
function useCompteur(cible: number) {
  const [v, setV] = useState(0);
  useEffect(() => {
    if (typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setV(cible);
      return;
    }
    let frame = 0;
    const total = 26;
    const t = setInterval(() => {
      frame += 1;
      setV(Math.round((cible * frame) / total));
      if (frame >= total) clearInterval(t);
    }, 24);
    return () => clearInterval(t);
  }, [cible]);
  return v;
}
