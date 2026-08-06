/**
 * Température d'un prospect : à quel point il vaut d'être appelé en premier.
 *
 * ⚠ Ce score mesure une PROMESSE d'opportunité, pas la douleur réelle. La
 * douleur réelle, c'est le score GEO du prospect, et il ne s'obtient qu'en le
 * scannant (`scan-lot`, 0,14 € la ligne). Tant qu'un scan n'a pas tourné, on
 * classe sur des indices : est-il joignable, achète-t-il déjà de l'acquisition,
 * son site bloque-t-il les robots d'IA, sa taille le laisse-t-elle décider
 * seul. Dès que le scan existe, il doit primer sur tout le reste — c'est
 * prévu par `bonusScanGeo`.
 *
 * Quatre familles de points, et chacune répond à une question commerciale
 * différente :
 *
 *  - **Signaux d'achat (30)** : puis-je lui montrer une cause vérifiable en
 *    trente secondes, et a-t-il déjà un budget d'acquisition ?
 *  - **Capacité à payer (20)** : 2 900 € sont-ils une décision facile pour lui ?
 *    Le résultat net publié au registre le dit mieux que l'effectif.
 *  - **Adéquation (20)** : sa taille et son métier correspondent-ils à ce que
 *    nous savons vendre en un rendez-vous ?
 *  - **Joignable (20)** : puis-je parler au décideur cette semaine ?
 *  - **Solidité (10)** : la fiche est-elle sûre, ou vais-je appeler dans le
 *    vide ?
 *
 * **Pourquoi la joignabilité ne domine PAS.** Elle a d'abord pesé 35 points,
 * et le premier classement l'a immédiatement puni : vingt des trente premiers
 * étaient des sociétés informatiques, non parce qu'elles étaient les meilleurs
 * prospects, mais parce qu'Apollo couvre beaucoup mieux la tech que
 * l'expertise comptable. La note mesurait la richesse de nos données, pas la
 * chaleur du prospect. Elle est donc redescendue à 25, et l'écart entre un
 * email nominatif et un `contact@` s'est resserré : dans une PME de quinze
 * personnes, le dirigeant lit `contact@` lui-même.
 */

export interface ProspectClassable {
  entreprise: string;
  verticale: string;
  taille_salaries: string;
  ceo_email: string;
  ceo_email_statut: string;
  ceo_nom: string;
  mkt_email: string;
  tel_mobile_site: string;
  tel_standard: string;
  email_entreprise: string;
  emails_entreprise_tous: string;
  signal_bots_ia_bloques: string;
  signal_pixels_pub: string;
  siren: string;
  fiabilite?: string;
  /** Résultat net du dernier exercice publié, en euros. Vide si non publié. */
  resultat_eur?: string;
  /** Score GEO mesuré, quand un scan a tourné. 0-100, plus bas = plus douloureux. */
  score_geo?: string;
}

export interface Temperature {
  score: number;
  /** Chaud ≥ 70, tiède ≥ 50, froid en dessous. */
  palier: "chaud" | "tiede" | "froid";
  /** La raison en une phrase, celle qu'on relit avant de décrocher. */
  pourquoi: string;
  detail: { joignable: number; signaux: number; adequation: number; solidite: number; capacite: number };
}

/**
 * Peut-il signer 2 900 € sans que ce soit une décision difficile ?
 *
 * Le résultat net du dernier exercice publié au registre répond mieux que
 * l'effectif : un cabinet de cinq personnes à 200 000 € de résultat signe sans
 * réfléchir, un cabinet de vingt à 4 000 € hésitera six semaines. La donnée est
 * gratuite et publique, et 65 sociétés sur 100 la publient.
 *
 * Les comptes non publiés ne sont PAS pénalisés : beaucoup de sociétés usent
 * légalement de la confidentialité, et présumer l'insolvabilité écarterait de
 * bons prospects. On note ce qu'on sait, jamais ce qu'on ignore.
 */
export function pointsCapacite(resultatEur?: string): { points: number; mention: string } {
  const brut = (resultatEur ?? "").trim();
  if (!brut) return { points: 10, mention: "" }; // inconnu : neutre, ni bonus ni malus
  const v = Number(brut);
  if (!Number.isFinite(v)) return { points: 10, mention: "" };
  if (v > 150000) return { points: 20, mention: `résultat ${Math.round(v / 1000)} k€ : signe sans arbitrer` };
  if (v > 60000) return { points: 17, mention: `résultat ${Math.round(v / 1000)} k€ : budget disponible` };
  if (v > 20000) return { points: 13, mention: "" };
  if (v > 0) return { points: 5, mention: `résultat ${Math.round(v / 1000)} k€ : 2 900 € pèseront` };
  return { points: 0, mention: "en perte : ne pas prioriser" };
}

/**
 * Effectif : la fourchette où l'on vend en un rendez-vous.
 *
 * Sous 10 salariés, 2 900 € pèsent lourd et la décision se prend au feeling.
 * Au-delà de 50, un responsable marketing défend son territoire et le cycle
 * s'allonge : comité, appel d'offres, budget de l'année suivante. Entre les
 * deux, le budget existe, personne en interne ne fait ce métier, et le
 * dirigeant tranche seul.
 */
export function pointsTaille(taille: string): number {
  const t = (taille ?? "").replace(/\s/g, "");
  const bornes = t.match(/(\d+)[^\d]+(\d+)/);
  const min = bornes ? Number(bornes[1]) : Number(t.match(/\d+/)?.[0] ?? NaN);
  if (!Number.isFinite(min)) return 6;
  if (min >= 10 && min <= 49) return 12;
  if (min >= 50 && min <= 99) return 7;
  if (min >= 6 && min <= 9) return 9;
  if (min >= 3 && min <= 5) return 5;
  if (min >= 100) return 3;
  return 3;
}

/**
 * Verticale : hypothèse de conversion, à réviser dès les premiers retours.
 *
 * C'est le paramètre le moins solide de ce fichier, et c'est assumé : il est
 * précisément ce que la série 33/33/33 doit mesurer. La gestion de patrimoine
 * mène parce qu'un seul client récupéré y rembourse plusieurs fois le sprint
 * et que personne n'y parle encore de GEO ; l'informatique suit parce que le
 * décideur comprend le sujet en une phrase ; l'expertise comptable ferme la
 * marche parce que les acteurs en ligne y ont déjà éduqué le marché, ce qui
 * aide à la compréhension mais durcit la comparaison.
 */
export function pointsVerticale(verticale: string): number {
  const v = (verticale ?? "").toLowerCase();
  if (v.includes("patrimoine")) return 8;
  if (v.includes("informatique")) return 7;
  if (v.includes("comptable")) return 6;
  return 6;
}

const aValeur = (s: string) => Boolean((s ?? "").trim());

export function temperature(p: ProspectClassable): Temperature {
  const raisons: string[] = [];

  // ── Joignable : 20 ──
  let joignable = 0;
  const emailNominatif = aValeur(p.ceo_email);
  if (emailNominatif) {
    joignable += p.ceo_email_statut === "verified" ? 9 : 7;
    raisons.push(p.ceo_email_statut === "verified" ? "email dirigeant vérifié" : "email dirigeant publié");
  } else if (aValeur(p.email_entreprise)) {
    joignable += 6;
  }
  if (aValeur(p.tel_mobile_site)) {
    joignable += 7;
    raisons.push("mobile direct");
  } else if (aValeur(p.tel_standard)) {
    joignable += 3;
  }
  if (aValeur(p.mkt_email)) {
    joignable += 4;
    raisons.push("contact marketing en second appui");
  }

  // ── Signaux d'achat : 30 ──
  //
  // Le blocage des robots d'IA est le signal le plus fort dont nous
  // disposions avant d'avoir scanné : c'est une CAUSE, pas un symptôme, elle
  // explique l'invisibilité à elle seule, et le prospect la vérifie lui-même
  // en trente secondes sur son propre robots.txt. Aucun argumentaire n'obtient
  // ça.
  let signaux = 0;
  const bots = (p.signal_bots_ia_bloques ?? "").trim();
  if (bots) {
    signaux += 18;
    raisons.unshift(`bloque ${bots.split(/[|,]/)[0]!.trim()} : cause vérifiable en 30 secondes`);
  }
  const pixels = (p.signal_pixels_pub ?? "").split(/[|,]/).map((s) => s.trim()).filter(Boolean);
  const payants = pixels.filter((x) => /ads|meta|linkedin|hubspot/i.test(x));
  if (payants.length) {
    signaux += 12;
    raisons.push(`budget d'acquisition engagé (${payants[0]})`);
  } else if (pixels.length) {
    signaux += 5;
  }

  // ── Adéquation : 25 ──
  const adequation = pointsTaille(p.taille_salaries) + pointsVerticale(p.verticale);
  if (pointsTaille(p.taille_salaries) >= 12) raisons.push("taille idéale : le dirigeant décide seul");

  // ── Capacité à payer : 20 ──
  const cap = pointsCapacite(p.resultat_eur);
  if (cap.mention) raisons.push(cap.mention);

  // ── Solidité : 15 ──
  let solidite = 0;
  if (p.fiabilite === "A") solidite += 4;
  else if (p.fiabilite === "B") solidite += 2;
  if (aValeur(p.siren)) solidite += 3;
  const nbEmails = (p.emails_entreprise_tous ?? "").split("|").filter(Boolean).length;
  if (nbEmails >= 3) solidite += 3;
  else if (nbEmails >= 1) solidite += 1;

  let score = joignable + signaux + adequation + solidite + cap.points;

  // Le scan mesuré prime sur tous les indices : c'est la douleur réelle.
  const bonus = bonusScanGeo(p.score_geo);
  score += bonus.points;
  if (bonus.raison) raisons.unshift(bonus.raison);

  score = Math.max(0, Math.min(100, Math.round(score)));
  const palier = score >= 70 ? "chaud" : score >= 50 ? "tiede" : "froid";
  const pourquoi = raisons.length
    ? raisons.slice(0, 3).join(" · ")
    : "joignable, mais aucun signal fort : à garder pour une deuxième vague";
  return { score, palier, pourquoi, detail: { joignable, signaux, adequation, solidite, capacite: cap.points } };
}

/**
 * Ce que vaut un score GEO déjà mesuré.
 *
 * Un score bas est notre meilleur argument : le prospect est invisible et on
 * peut le lui prouver avec ses propres chiffres. Un score haut vaut un malus,
 * et c'est cohérent avec la promesse publique « si votre score est bon, nous
 * vous le dirons et nous ne vous vendrons rien ».
 */
export function bonusScanGeo(scoreGeo?: string): { points: number; raison: string } {
  // `Number("")` vaut 0, et 0 est un score GEO parfaitement valide — le pire
  // qui soit. Sans ce garde, une colonne vide aurait valu « invisible, mesuré »
  // et vingt points à toutes les lignes d'une base jamais scannée.
  const brut = (scoreGeo ?? "").trim();
  if (!brut) return { points: 0, raison: "" };
  const s = Number(brut);
  if (!Number.isFinite(s)) return { points: 0, raison: "" };
  if (s < 15) return { points: 20, raison: `score GEO ${Math.round(s)}/100 : invisible, mesuré` };
  if (s < 30) return { points: 14, raison: `score GEO ${Math.round(s)}/100 : quasi invisible, mesuré` };
  if (s < 50) return { points: 6, raison: `score GEO ${Math.round(s)}/100 : marginal, mesuré` };
  if (s < 70) return { points: -8, raison: `score GEO ${Math.round(s)}/100 : déjà présent` };
  return { points: -25, raison: `score GEO ${Math.round(s)}/100 : ne rien lui vendre` };
}
