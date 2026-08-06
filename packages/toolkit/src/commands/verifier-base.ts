import { readFileSync, writeFileSync } from "node:fs";
import { resolveMx } from "node:dns/promises";
import {
  domaineEmail,
  emailValide,
  noterFiabilite,
  type Fiabilite,
  type LigneProspect,
} from "../lib/verification.js";

/**
 * Contrôle qualité d'une base de prospects avant le premier envoi.
 *
 * Trois vérifications que rien d'autre ne fait :
 *
 *  1. **Le domaine reçoit-il du courrier ?** Une recherche MX en DNS, gratuite
 *     et instantanée. Un domaine sans MX fait rebondir à coup sûr, et les
 *     rebonds sont ce qui grille la réputation d'un domaine d'envoi neuf —
 *     précisément notre cas, `citari.fr` n'ayant jamais rien envoyé.
 *  2. **Les doublons**, y compris entre verticales : une même société peut
 *     être déclarée en deux codes NAF et sortir deux fois. Recevoir deux fois
 *     le même email nous disqualifie auprès du prospect.
 *  3. **La cohérence de la ligne** : zone, SIREN, format des emails,
 *     concordance du domaine. Voir `lib/verification.ts`.
 *
 * La commande ne supprime rien : elle note de A à D et écrit un rapport. Ce
 * qui sort de la base est une décision commerciale, pas technique.
 */

/**
 * Lecture d'un CSV point-virgule, guillemets compris.
 *
 * Le fichier se parcourt d'un bout à l'autre, et NON ligne par ligne : un
 * champ entre guillemets peut contenir un retour à la ligne, et découper sur
 * `\n` coupait alors les enregistrements en deux. Le bug s'est produit ici
 * même, sur la colonne des dirigeants du RNE : 102 lignes en donnaient 204,
 * dont la moitié sans en-tête reconnaissable.
 */
export function parserCsv(contenu: string): Record<string, string>[] {
  const enregistrements: string[][] = [];
  let cellules: string[] = [];
  let courant = "";
  let dansGuillemets = false;
  for (let i = 0; i < contenu.length; i++) {
    const c = contenu[i]!;
    if (dansGuillemets) {
      if (c === '"') {
        if (contenu[i + 1] === '"') { courant += '"'; i++; }
        else dansGuillemets = false;
      } else courant += c;
      continue;
    }
    if (c === '"') dansGuillemets = true;
    else if (c === ";") { cellules.push(courant); courant = ""; }
    else if (c === "\n" || c === "\r") {
      if (c === "\r" && contenu[i + 1] === "\n") i++;
      cellules.push(courant);
      if (cellules.some((x) => x !== "")) enregistrements.push(cellules);
      cellules = [];
      courant = "";
    } else courant += c;
  }
  cellules.push(courant);
  if (cellules.some((x) => x !== "")) enregistrements.push(cellules);

  const [champs, ...corps] = enregistrements;
  if (!champs) return [];
  return corps.map((r) => Object.fromEntries(champs.map((f, i) => [f, r[i] ?? ""])));
}

function lireCsv(chemin: string): Record<string, string>[] {
  return parserCsv(readFileSync(chemin, "utf8"));
}

const echapper = (v: string) => (/[;"\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v);

/** Le domaine accepte-t-il du courrier ? Mis en cache : les domaines se répètent. */
async function aDesMx(domaine: string, cache: Map<string, boolean>): Promise<boolean> {
  if (!domaine) return false;
  const connu = cache.get(domaine);
  if (connu !== undefined) return connu;
  let ok = false;
  try {
    const mx = await resolveMx(domaine);
    ok = mx.length > 0;
  } catch {
    ok = false;
  }
  cache.set(domaine, ok);
  return ok;
}

export async function verifierBase(fichier: string, opts: { communes?: string; sortie?: string }): Promise<void> {
  const lignes = lireCsv(fichier);
  if (!lignes.length) throw new Error(`Aucune ligne lue dans ${fichier}.`);
  const communesZone = (opts.communes ?? "Lyon,Villeurbanne,Ecully,Caluire,Bron,Venissieux,Oullins,Tassin,Saint-Priest,Meyzieu,Rillieux,Vaulx-en-Velin,Givors,Decines,Genas,Limonest,Dardilly,Champagne,Sainte-Foy,Charbonnieres,Craponne,Francheville,Chassieu,Corbas,Feyzin,Irigny,Mions,Saint-Genis,Brignais,Beaujolais,Villefranche")
    .split(",").map((s) => s.trim()).filter(Boolean);

  console.log(`${lignes.length} lignes · vérification des domaines de messagerie…\n`);

  const cacheMx = new Map<string, boolean>();
  const notes: (Fiabilite & { ligne: Record<string, string> })[] = [];

  for (const l of lignes) {
    const ceoEmail = l.ceo_email ?? "";
    const entEmail = l.email_entreprise ?? "";
    const mxCeo = emailValide(ceoEmail) ? await aDesMx(domaineEmail(ceoEmail), cacheMx) : null;
    const mxEnt = emailValide(entEmail) ? await aDesMx(domaineEmail(entEmail), cacheMx) : null;
    const f = noterFiabilite(l as unknown as LigneProspect, { communesZone, mxCeo, mxEntreprise: mxEnt });
    notes.push({ ...f, ligne: l });
  }

  // Doublons : par SIREN quand il existe, sinon par domaine de site.
  const vus = new Map<string, string>();
  for (const n of notes) {
    const cle = n.ligne.siren || (n.ligne.site_web ?? "").toLowerCase().replace(/^https?:\/\/(www\.)?/, "").split("/")[0];
    if (!cle) continue;
    const premier = vus.get(cle);
    if (premier && premier !== n.ligne.entreprise) {
      n.alertes.push(`doublon de « ${premier} »`);
      n.note = "D";
    } else if (premier) {
      n.alertes.push("doublon exact dans la base");
      n.note = "D";
    } else vus.set(cle, n.ligne.entreprise ?? "");
  }

  const parNote = { A: 0, B: 0, C: 0, D: 0 };
  for (const n of notes) parNote[n.note]++;

  console.log("── Fiabilité ──");
  for (const [note, n] of Object.entries(parNote)) {
    const quoi = { A: "prête à contacter", B: "exploitable, un défaut mineur", C: "à compléter avant contact", D: "à écarter" }[note as "A"];
    console.log(`  ${note} : ${String(n).padStart(3)}  ${quoi}`);
  }

  const aEcarter = notes.filter((n) => n.note === "D");
  if (aEcarter.length) {
    console.log("\n── À écarter ──");
    for (const n of aEcarter) console.log(`  ${(n.ligne.entreprise ?? "").slice(0, 34).padEnd(36)} ${n.alertes.join(" · ")}`);
  }

  const mxKo = notes.filter((n) => n.alertes.some((a) => a.includes("ne reçoit pas de mail") || a.includes("sans MX")));
  if (mxKo.length) {
    console.log(`\n⚠ ${mxKo.length} domaine(s) de messagerie injoignables : ces emails rebondiraient.`);
  }

  const sortie = opts.sortie ?? fichier.replace(/\.csv$/, "-verifie.csv");
  const champs = [...Object.keys(lignes[0]!), "fiabilite", "score_fiabilite", "alertes"];
  const out = [champs.join(";")];
  for (const n of notes) {
    out.push(champs.map((c) =>
      echapper(c === "fiabilite" ? n.note : c === "score_fiabilite" ? String(n.score) : c === "alertes" ? n.alertes.join(" · ") : (n.ligne[c] ?? ""))
    ).join(";"));
  }
  writeFileSync(sortie, out.join("\n") + "\n", "utf8");
  console.log(`\nRapport écrit : ${sortie}`);
}
