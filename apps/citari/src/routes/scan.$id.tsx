import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useRef, useState } from "react";

import { EcranAttente } from "@/components/jeremie/EcranAttente";
import { LogoMoteur } from "@/components/jeremie/LogosMoteurs";
import { chargerTeaser, debloquerRapport, suivreScan } from "@/lib/scan.functions";
import type { EtatScan } from "@/lib/orchestrateur.server";
import { MOTEURS, fr, verdict } from "@/lib/typo";

/**
 * L'écran de scan.
 *
 * Maquette portée du projet Lovable de Jérémie le 08/08/2026 ; la mesure, elle,
 * est pilotée par NOTRE orchestrateur, sans rien changer à la boucle de
 * sondage — c'est elle qui a coûté le plus cher à mettre au point.
 *
 * Deux temps : l'attente (carte perforée qui se remplit), puis l'aguiche —
 * score révélé, moteurs, part de voix, et la phrase d'IA gardée derrière
 * l'email. Le rapport complet vit sur `/rapport/$jeton`.
 */

export const Route = createFileRoute("/scan/$id")({
  head: () => ({
    meta: [
      { title: "Mesure en cours — Citari" },
      {
        name: "description",
        // Volontairement sans chiffres : le nombre de questions et la liste des
        // moteurs dépendent du mode, et cette balise est statique.
        content: "Interrogation des moteurs d’IA sur des questions d’intention d’achat.",
      },
      { name: "robots", content: "noindex" },
      { property: "og:title", content: "Mesure en cours — Citari" },
      {
        property: "og:description",
        content: "Votre score de visibilité IA est en cours de calcul.",
      },
    ],
  }),
  component: Attente,
});

function Attente() {
  const { id } = Route.useParams();
  const avancer = useServerFn(suivreScan);
  const [etat, setEtat] = useState<EtatScan | null>(null);
  const [abandon, setAbandon] = useState(false);
  const echecs = useRef(0);

  useEffect(() => {
    // `actif` est une variable LOCALE à cette exécution de l'effet, et surtout
    // pas un `useRef` partagé. C'est ce partage qui doublait la facture.
    //
    // Le scénario : l'effet se relance (identité de `avancer` changée), son
    // nettoyage passe le drapeau partagé à false, puis la nouvelle exécution le
    // remet aussitôt à true. La requête encore en vol de l'ANCIENNE boucle
    // reprend alors la main, lit un drapeau redevenu true, se croit vivante et
    // replanifie son propre minuteur — inscrit dans une fermeture dont le
    // nettoyage est déjà passé, donc plus annulable par personne. Deux boucles
    // sondaient dès lors le même scan en parallèle.
    //
    // Mesuré, pas supposé : 80 appels de moteur facturés pour 40 réponses
    // conservées, exactement le double, sur un scan aperçu ordinaire.
    // Avec une variable locale, chaque boucle possède son propre drapeau et
    // meurt pour de bon quand son nettoyage passe.
    let actif = true;
    let timer: ReturnType<typeof setTimeout>;

    const boucle = async () => {
      try {
        const res = (await avancer({ data: { id } })) as EtatScan | null;
        echecs.current = 0;
        if (!actif) return;
        setEtat(res);
        if (res && (res.status === "done" || res.status === "error")) return;
      } catch {
        echecs.current += 1;
        // On tolère plusieurs erreurs réseau consécutives avant d'abandonner.
        if (echecs.current >= 8) {
          if (actif) setAbandon(true);
          return;
        }
      }
      if (!actif) return;
      timer = setTimeout(boucle, 1500);
    };

    void boucle();
    return () => {
      actif = false;
      clearTimeout(timer);
    };
  }, [avancer, id]);

  if (etat?.status === "done") return <Aguiche id={id} jeton={etat.reportToken} />;

  if (abandon || etat?.status === "error") {
    return (
      <Interruption
        message={
          etat?.error ??
          "La connexion au serveur a été perdue. Reprenez la mesure : elle repart là où elle s’est arrêtée, et rien ne vous est facturé."
        }
      />
    );
  }

  if (!etat) {
    return (
      <section>
        <div className="mx-auto max-w-5xl px-5 py-24 sm:px-8 sm:py-32">
          <p className="mono text-[12px] tracking-[0.12em] text-ink-2">
            OUVERTURE DU DOSSIER
            <span className="anim-blink ml-2 inline-block align-middle">▮</span>
          </p>
        </div>
      </section>
    );
  }

  return <EcranAttente etat={etat} instable={echecs.current > 0} />;
}

function Interruption({ message }: { message: string }) {
  return (
    <section>
      <div className="mx-auto max-w-5xl px-5 py-24 sm:px-8 sm:py-32">
        <p className="mono text-[12px] tracking-[0.12em]" style={{ color: "var(--signal)" }}>
          MESURE INTERROMPUE
        </p>
        <h1 className="measure mt-5 text-[26px] sm:text-[34px]">
          La mesure s’est arrêtée avant la fin.
        </h1>
        <p className="measure mt-6 text-ink-2">{message}</p>
        <div className="mt-8 flex flex-wrap items-center gap-6">
          <button type="button" className="cta" onClick={() => window.location.reload()}>
            Reprendre la mesure
          </button>
          <Link to="/" className="link-underline text-ink">
            Retour à l’accueil
          </Link>
        </div>
      </div>
    </section>
  );
}

/* ─────────────────────────────── l'aguiche ─────────────────────────────── */

type Teaser = NonNullable<Awaited<ReturnType<typeof chargerTeaser>>>;

function Aguiche({ id, jeton }: { id: string; jeton: string }) {
  const charger = useServerFn(chargerTeaser);
  const [data, setData] = useState<Teaser | null>(null);

  useEffect(() => {
    void charger({ data: { id } }).then((r) => setData(r as Teaser | null));
  }, [charger, id]);

  if (!data) {
    return (
      <section>
        <div className="mx-auto max-w-5xl px-5 py-24 sm:px-8 sm:py-32">
          <p className="mono text-[12px] tracking-[0.12em] text-ink-2">
            RÉVÉLATION DU SCORE
            <span className="anim-blink ml-2 inline-block align-middle">▮</span>
          </p>
        </div>
      </section>
    );
  }

  return (
    <>
      <Verdict data={data} />
      <ParMoteur data={data} />
      <PartDeVoix data={data} />
      {/* L'email est demandé AVANT le lancement, à la quatrième étape du
          formulaire : dans le parcours normal il est déjà enregistré ici, et
          la phrase se lit en clair. Le verrou ne sert que de garde-fou pour un
          scan créé sans lead — il ne doit pas devenir un second péage. */}
      {data.emailCapture ? <Phrase data={data} jeton={jeton} /> : <Verrou id={id} data={data} />}
    </>
  );
}

/** Le seul moment chorégraphié de l'écran : la révélation du chiffre. */
function Verdict({ data }: { data: Teaser }) {
  const affiche = useCompteur(data.score);
  const enTete = data.score >= 70;

  return (
    <section>
      <div className="mx-auto max-w-5xl px-5 pb-14 pt-14 sm:px-8 sm:pb-20 sm:pt-20">
        <p className="mono text-[13px] uppercase tracking-[0.08em] text-ink-2">{data.marque}</p>
        <div className="mt-6 flex flex-wrap items-end gap-x-6 gap-y-2">
          <p
            className="mono text-[88px] leading-[0.9] sm:text-[136px]"
            style={{ color: enTete ? "var(--ink)" : "var(--signal)" }}
            aria-label={`Score ${data.score} sur 100`}
          >
            {affiche}
            <span className="text-[28px] text-ink-2 sm:text-[36px]">/100</span>
          </p>
          <p className="text-[26px] sm:text-[34px]">{verdict(data.score)}</p>
        </div>
        <p className="measure mt-6 text-ink-2">
          {fr(
            `${data.comptage.citationsCible} citations de votre marque sur ${data.comptage.reponses} réponses réellement obtenues, pour ${data.comptage.questions} questions posées.`,
          )}
        </p>
        {data.comptage.questionsPerdues > 0 ? (
          <p className="mono mt-3 text-[13px] text-ink-2">
            {data.comptage.questionsPerdues} question
            {data.comptage.questionsPerdues > 1 ? "s" : ""} où votre marque n’apparaît sur aucun
            moteur.
          </p>
        ) : null}
      </div>
    </section>
  );
}

function ParMoteur({ data }: { data: Teaser }) {
  const interroges = MOTEURS.filter((m) => data.parMoteur[m] !== null);
  if (interroges.length === 0) return null;

  return (
    <section className="border-t border-rule">
      <div className="mx-auto max-w-5xl px-5 py-16 sm:px-8 sm:py-20">
        <h2 className="text-[26px] sm:text-[34px]">Moteur par moteur</h2>
        <ul className="mt-8 divide-y divide-[var(--rule)] border-y border-rule">
          {interroges.map((moteur) => {
            const note = Math.round(Number(data.parMoteur[moteur] ?? 0));
            const zero = note === 0;
            return (
              <li key={moteur} className="flex items-baseline justify-between gap-4 py-4">
                <span
                  className="flex items-center gap-2.5"
                  style={zero ? { color: "var(--signal)" } : undefined}
                >
                  <LogoMoteur nom={moteur} size={17} />
                  {moteur}
                </span>
                <span className="mono" style={zero ? { color: "var(--signal)" } : undefined}>
                  {note} / 100
                </span>
              </li>
            );
          })}
        </ul>
        {data.mode === "apercu" ? (
          <p className="mono mt-4 text-[12px] tracking-[0.10em] text-ink-2">
            ▢ {MOTEURS.length - interroges.length} MOTEURS COUVERTS PAR LE DIAGNOSTIC COMPLET
          </p>
        ) : null}
      </div>
    </section>
  );
}

function PartDeVoix({ data }: { data: Teaser }) {
  // `share_of_voice` est un TABLEAU, tronqué aux dix premiers plus la ligne du
  // client, qui y est garantie. Ne jamais recompter les citations dessus.
  const lignes = data.pdv.filter((p) => typeof p.share === "number");
  if (lignes.length === 0) return null;
  const max = Math.max(...lignes.map((p) => p.share));

  return (
    <section className="border-t border-rule">
      <div className="mx-auto max-w-5xl px-5 py-16 sm:px-8 sm:py-20">
        <h2 className="measure text-[26px] sm:text-[34px]">
          Qui capte la conversation sur vos questions.
        </h2>
        <ul className="mt-10 space-y-5">
          {lignes.map((ligne) => (
            <li key={ligne.name}>
              <div className="flex items-baseline justify-between gap-4">
                <span style={ligne.target ? { color: "var(--signal)" } : undefined}>
                  {ligne.name}
                  {ligne.classe === "geant" ? (
                    <span className="mono ml-2 text-[12px] text-ink-2">hors catégorie</span>
                  ) : null}
                </span>
                <span
                  className="mono text-[14px]"
                  style={{ color: ligne.target ? "var(--signal)" : "var(--ink-2)" }}
                >
                  {Math.round(ligne.share * 100)} %
                </span>
              </div>
              <div className="mt-2 h-3 w-full border border-rule bg-paper-2">
                <div
                  className="h-full"
                  style={{
                    width: `${Math.max(2, (ligne.share / max) * 100)}%`,
                    backgroundColor: ligne.target ? "var(--signal)" : "var(--ink-2)",
                  }}
                />
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

/**
 * La phrase, en clair, puis le passage au rapport complet.
 *
 * C'est la pièce qui fait comprendre le problème en une lecture : une IA
 * recommande un concurrent nommé sur une question où le client n'apparaît
 * pas. On la montre telle qu'elle a été écrite, sans retouche.
 */
function Phrase({ data, jeton }: { data: Teaser; jeton: string }) {
  const v = data.verbatim && !("verrouille" in data.verbatim) ? data.verbatim : null;

  return (
    <section className="border-t border-rule">
      <div className="mx-auto max-w-5xl px-5 py-16 sm:px-8 sm:py-20">
        <h2 className="measure text-[26px] sm:text-[34px]">
          Ce que les IA répondent à votre place.
        </h2>

        {v ? (
          <figure className="mt-10 border border-rule-strong bg-paper-2 p-6 sm:p-8">
            <p className="mono text-[12px] tracking-[0.10em] text-ink-2">
              QUESTION POSÉE · {v.moteur.toUpperCase()}
            </p>
            <p className="measure mt-2 text-[15px] text-ink-2">{fr(v.question)}</p>
            <blockquote className="quote-serif measure mt-6 text-[21px] leading-[1.45] sm:text-[24px]">
              « {v.texte} »
            </blockquote>
            <figcaption className="mono mt-5 text-[13px] text-ink-2">
              — {v.moteur}, qui recommande{" "}
              <span style={{ color: "var(--signal)" }}>{v.marque}</span> sur une question où
              votre marque n’apparaît pas.
            </figcaption>
          </figure>
        ) : (
          <p className="measure mt-8 text-ink-2">
            {fr(
              "Sur cet échantillon, aucune réponse ne recommande nommément un concurrent à votre place. Le diagnostic complet, sur six moteurs, va chercher plus loin.",
            )}
          </p>
        )}

        <div className="mt-12 border border-ink p-6 sm:p-10">
          <h3 className="measure text-[22px] sm:text-[28px]">Le rapport complet est prêt.</h3>
          <p className="measure mt-4 text-ink-2">
            {fr(
              "Le détail moteur par moteur, question par question, les concurrents classés relativement à vous, et vos actions prioritaires. Accessible par lien, sans compte.",
            )}
          </p>
          <p className="mt-8">
            <Link to="/rapport/$jeton" params={{ jeton }} className="cta">
              Ouvrir le rapport
            </Link>
          </p>
          {/* Pas de « vous l'avez aussi reçu par email » tant que l'envoi
              n'est pas branché : ce serait une promesse fausse sur la page
              même qui vend l'honnêteté de la mesure. */}
          <p className="mono mt-4 text-[13px] text-ink-2">
            Gardez ce lien : il ouvre votre rapport sans compte ni mot de passe.
          </p>
        </div>
      </div>
    </section>
  );
}

/**
 * Le verrou, cas de repli.
 *
 * Aucun texte de verbatim n'est envoyé au navigateur avant l'email : le
 * serveur ne le descend pas. Ce qui est flouté ici est un bloc vide, pas une
 * phrase qu'on lirait en deux clics dans les outils de développement.
 */
function Verrou({ id, data }: { id: string; data: Teaser }) {
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

  const verrouille = Boolean(data.verbatim && "verrouille" in data.verbatim);

  return (
    <section className="border-t border-rule">
      <div className="mx-auto max-w-5xl px-5 py-16 sm:px-8 sm:py-20">
        <h2 className="measure text-[26px] sm:text-[34px]">
          Ce que les IA répondent à votre place.
        </h2>

        <div className="relative mt-10">
          <ul
            className="select-none space-y-8"
            style={{ filter: "blur(6px)", pointerEvents: "none" }}
            aria-hidden
          >
            {[0, 1].map((i) => (
              <li key={i} className="border border-rule-strong bg-paper-2 p-6 sm:p-8">
                <div className="space-y-3">
                  <span className="block h-4 w-full bg-rule" />
                  <span className="block h-4 w-[92%] bg-rule" />
                  <span className="block h-4 w-[64%] bg-rule" />
                </div>
                <span className="mt-5 block h-3 w-40 bg-rule" />
              </li>
            ))}
          </ul>

          <div className="absolute inset-0 flex items-start justify-center p-4">
            <form onSubmit={onSubmit} className="w-full max-w-xl border border-ink bg-paper p-6 sm:p-8">
              <p className="measure text-[20px] sm:text-[24px]">
                {verrouille && data.verbatim && "verrouille" in data.verbatim
                  ? fr(
                      `${data.verbatim.moteur} recommande ${data.verbatim.marque} sur une question où vous n’apparaissez pas. La phrase exacte, avec votre rapport complet.`,
                    )
                  : fr(
                      "Le rapport complet : le détail moteur par moteur, question par question, et vos actions prioritaires.",
                    )}
              </p>

              <div className="mt-6 grid gap-2 sm:grid-cols-[1fr_1.4fr]">
                <label htmlFor="prenom" className="sr-only">
                  Votre prénom
                </label>
                <input id="prenom" name="prenom" className="field" placeholder="Prénom" maxLength={80} />
                <label htmlFor="email" className="sr-only">
                  Votre email professionnel
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  inputMode="email"
                  autoComplete="email"
                  className="field"
                  placeholder="vous@votre-site.fr"
                  maxLength={200}
                  required
                />
              </div>

              <button type="submit" className="cta mt-3 w-full" disabled={envoi}>
                {envoi ? "Ouverture…" : "Ouvrir le rapport complet"}
              </button>

              {erreur ? (
                <p className="mono mt-3 text-[13px]" style={{ color: "var(--signal)" }}>
                  {erreur}
                </p>
              ) : null}

              <p className="mono mt-4 text-[13px] text-ink-2">
                {fr(
                  "Votre email sert à vous transmettre ce rapport et à vous proposer une restitution de 30 minutes. Aucune revente, aucun partage publicitaire.",
                )}{" "}
                <Link to="/confidentialite" className="link-underline text-ink">
                  Confidentialité
                </Link>
              </p>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
}

/** Révélation du score : compteur court, désactivé si l'utilisateur préfère l'immobilité. */
function useCompteur(cible: number) {
  const [v, setV] = useState(0);
  useEffect(() => {
    if (
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      setV(cible);
      return;
    }
    let frame = 0;
    const debut = performance.now();
    const duree = 900;
    const tick = (now: number) => {
      const t = Math.min(1, (now - debut) / duree);
      setV(Math.round(cible * (1 - Math.pow(1 - t, 3))));
      if (t < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [cible]);
  return v;
}
