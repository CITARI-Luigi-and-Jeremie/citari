import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { ChevronDown } from "lucide-react";

import { CONTACT_EMAIL } from "@/lib/site";
import { Quadrillage } from "@/components/jeremie/Quadrillage";

/**
 * La FAQ, version v3 de Jérémie portée le 14/08/2026 : vingt questions en
 * deux groupes (Comprendre, L'offre), chacune avec son ancre et son balisage
 * schema.org — la FAQ est une page que les moteurs d'IA citent volontiers, et
 * ce site est sa propre démonstration.
 *
 * Une correction factuelle par rapport à sa copie : le scan gratuit interroge
 * ChatGPT et Gemini (2 moteurs), pas « les quatre principaux moteurs ». Dire
 * l'inverse sur la page qui vend l'exactitude serait fatal.
 */

const LABEL = "questions reçues";
const TITRE = "Les questions qui reviennent";

type Groupe = "comprendre" | "offre";

type Entree = {
  q: string;
  r: React.ReactNode;
  plain: string;
  ancre: string;
  groupe: Groupe;
};

const TITRES_GROUPE: Record<Groupe, string> = {
  comprendre: "Comprendre",
  offre: "L'offre",
};

const M = ({ children }: { children: React.ReactNode }) => (
  <span className="font-mono text-[0.92em] tabular-nums">{children}</span>
);

const ENTREES: Entree[] = [
  {
    groupe: "comprendre",
    ancre: "geo-definition",
    q: "Qu'est-ce que le GEO (Generative Engine Optimization) ?",
    plain:
      "Le GEO consiste à faire citer une marque dans les réponses des IA comme ChatGPT, Claude, Gemini ou Perplexity. Là où le SEO vous classe dans une liste de liens, le GEO vous place dans la réponse elle-même, celle que lit un acheteur qui ne cliquera sur rien. C'est le métier de Citari : mesurer votre visibilité dans ces réponses, puis la construire.",
    r: (
      <>
        Le <M>GEO</M> consiste à faire citer une marque dans les réponses des IA comme{" "}
        <M>ChatGPT</M>, <M>Claude</M>, <M>Gemini</M> ou <M>Perplexity</M>. Là où le <M>SEO</M> vous
        classe dans une liste de liens, le <M>GEO</M> vous place dans la réponse elle-même, celle que
        lit un acheteur qui ne cliquera sur rien. C'est le métier de Citari : mesurer votre
        visibilité dans ces réponses, puis la construire.
      </>
    ),
  },
  {
    groupe: "comprendre",
    ancre: "absence-chatgpt",
    q: "Pourquoi mon entreprise n'apparaît-elle pas dans les réponses de ChatGPT ?",
    plain:
      "Presque toujours pour l'une de ces trois raisons : votre site bloque les robots d'IA sans que vous le sachiez, vos pages ne répondent pas aux questions que posent vos acheteurs, et les sources que les IA consultent (annuaires, presse, comparateurs) ne mentionnent pas votre nom. Le scan gratuit vous dit en 90 secondes lesquelles de ces trois causes vous concernent.",
    r: (
      <>
        Presque toujours pour l'une de ces trois raisons : votre site bloque les robots d'IA sans que
        vous le sachiez, vos pages ne répondent pas aux questions que posent vos acheteurs, et les
        sources que les IA consultent (annuaires, presse, comparateurs) ne mentionnent pas votre
        nom. Le scan gratuit vous dit en <M>90 secondes</M> lesquelles de ces trois causes vous
        concernent.
      </>
    ),
  },
  {
    groupe: "comprendre",
    ancre: "etre-recommande",
    q: "Comment être recommandé par une IA ?",
    plain:
      "Une IA recommande les entreprises qu'elle peut lire, comprendre et vérifier ailleurs. Concrètement : un site techniquement ouvert à ses robots, des pages qui répondent directement aux questions des acheteurs, et une présence sur les sources tierces qu'elle consulte avant de répondre. Ce sont les trois chantiers du Sprint Citari, menés en 30 jours.",
    r: (
      <>
        Une IA recommande les entreprises qu'elle peut lire, comprendre et vérifier ailleurs.
        Concrètement : un site techniquement ouvert à ses robots, des pages qui répondent directement
        aux questions des acheteurs, et une présence sur les sources tierces qu'elle consulte avant
        de répondre. Ce sont les trois chantiers du Sprint Citari, menés en <M>30 jours</M>.
      </>
    ),
  },
  {
    groupe: "comprendre",
    ancre: "geo-vs-seo",
    q: "Le GEO remplace-t-il le SEO ?",
    plain:
      "Non, il s'y ajoute, et les deux ne mesurent pas la même chose. Un site parfaitement référencé sur Google peut être totalement absent des réponses de ChatGPT, parce que les IA s'appuient sur d'autres signaux : la lisibilité machine, les réponses directes, et surtout ce que les sources tierces disent de vous. Votre position Google ne vous protège pas.",
    r: (
      <>
        Non, il s'y ajoute, et les deux ne mesurent pas la même chose. Un site parfaitement référencé
        sur <M>Google</M> peut être totalement absent des réponses de <M>ChatGPT</M>, parce que les
        IA s'appuient sur d'autres signaux : la lisibilité machine, les réponses directes, et surtout
        ce que les sources tierces disent de vous. Votre position <M>Google</M> ne vous protège pas.
      </>
    ),
  },
  {
    groupe: "comprendre",
    ancre: "durabilite",
    q: "Les IA évoluent sans arrêt. Ce travail restera-t-il valable ?",
    plain:
      "Oui, parce qu'on ne travaille pas sur une astuce mais sur les fondamentaux que tous les moteurs partagent : un site lisible, des contenus qui répondent, des sources qui vous citent. Les modèles apprennent lentement et retiennent longtemps. C'est précisément pourquoi les places se prennent maintenant : ceux qui s'installent aujourd'hui dans les réponses partent avec une avance difficile à déloger.",
    r: (
      <>
        Oui, parce qu'on ne travaille pas sur une astuce mais sur les fondamentaux que tous les
        moteurs partagent : un site lisible, des contenus qui répondent, des sources qui vous citent.
        Les modèles apprennent lentement et retiennent longtemps. C'est précisément pourquoi les
        places se prennent maintenant : ceux qui s'installent aujourd'hui dans les réponses partent
        avec une avance difficile à déloger.
      </>
    ),
  },
  {
    groupe: "comprendre",
    ancre: "calcul-score",
    q: "Comment calculez-vous le score de visibilité IA ?",
    plain:
      "Le score de visibilité IA mesure la part des questions d'acheteurs sur lesquelles votre marque est citée, pondérée par sa position dans la réponse, les recommandations explicites et le ton employé. Il va de 0 à 100 et se lit avec la part de voix : vos mentions rapportées à celles de vos concurrents. La méthode est strictement identique au scan initial et à la remesure de J+90, sans quoi la comparaison ne vaudrait rien.",
    r: (
      <>
        Le score de visibilité IA mesure la part des questions d'acheteurs sur lesquelles votre
        marque est citée, pondérée par sa position dans la réponse, les recommandations explicites et
        le ton employé. Il va de <M>0 à 100</M> et se lit avec la part de voix : vos mentions
        rapportées à celles de vos concurrents. La méthode est strictement identique au scan initial
        et à la remesure de <M>J+90</M>, sans quoi la comparaison ne vaudrait rien.{" "}
        {/* La question où le lecteur veut le détail : c'est ici qu'il doit
            trouver la page qui publie la formule et le calcul complet. */}
        <Link to="/methode" className="link-underline text-ink">
          La formule et un calcul complet sont publiés
        </Link>
        .
      </>
    ),
  },
  {
    groupe: "comprendre",
    ancre: "pme-locale",
    q: "Est-ce que ça fonctionne pour une entreprise locale ou une PME ?",
    plain:
      "C'est même là que les résultats sont les plus rapides. Sur une requête locale comme « meilleur cabinet comptable à Lyon », la concurrence se joue entre quelques acteurs, dont la plupart n'ont jamais entendu parler de GEO. Trois places, peu de candidats sérieux : l'avantage du premier arrivé y est maximal.",
    r: (
      <>
        C'est même là que les résultats sont les plus rapides. Sur une requête locale comme
        «&nbsp;meilleur cabinet comptable à Lyon&nbsp;», la concurrence se joue entre quelques
        acteurs, dont la plupart n'ont jamais entendu parler de <M>GEO</M>. Trois places, peu de
        candidats sérieux : l'avantage du premier arrivé y est maximal.
      </>
    ),
  },
  {
    groupe: "offre",
    ancre: "scan-gratuit",
    q: "Que contient le scan gratuit ?",
    plain:
      "Le scan pose à ChatGPT et Gemini, les deux moteurs les plus utilisés, les questions que vos acheteurs posent réellement, et compte qui est cité : vous, et toutes les marques qui sortent, y compris les concurrents que vous nommez. Vous voyez votre score, votre part de voix, et la phrase exacte où une IA recommande quelqu'un de votre secteur. Gratuit, sans compte, sans carte bancaire, résultat en 90 secondes. Les quatre autres moteurs sont couverts par le scan premium.",
    r: (
      <>
        Le scan pose à <M>ChatGPT</M> et <M>Gemini</M>, les deux moteurs les plus utilisés, les
        questions que vos acheteurs posent réellement, et compte qui est cité : vous, et toutes les
        marques qui sortent, y compris les concurrents que vous nommez. Vous voyez votre score, votre
        part de voix, et la phrase exacte où une IA recommande quelqu'un de votre secteur. Gratuit,
        sans compte, sans carte bancaire, résultat en <M>90 secondes</M>. Les quatre autres moteurs
        sont couverts par le scan premium.
      </>
    ),
  },
  {
    groupe: "offre",
    ancre: "prix",
    q: "Combien coûte Citari ?",
    plain:
      "Le scan gratuit et le scan premium en visio sont offerts. Le Sprint coûte 2 900 € HT, payés une seule fois : 30 jours de travail sur les trois chantiers, 50 % à la commande, 50 % à la livraison. Aucun abonnement, aucune reconduction, rien à résilier.",
    r: (
      <>
        Le scan gratuit et le scan premium en visio sont offerts. Le Sprint coûte <M>2 900 € HT</M>, payés une
        seule fois : <M>30 jours</M> de travail sur les trois chantiers, <M>50 %</M> à la commande,{" "}
        <M>50 %</M> à la livraison. Aucun abonnement, aucune reconduction, rien à résilier.
      </>
    ),
  },
  {
    groupe: "offre",
    ancre: "paiement-unique",
    q: "Pourquoi un paiement unique plutôt qu'un abonnement ?",
    plain:
      "Parce que l'essentiel du travail se fait une fois, et bien. Ouvrir votre site aux IA, créer les contenus manquants, vous installer sur les bonnes sources : c'est un chantier, pas une rente. Vous jugez sur pièces à J+90, et la suite est votre décision, pas un prélèvement automatique.",
    r: (
      <>
        Parce que l'essentiel du travail se fait une fois, et bien. Ouvrir votre site aux IA, créer
        les contenus manquants, vous installer sur les bonnes sources : c'est un chantier, pas une
        rente. Vous jugez sur pièces à <M>J+90</M>, et la suite est votre décision, pas un
        prélèvement automatique.
      </>
    ),
  },
  {
    groupe: "offre",
    ancre: "faire-soi-meme",
    q: "Puis-je faire ce travail moi-même ?",
    plain:
      "En partie, oui. La couche technique est documentée publiquement et un bon développeur peut la traiter. La vraie difficulté est ailleurs : savoir précisément quoi corriger, écrire des contenus que les moteurs acceptent de citer, et obtenir une présence sur les sources qu'ils consultent. C'est un travail d'enquête et de relances, pas de code, et c'est celui qui ne se fait presque jamais en interne. Le scan gratuit vous montrera l'ampleur exacte du chantier : vous déciderez ensuite.",
    r: (
      <>
        En partie, oui. La couche technique est documentée publiquement et un bon développeur peut la
        traiter. La vraie difficulté est ailleurs : savoir précisément quoi corriger, écrire des
        contenus que les moteurs acceptent de citer, et obtenir une présence sur les sources qu'ils
        consultent. C'est un travail d'enquête et de relances, pas de code, et c'est celui qui ne se
        fait presque jamais en interne. Le scan gratuit vous montrera l'ampleur exacte du chantier :
        vous déciderez ensuite.
      </>
    ),
  },
  {
    groupe: "offre",
    ancre: "temps-demande",
    q: "Combien de temps cela me demande-t-il ?",
    plain:
      "Deux appels : une heure de cadrage au départ, trente minutes de validation en cours de Sprint. Nous écrivons, nous corrigeons, nous contactons les sources. Rien ne repose sur vos équipes, et c'est volontaire : un projet qui demande du temps au dirigeant est un projet qui ne se fait pas.",
    r: (
      <>
        Deux appels : une heure de cadrage au départ, trente minutes de validation en cours de
        Sprint. Nous écrivons, nous corrigeons, nous contactons les sources. Rien ne repose sur vos
        équipes, et c'est volontaire : un projet qui demande du temps au dirigeant est un projet qui
        ne se fait pas.
      </>
    ),
  },
  {
    groupe: "offre",
    ancre: "garantie",
    q: "Garantissez-vous que je serai cité ?",
    plain:
      "Non, et méfiez-vous de quiconque vous le promet : personne ne contrôle les modèles. Nous garantissons deux choses vérifiables : l'exécution intégrale des trois chantiers, détaillée dans un rapport de fin de mission, et la remesure à J+90, mêmes questions, mêmes moteurs, mot pour mot. Vous comparez, chiffre contre chiffre.",
    r: (
      <>
        Non, et méfiez-vous de quiconque vous le promet : personne ne contrôle les modèles. Nous
        garantissons deux choses vérifiables : l'exécution intégrale des trois chantiers, détaillée
        dans un rapport de fin de mission, et la remesure à <M>J+90</M>, mêmes questions, mêmes
        moteurs, mot pour mot. Vous comparez, chiffre contre chiffre.
      </>
    ),
  },
  {
    groupe: "offre",
    ancre: "delai-resultats",
    q: "Combien de temps avant de voir des résultats ?",
    plain:
      "Les moteurs intègrent les changements en 4 à 12 semaines : c'est le temps qu'il leur faut pour relire votre site et réévaluer les sources. C'est exactement pourquoi la remesure a lieu à J+90, et pourquoi elle est incluse. Un prestataire qui vous promet un effet immédiat décrit un mécanisme qui n'existe pas.",
    r: (
      <>
        Les moteurs intègrent les changements en <M>4 à 12 semaines</M> : c'est le temps qu'il leur
        faut pour relire votre site et réévaluer les sources. C'est exactement pourquoi la remesure a
        lieu à <M>J+90</M>, et pourquoi elle est incluse. Un prestataire qui vous promet un effet
        immédiat décrit un mécanisme qui n'existe pas.
      </>
    ),
  },
  {
    groupe: "offre",
    ancre: "site-agence",
    q: "Mon site est géré par une agence. C'est un problème ?",
    plain:
      "Aucun. Soit nous intervenons directement avec un accès, soit nous livrons à votre agence un cahier de spécifications prêt à appliquer. Les deux formats sont prévus, et de votre côté rien ne change : deux appels, rien d'autre.",
    r: (
      <>
        Aucun. Soit nous intervenons directement avec un accès, soit nous livrons à votre agence un
        cahier de spécifications prêt à appliquer. Les deux formats sont prévus, et de votre côté
        rien ne change : deux appels, rien d'autre.
      </>
    ),
  },
  {
    groupe: "offre",
    ancre: "apres-sprint",
    q: "Que se passe-t-il après le Sprint ?",
    plain:
      "Vous recevez le rapport de fin de mission, puis la remesure à J+90. Ensuite, trois chemins possibles : vous arrêter là, relancer un Sprint sur un nouveau territoire de questions, ou nous confier la suite en continu. Aucun n'est automatique. Les contenus, le balisage et les citations obtenues vous appartiennent et continuent de travailler sans nous.",
    r: (
      <>
        Vous recevez le rapport de fin de mission, puis la remesure à <M>J+90</M>. Ensuite, trois
        chemins possibles : vous arrêter là, relancer un Sprint sur un nouveau territoire de
        questions, ou nous confier la suite en continu. Aucun n'est automatique. Les contenus, le
        balisage et les citations obtenues vous appartiennent et continuent de travailler sans nous.
      </>
    ),
  },
  {
    groupe: "offre",
    ancre: "concurrents",
    q: "Travaillez-vous avec mes concurrents ?",
    plain:
      "Non : un seul client par secteur et par zone, c'est une règle absolue. On ne peut pas pousser deux noms sur les trois mêmes places. Le premier arrivé bloque la sienne, chez nous et dans les réponses.",
    r: (
      <>
        Non : un seul client par secteur et par zone, c'est une règle absolue. On ne peut pas pousser
        deux noms sur les trois mêmes places. Le premier arrivé bloque la sienne, chez nous et dans
        les réponses.
      </>
    ),
  },
  {
    groupe: "offre",
    ancre: "prix-affiche",
    q: "Pourquoi le prix est-il affiché ?",
    plain:
      "Parce qu'un prix caché sert le vendeur, pas l'acheteur. Le Sprint GEO coûte 2 900 € HT, quel que soit votre chiffre d'affaires, et vous le savez avant de nous parler. Cela nous oblige à consacrer le rendez-vous à votre situation plutôt qu'à négocier un chiffre.",
    r: (
      <>
        Parce qu'un prix caché sert le vendeur, pas l'acheteur. Le Sprint GEO coûte{" "}
        <M>2 900 € HT</M>, quel que soit votre chiffre d'affaires, et vous le savez avant de nous
        parler. Cela nous oblige à consacrer le rendez-vous à votre situation plutôt qu'à négocier un
        chiffre.
      </>
    ),
  },
  {
    groupe: "offre",
    ancre: "outil-de-suivi",
    q: "Pourquoi pas un outil de suivi à 59 € par mois ?",
    plain:
      "Un outil mesure et affiche. Il ne réécrit pas vos pages, ne pose pas vos correctifs techniques et ne va pas chercher les sources que les IA citent. Si vous avez déjà l'équipe pour agir, un outil suffit peut-être. Le sprint existe pour ceux qui n'ont personne pour faire le travail.",
    r: (
      <>
        Un outil mesure et affiche. Il ne réécrit pas vos pages, ne pose pas vos correctifs
        techniques et ne va pas chercher les sources que les IA citent. Si vous avez déjà l'équipe
        pour agir, un outil suffit peut-être. Le sprint existe pour ceux qui n'ont personne pour
        faire le travail.
      </>
    ),
  },
  {
    groupe: "offre",
    ancre: "email",
    q: "Que faites-vous de mon adresse email ?",
    plain:
      "Elle sert à vous envoyer votre rapport et, si vous ne donnez pas suite, deux ou trois relances. Elle n'est ni revendue, ni transmise. Vous pouvez demander sa suppression à tout moment.",
    r: (
      <>
        Elle sert à vous envoyer votre rapport et, si vous ne donnez pas suite, deux ou trois
        relances. Elle n'est ni revendue, ni transmise. Vous pouvez demander sa suppression à tout
        moment.
      </>
    ),
  },
];

const faqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: ENTREES.map((e) => ({
    "@type": "Question",
    name: e.q,
    acceptedAnswer: { "@type": "Answer", text: e.plain },
  })),
};

function num(i: number) {
  return String(i + 1).padStart(2, "0");
}

function Entree({ entree, index }: { entree: Entree; index: number }) {
  const [ouvert, setOuvert] = useState(false);
  return (
    <div className="border-b border-rule">
      <h3 id={entree.ancre} className="m-0 scroll-mt-28">
        <button
          type="button"
          onClick={() => setOuvert((v) => !v)}
          aria-expanded={ouvert}
          className="group flex w-full items-baseline gap-4 py-5 text-left transition-colors duration-200 hover:bg-paper-2/40 sm:gap-6"
        >
          <span className="w-[2.2em] shrink-0 font-mono text-[12px] tabular-nums text-ink-2">
            {num(index)}
          </span>
          <span className="flex-1 font-sans text-[18px] font-semibold leading-[1.3] tracking-[-0.01em] text-ink sm:text-[21px]">
            {entree.q}
          </span>
          <span className="shrink-0 px-1">
            <ChevronDown
              aria-hidden="true"
              className="h-5 w-5 text-ink-2 transition-transform duration-300 ease-out group-hover:text-ink"
              style={{ transform: ouvert ? "rotate(180deg)" : "rotate(0deg)" }}
            />
          </span>
        </button>
      </h3>
      <div
        className="grid transition-[grid-template-rows] duration-300 ease-out"
        style={{ gridTemplateRows: ouvert ? "1fr" : "0fr" }}
      >
        <div className="overflow-hidden">
          <div className="pb-6 sm:pl-[calc(2.2em+1.5rem)]">
            <p className="max-w-[64ch] font-sans text-[15.5px] leading-[1.65] text-ink-2 sm:text-[16px]">
              {entree.r}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Les vingt questions sont toutes rendues, groupées par famille.
 *
 * Elles s'affichaient cinq par cinq derrière un bouton « voir plus »
 * (15/08/2026). Deux conséquences, aucune souhaitable : le groupe « L'offre »
 * n'apparaissait qu'au deuxième clic, donc un visiteur qui cherchait le PRIX
 * ne le trouvait pas ; et les quinze questions masquées n'existaient tout
 * simplement pas dans la page — sur un site dont le métier est de se faire
 * lire par des moteurs, cacher son meilleur contenu au robot est un
 * contresens. Repliées, elles ne coûtent qu'une ligne chacune.
 */
export function SectionFAQ() {
  const liste = ENTREES;

  return (
    <section id="faq" className="surface-hollow relative">
      <Quadrillage variante="clair" />
      <div className="rule-fade absolute inset-x-0 top-0" />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />
      <div className="relative z-10 mx-auto max-w-5xl px-5 py-16 sm:px-8 sm:py-24">
        <p className="font-mono text-[12px] uppercase tracking-[0.1em] text-ink-2">{LABEL}</p>
        <h2 className="mt-4 max-w-[24ch] font-sans text-[30px] font-extrabold leading-[1.08] tracking-[-0.02em] text-ink sm:text-[44px]">
          {TITRE}
        </h2>

        <div className="mt-12">
          {liste.map((e, i) => {
            const nouveauGroupe = i === 0 || liste[i - 1]!.groupe !== e.groupe;
            return (
              <div key={e.ancre}>
                {nouveauGroupe ? (
                  <div
                    className={`flex items-baseline justify-between gap-4 border-t border-ink pb-2 pt-4 ${
                      i === 0 ? "" : "mt-10"
                    }`}
                  >
                    <p className="font-mono text-[12px] uppercase tracking-[0.16em] text-ink">
                      {TITRES_GROUPE[e.groupe]}
                    </p>
                    {/* Le compte oriente : on sait où l'on met les pieds, et
                        combien il reste avant la famille suivante. */}
                    <p className="font-mono text-[11px] tabular-nums text-ink-2">
                      {ENTREES.filter((x) => x.groupe === e.groupe).length} questions
                    </p>
                  </div>
                ) : null}
                <Entree entree={e} index={i} />
              </div>
            );
          })}
        </div>

        <p className="mt-10 font-mono text-[12px] leading-[1.6] text-ink-2">
          Une question qui n'est pas là ?{" "}
          <a href={`mailto:${CONTACT_EMAIL}`} className="link-underline text-ink">
            {CONTACT_EMAIL}
          </a>
        </p>
      </div>
    </section>
  );
}
