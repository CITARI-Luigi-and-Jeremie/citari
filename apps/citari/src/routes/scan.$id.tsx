import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useCallback, useEffect, useRef, useState } from "react";

import { EcranAttente } from "@/components/jeremie/EcranAttente";
import { lireScan, suivreScan } from "@/lib/scan.functions";
import type { EtatScan } from "@/lib/orchestrateur.server";

/**
 * L'écran de scan : l'attente, et rien d'autre.
 *
 * Maquette portée du projet Lovable de Jérémie le 08/08/2026 ; la mesure est
 * pilotée par NOTRE orchestrateur, sans rien changer à la boucle de sondage —
 * c'est elle qui a coûté le plus cher à mettre au point.
 *
 * Cette page portait aussi une aguiche : score révélé, moteurs, part de voix,
 * verbatim, puis un bouton vers le rapport. Elle a été retirée le 09/08/2026.
 *
 * Sa raison d'être avait disparu sans qu'on s'en aperçoive. Elle servait de
 * péage à l'email ; l'adresse est désormais demandée à la quatrième étape du
 * formulaire, AVANT le lancement. Ne restait qu'un écran qui montrait le score,
 * la part de voix et le verbatim, puis un bouton vers un rapport qui rouvrait
 * sur… le score, la part de voix et le verbatim. Le prospect payait un clic
 * pour relire ce qu'il venait de lire, et le choc du chiffre était dépensé deux
 * fois. Pire, les deux écrans comptaient sur des dénominateurs différents.
 *
 * La mesure finie, on va donc directement au rapport, qui est aussi la seule
 * adresse partageable et rejouable.
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
  const navigate = useNavigate();
  const avancer = useServerFn(suivreScan);
  const lire = useServerFn(lireScan);
  const [etat, setEtat] = useState<EtatScan | null>(null);
  const [abandon, setAbandon] = useState(false);
  const echecs = useRef(0);

  // `useServerFn` rend une identité NOUVELLE à chaque rendu, et la boucle de
  // lecture provoque un rendu par seconde. Si les effets dépendaient de ces
  // identités, le pilotage se démonterait et se relancerait chaque seconde —
  // un `avancerScan` de plus en vol à chaque battement, exactement la
  // facturée-double documentée plus bas, en pire. Les refs ancrent les
  // fonctions ; les effets ne dépendent que de l'identifiant du scan.
  const avancerRef = useRef(avancer);
  avancerRef.current = avancer;
  const lireRef = useRef(lire);
  lireRef.current = lire;

  // Deux réponses en vol peuvent revenir dans le désordre : une lecture
  // partie tôt et arrivée tard ne doit jamais écraser un état plus frais.
  // L'avancement réel est monotone (des lignes s'ajoutent, un statut se
  // termine), on n'accepte donc qu'un état au moins aussi avancé.
  const appliquerEtat = useCallback((res: EtatScan | null) => {
    if (!res) return;
    setEtat((courant) => {
      if (!courant) return res;
      if (res.status === "done" || res.status === "error") return res;
      if (courant.status === "done" || courant.status === "error") return courant;
      if (res.collectees < courant.collectees) return courant;
      if (res.collectees === courant.collectees && res.questions.length < courant.questions.length)
        return courant;
      return res;
    });
  }, []);

  // BOUCLE DE PILOTAGE — fait avancer la machine, marche après marche.
  //
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
  useEffect(() => {
    let actif = true;
    let timer: ReturnType<typeof setTimeout>;

    const boucle = async () => {
      try {
        const res = (await avancerRef.current({ data: { id } })) as EtatScan | null;
        echecs.current = 0;
        if (!actif) return;
        appliquerEtat(res);
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
  }, [id, appliquerEtat]);

  // BOUCLE DE LECTURE — nourrit l'écran, sans rien faire avancer.
  //
  // La première marche du pilotage (génération des questions) bloque une
  // vingtaine de secondes : sans cette boucle-ci, la page restait vide tout
  // ce temps. Elle lit l'état à la seconde, pour trois SELECT, et s'arrête
  // d'elle-même quand le scan se termine. Une lecture qui échoue réessaie au
  // battement suivant, sans compter dans `echecs` : c'est le pilotage qui
  // décide d'un abandon, pas la lecture.
  useEffect(() => {
    let actif = true;
    let timer: ReturnType<typeof setTimeout>;

    const boucle = async () => {
      try {
        const res = (await lireRef.current({ data: { id } })) as EtatScan | null;
        if (!actif) return;
        appliquerEtat(res);
        if (res && (res.status === "done" || res.status === "error")) return;
      } catch {
        /* la prochaine lecture réessaie */
      }
      if (!actif) return;
      timer = setTimeout(boucle, 1000);
    };

    void boucle();
    return () => {
      actif = false;
      clearTimeout(timer);
    };
  }, [id, appliquerEtat]);

  // La mesure finie, l'écran reste affiché, scellé à 100 %, le temps que la
  // progression s'achève sous les yeux du prospect ; puis le rapport. La
  // navigation REMPLACE l'entrée d'historique : sans cela, le bouton
  // « retour » ramènerait sur un scan terminé qui redirigerait aussitôt, et
  // le prospect serait prisonnier de sa propre page de résultat.
  const jeton = etat?.status === "done" ? etat.reportToken : null;
  useEffect(() => {
    if (!jeton) return;
    const t = setTimeout(() => {
      void navigate({ to: "/rapport/$jeton", params: { jeton }, replace: true });
    }, 1700);
    return () => clearTimeout(t);
  }, [jeton, navigate]);

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

  // Avant le premier battement, l'écran s'affiche déjà en coquille : cadre,
  // étapes, flux en initialisation. Jamais une page vide.
  return <EcranAttente etat={etat} scelle={Boolean(jeton)} instable={echecs.current > 0} />;
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
