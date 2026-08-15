import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";

import { useScanFormFocus } from "@/lib/scan-form-focus";
import { Reveal } from "@/components/jeremie/Reveal";
import { ScrollFloat } from "@/components/jeremie/ScrollFloat";
import { Quadrillage } from "@/components/jeremie/Quadrillage";

/**
 * Les trois étapes du tunnel, sur fond sombre quadrillé.
 *
 * Version v3 de Jérémie, portée le 14/08/2026 : gros numéros d'étape,
 * libellés CE QUE VOUS RECEVEZ / CE QUE ÇA VOUS COÛTE, textes longs.
 *
 * Trois retouches de doctrine par rapport à sa copie, parce qu'il n'y a pas
 * encore de client ni de prospect réel :
 * - « La plupart de nos prospects découvrent... » affirmait un historique qui
 *   n'existe pas → reformulé au conditionnel, même rythme ;
 * - « C'est déjà arrivé, et ça arrivera encore » (dire qu'un score est bon
 *   sans rien vendre) → coupé, la promesse seule suffit ;
 * - « Dans trente jours, si » promettait qu'une IA aurait à DIRE : les moteurs
 *   intègrent en 4 à 12 semaines (notre propre page méthode). « À lire »
 *   est la version vraie : la matière existe bien à J+30.
 */

type Etape = {
  num: string;
  label?: string;
  titre: string;
  cout: string;
  labelCout?: string;
  /**
   * Le prix et la durée, séparés et remontés EN TÊTE de carte le
   * 15/08/2026. Le titre de la section promet « vous savez d'avance ce que
   * chacune coûte », et le coût était en bas, en 13px, après 120 à 190 mots :
   * la mise en page contredisait la promesse. Le repère « offert » distingue
   * d'un coup d'œil les deux étapes gratuites de celle qui se paie.
   */
  prix: string;
  offert: boolean;
  duree: string;
  labelObtenu?: string;
  /** Les points de « ce que vous recevez », en liste plutôt qu'en blocs. */
  recoit: ReactNode[];
  /** La phrase qui conclut l'étape, sous la liste. */
  chute: ReactNode;
  /**
   * La notice technique de l'étape, en bouton au pied de la carte
   * (15/08/2026). La section « Vérifiabilité » qui suivait les trois étapes
   * redisait ce que les cartes venaient de dire : c'était un doublon, et le
   * Sprint n'y figurait même pas. Chaque étape porte désormais SON document
   * — le détail vit sur les pages /methode et /sprint, jamais dans un
   * dépliant caché sous la carte (le contenu replié n'est pas lu, piège
   * déjà payé deux fois).
   */
  doc: { label: string; to: string; hash?: string };
  image: string;
  imageWidth: number;
  imageHeight: number;
  imageAspect: string;
  /**
   * Le blanc des BORDS de l'illustration, moyenné au pixel sur la bande
   * réellement visible (canvas, 15/08/2026). La colonne le reprend, sinon
   * le crème de l'image contre celui de la carte (#FBFAF7) fait une
   * frontière que l'œil accroche — Luigi l'a vue du premier coup. Les trois
   * fichiers n'ont pas le même blanc et leur fond a du grain : d'où une
   * valeur par étape, et un écart résiduel mesuré à 1,3/255 au pire.
   */
  imageFond: string;
  alt: string;
};

const ETAPES: Etape[] = [
  {
    num: "01",
    label: "LE SCAN",
    titre: "Vous voyez enfin ce qu'on répond à votre place",
    cout: "Votre adresse professionnelle. Ni carte bancaire, ni rendez-vous, ni engagement.",
    labelCout: "CE QUE ÇA VOUS COÛTE",
    prix: "Gratuit",
    offert: true,
    duree: "90 secondes",
    labelObtenu: "CE QUE VOUS RECEVEZ",
    // Réécrites deux fois le 15/08/2026. La première passe listait les
    // mécanismes ; verdict de Luigi : « ça ne donne pas envie, le scan est
    // beaucoup plus impressionnant que ça ». Celle-ci raconte ce que le
    // CLIENT vit — chaque phrase reste couverte par ce que l'orchestrateur
    // fait réellement.
    recoit: [
      <>
        <strong className="font-semibold text-ink">
          Vous regardez ChatGPT et Gemini répondre en direct
        </strong>{" "}
        aux questions que vos acheteurs posent en ce moment même. 40 réponses réelles, obtenues
        sous vos yeux par leurs API officielles.
      </>,
      <>
        En 90 secondes, vous savez{" "}
        <strong className="font-semibold text-ink">qui rafle les recommandations de votre
        marché</strong> : chaque nom cité est repéré, compté, classé, y compris ceux que vous
        n'attendiez pas.
      </>,
      <>
        Vous lisez <strong className="font-semibold text-ink">la phrase qu'un acheteur a reçue à
        votre place</strong>. Le nom que l'IA lui a soufflé, mot pour mot, daté.
      </>,
      <>
        Et pendant ce temps, votre site est testé robot par robot : GPTBot, ClaudeBot,
        PerplexityBot.{" "}
        <strong className="font-semibold text-ink">
          Beaucoup découvrent ici qu'ils leur ferment la porte.
        </strong>
      </>,
    ],
    chute: (
      <>
        Vous découvrirez peut-être un score que vous n'imaginiez pas.{" "}
        <strong className="font-semibold text-ink">Dans les deux sens.</strong>
      </>
    ),
    doc: { label: "La méthode de mesure, publiée en entier", to: "/methode" },
    // Dimensions relevées dans le fichier : les trois font 1408×768.
    image: "/img/etape-scan.png",
    imageWidth: 1408,
    imageHeight: 768,
    imageAspect: "aspect-[2/1]",
    imageFond: "#FBFAF3",
    alt: "Une loupe posée sur des lignes de texte, illustration abstraite du scan.",
  },
  {
    num: "02",
    label: "LE SCAN PREMIUM",
    titre: "Cette fois, les six moteurs répondent. Le plan qui en sort est à vous.",
    cout: "30 minutes en visio. Ni carte bancaire, ni engagement.",
    labelCout: "CE QUE ÇA VOUS COÛTE",
    prix: "Offert",
    offert: true,
    duree: "30 minutes",
    labelObtenu: "CE QUE VOUS RECEVEZ",
    recoit: [
      <>
        La mesure passe à l'échelle réelle :{" "}
        <strong className="font-semibold text-ink">
          144 réponses, six moteurs, recherche web activée
        </strong>
        . Exactement ce que vivent vos clients quand ils demandent.
      </>,
      <>
        Vous obtenez{" "}
        <strong className="font-semibold text-ink">
          les adresses que chaque moteur a ouvertes avant de recommander vos concurrents
        </strong>
        . Plus une théorie : la liste des pages qui décident, une par une.
      </>,
      <>
        Vous découvrez{" "}
        <strong className="font-semibold text-ink">la fiche que chaque IA récite sur vous</strong>,
        souvent périmée, parfois confondue avec un homonyme. Personne ne vous l'avait jamais
        montrée.
      </>,
      <>
        Vous repartez avec l'ordre exact des corrections : ce que votre développeur règle en une
        heure, et ce qui mérite un vrai chantier.
      </>,
      <>
        <strong className="font-semibold text-ink">
          Votre point de départ est scellé, rejouable à l'identique dans 90 jours
        </strong>{" "}
        : le progrès se mesurera, il ne se racontera pas.
      </>,
    ],
    // La phrase la plus forte du site reste ici, où le scepticisme est
    // maximal. Le contrôle du 14/08 l'avait relevée quatre fois à
    // l'identique dans le parcours : c'est désormais son seul emplacement
    // sur la landing.
    chute: (
      <strong className="font-semibold text-ink">
        Nous n'avons rien à vendre à une entreprise déjà bien citée : dans ce cas, on vous le dit et
        l'affaire s'arrête là.
      </strong>
    ),
    // Sa propre page depuis le 15/08/2026 : les cartes 01 et 02 renvoyaient
    // toutes deux vers /methode, ce que Luigi a relevé — deux étapes, deux
    // documents.
    doc: { label: "Le scan premium, déplié", to: "/scan-premium" },
    // Canevas élargi à 1900×1036 le 15/08/2026 (script PIL : le grain du
    // fichier lui-même, tuilé en miroir autour de l'original intact). Le
    // motif de cette illustration remplissait son cadre bien plus que ceux
    // des étapes 1 et 3, d'où un « trop zoomé » persistant quel que soit le
    // recadrage CSS. Le dézoom est désormais DANS le fichier.
    image: "/img/etape-citations.png",
    imageWidth: 1900,
    imageHeight: 1036,
    imageAspect: "aspect-[2/1]",
    imageFond: "#FAFAF2",
    alt: "Un guillemet au-dessus de quatre filets, dont un surligné en rouge.",
  },
  {
    num: "03",
    label: "LE SPRINT GEO",
    titre: "Aujourd'hui, une IA n'a presque rien à lire sur vous. Dans trente jours, si.",
    cout: "2 900 € HT, une fois. 50 % à la commande, 50 % à la livraison. Aucun abonnement, aucune reconduction.",
    prix: "2 900 € HT",
    offert: false,
    duree: "30 jours",
    labelObtenu: "CE QUE NOUS FAISONS",
    // Chaque chantier nomme ses mécanismes réels (robots.txt, llms.txt,
    // schema.org, IndexNow, logs serveur) : le jargon exact est ici un
    // argument de vente, et tout existe dans le toolkit.
    recoit: [
      <>
        <strong className="font-semibold text-ink">On ouvre votre site aux IA</strong> :
        robots.txt, llms.txt, balisage schema.org, fiche Wikidata. Puis on compte les robots
        entrer dans vos logs. Passer de zéro à des dizaines de visites par semaine, c'est une
        preuve, pas une impression.
      </>,
      <>
        <strong className="font-semibold text-ink">
          On écrit les 5 pages qui répondent aux questions où vous perdez
        </strong>
        , au format exact que les moteurs citent, et Bing les indexe en heures via IndexNow au
        lieu d'attendre des semaines.
      </>,
      <>
        <strong className="font-semibold text-ink">
          On installe votre nom sur les sources qui font gagner vos concurrents
        </strong>
        , celles que les moteurs ont réellement consultées pendant votre mesure. À la main,
        dossier par dossier, relance par relance.
      </>,
      <>
        Puis <strong className="font-semibold text-ink">60 jours de suivi que personne d'autre ne
        fait</strong> : relances, contrôle à J+45, consolidation. Les agences livrent au jour 30,
        quand rien n'a encore bougé. L'écart se creuse après.
      </>,
    ],
    chute: (
      <>
        À J+90, le même relevé qu'aujourd'hui, mot pour mot.{" "}
        <strong className="font-semibold text-ink">
          C'est la seule chose que nous garantissons, et la seule qui se vérifie.
        </strong>
      </>
    ),
    doc: { label: "Le programme des 90 jours, étape par étape", to: "/sprint" },
    labelCout: "CE QUE ÇA VOUS DEMANDE",
    image: "/img/etape-diagnostic.png",
    imageWidth: 1408,
    imageHeight: 768,
    imageAspect: "aspect-[2/1]",
    imageFond: "#FAFAF3",
    alt: "Un cadran de mesure avec une aiguille rouge, illustration du sprint de trente jours.",
  },
];

export function SectionProcedure() {
  const { focusAndScroll } = useScanFormFocus();

  return (
    // « parcours » et non « methode » depuis le 15/08/2026 : cette section
    // décrit le PARCOURS commercial (scan, scan premium, sprint), pas la
    // méthode de mesure. Elle occupait le mot « Méthode » dans la barre
    // latérale, et cannibalisait donc la page /methode — celle qui publie la
    // formule et le calcul complet, que Luigi n'a retrouvée qu'au fond du
    // pied de page. Un nom, une chose.
    <section id="parcours" className="relative scroll-mt-20 overflow-hidden bg-ink">
      <Quadrillage variante="sombre" />
      <div className="relative z-10 mx-auto max-w-5xl px-5 py-16 sm:px-8 sm:py-24">
        <Reveal>
          <p className="mono text-[12px] uppercase tracking-[0.12em] text-[color-mix(in_srgb,var(--paper)_55%,transparent)]">
            LE PARCOURS
          </p>
        </Reveal>

        <ScrollFloat
          className="mt-5 max-w-[600px] text-[34px] text-paper sm:text-[52px]"
          style={{
            fontWeight: 800,
            letterSpacing: "-0.04em",
            lineHeight: 1.05,
            textWrap: "pretty" as never,
          }}
        >
          Trois étapes. Vous savez d'avance ce que chacune coûte.
        </ScrollFloat>

        <Reveal>
          <p className="measure mt-5 text-[color-mix(in_srgb,var(--paper)_72%,transparent)]">
            Vous pouvez vous arrêter après n'importe laquelle. Chacune se suffit à elle-même,{" "}
            <strong className="font-semibold text-paper">
              et rien ne se déclenche sans que vous l'ayez décidé.
            </strong>
          </p>
        </Reveal>

        {/* Cartes empilées : chaque étape se superpose à la précédente au
            défilement. Compactées le 14/08/2026 (demande Luigi : « trop
            longues de haut en bas ») : rien du texte n'a bougé, mais corps un
            cran plus petit, interlignes et espacements resserrés, numéro
            réduit, et l'image passe à 2/5 de la largeur pour que le texte
            s'étale moins en hauteur. Une carte doit tenir sous un écran. */}
        <ul className="mt-10">
          {ETAPES.map((etape, i) => (
            <li
              key={etape.num}
              className="stack-card"
              style={{
                top: `calc(5rem + ${i * 1.25}rem)`,
                marginBottom: i === ETAPES.length - 1 ? 0 : "2rem",
                zIndex: i + 1,
              }}
            >
              <Reveal delay={i * 120} className="block">
                <div>
                  <div className="card-lift group grid gap-0 overflow-hidden border border-rule bg-paper shadow-[0_32px_70px_-36px_rgba(251,250,247,0.18)] hover:border-signal sm:grid-cols-[2fr_3fr]">
                    {/* La bordure et le fond vivent sur le CONTENEUR, pas sur
                        l'image : celle-ci est plafonnée en hauteur, et sans
                        conteneur le filet vertical s'arrêtait avec elle.

                        Pourquoi un plafond : les trois cartes n'ont pas la
                        même quantité de texte, donc pas la même hauteur (507,
                        664 et 524px). En `object-cover` pleine hauteur, la
                        carte 02 ne montrait que 31 % de son illustration
                        contre 41 % pour les autres — d'où le « trop zoomé »
                        de Luigi (15/08/2026). Un cadre commun rend le
                        recadrage identique partout. */}
                    <div
                      style={{ backgroundColor: etape.imageFond }}
                      className="flex items-center border-b border-rule sm:border-b-0 sm:border-r"
                    >
                      <img
                        src={etape.image}
                        alt={etape.alt}
                        loading="lazy"
                        width={etape.imageWidth}
                        height={etape.imageHeight}
                        className={`${etape.imageAspect} w-full object-cover sm:aspect-auto sm:h-full sm:max-h-[510px]`}
                      />
                    </div>

                    <div className="flex flex-col p-6 sm:p-7">
                      {/* Le bandeau de tête : numéro, nature de l'étape, et
                          surtout PRIX et durée, lisibles avant tout le reste.
                          La section promet qu'on sait d'avance ce que chacune
                          coûte : elle le tient maintenant à la première
                          seconde. */}
                      <div className="flex items-start justify-between gap-4 border-b border-rule pb-4">
                        <div className="flex flex-col">
                          <span className="mono text-[40px] font-bold leading-[0.85] tracking-tighter text-ink sm:text-[48px]">
                            {etape.num}
                          </span>
                          {etape.label ? (
                            <span className="mono mt-1 text-[11px] uppercase tracking-[0.12em] text-ink-2">
                              {etape.label}
                            </span>
                          ) : null}
                        </div>
                        <div className="flex flex-col items-end gap-1">
                          <span
                            className={`text-[20px] font-bold leading-none tracking-[-0.02em] sm:text-[23px] ${
                              etape.offert ? "text-signal" : "text-ink"
                            }`}
                          >
                            {etape.prix}
                          </span>
                          <span className="mono text-[12px] tabular-nums text-ink-2">
                            {etape.duree}
                          </span>
                        </div>
                      </div>

                      <h3 className="mt-4 text-[22px] leading-[1.15] text-ink sm:text-[25px]">
                        {etape.titre}
                      </h3>

                      <div className="mt-4">
                        <p className="mono text-[11px] uppercase tracking-[0.12em] text-ink-2">
                          {etape.labelObtenu ?? "vous obtenez"}
                        </p>
                        <ul className="mt-2.5 flex flex-col gap-2">
                          {etape.recoit.map((point, k) => (
                            <li key={k} className="flex items-start gap-2.5">
                              <span
                                aria-hidden
                                className="mono mt-[3px] flex-none text-[11px] text-signal"
                              >
                                →
                              </span>
                              <span className="flex-1 text-[14.5px] leading-[1.45] text-ink-2">
                                {point}
                              </span>
                            </li>
                          ))}
                        </ul>
                        <p className="mt-3 text-[14.5px] leading-[1.45] text-ink-2">{etape.chute}</p>
                      </div>

                      <dl className="mono mt-5 border-l-2 border-rule pl-4 text-[13.5px] tabular-nums sm:mt-auto sm:pt-5">
                        <dt className="text-[11px] uppercase tracking-[0.1em] text-ink-2">
                          {etape.labelCout ?? "coût"}
                        </dt>
                        <dd className="mt-1.5 leading-snug text-ink">{etape.cout}</dd>
                      </dl>

                      {/* La notice technique de l'étape : un bouton, pas un
                          lien discret — la leçon du test du père vaut ici
                          aussi. */}
                      <Link
                        to={etape.doc.to}
                        hash={etape.doc.hash}
                        className="group/doc mt-5 flex items-center justify-between gap-3 border border-ink px-4 py-3 text-[14px] font-semibold text-ink transition-colors duration-200 hover:bg-ink hover:text-paper"
                      >
                        <span>{etape.doc.label}</span>
                        <span
                          aria-hidden
                          className="text-[16px] leading-none transition-transform duration-200 group-hover/doc:translate-x-1"
                        >
                          →
                        </span>
                      </Link>
                    </div>
                  </div>
                </div>
              </Reveal>
            </li>
          ))}
        </ul>

        <Reveal as="div" delay={400} className="mt-10 flex justify-center">
          <button
            type="button"
            onClick={focusAndScroll}
            className="group inline-flex items-center justify-between gap-10 border border-signal bg-signal px-6 py-4 text-paper transition-colors duration-300 hover:bg-paper hover:text-signal active:scale-[0.98]"
          >
            <span className="mono text-[12px] font-semibold uppercase tracking-[0.2em]">
              lancer le scan
            </span>
            <span className="text-[22px] leading-none transition-transform duration-200 group-hover:translate-x-1">
              →
            </span>
          </button>
        </Reveal>
      </div>
    </section>
  );
}
