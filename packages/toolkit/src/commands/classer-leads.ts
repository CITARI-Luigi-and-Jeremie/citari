import { readFileSync, writeFileSync } from "node:fs";
import { temperature, type ProspectClassable } from "../lib/temperature.js";
import { parserCsv } from "./verifier-base.js";

/**
 * Classe une base de prospects du plus chaud au plus froid, avec la raison.
 *
 * L'ordre d'appel est la décision la plus rentable d'une journée de
 * prospection : à volume égal, commencer par les bons prospects change le
 * nombre de rendez-vous obtenus. La commande produit un CSV trié, numéroté de
 * 1 à N, où chaque ligne porte sa note, son palier et la phrase qui explique
 * pourquoi elle est là — celle qu'on relit avant de décrocher.
 *
 * Le détail par famille de points (joignable, signaux, adéquation, solidité)
 * est conservé en colonnes : sans lui, un classement est un oracle, et un
 * oracle ne se corrige pas.
 */

const echapper = (v: string) => (/[;"\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v);

export async function classerLeads(fichier: string, opts: { sortie?: string; top?: number }): Promise<void> {
  const lignes = parserCsv(readFileSync(fichier, "utf8"));
  if (!lignes.length) throw new Error(`Aucune ligne lue dans ${fichier}.`);

  const classees = lignes
    .map((l) => ({ ligne: l, t: temperature(l as unknown as ProspectClassable) }))
    .sort((a, b) => b.t.score - a.t.score || a.ligne.entreprise!.localeCompare(b.ligne.entreprise!, "fr"));

  const paliers = { chaud: 0, tiede: 0, froid: 0 };
  for (const c of classees) paliers[c.t.palier]++;

  console.log(`${classees.length} prospects classés\n`);
  console.log(`  🔥 chaud  ${String(paliers.chaud).padStart(3)}   à appeler cette semaine`);
  console.log(`  ☀️  tiède  ${String(paliers.tiede).padStart(3)}   deuxième vague`);
  console.log(`  ❄️  froid  ${String(paliers.froid).padStart(3)}   email seulement, ou plus tard\n`);

  const top = opts.top ?? 15;
  console.log(`── Les ${top} premiers ──`);
  for (const [i, c] of classees.slice(0, top).entries()) {
    const nom = (c.ligne.entreprise ?? "").slice(0, 30).padEnd(32);
    console.log(`  ${String(i + 1).padStart(3)}. ${nom} ${String(c.t.score).padStart(3)}  ${c.t.pourquoi}`);
  }

  // Un classement dont toutes les têtes viennent d'une seule verticale
  // signale un biais de DONNÉES, pas une vérité commerciale : les sociétés
  // technologiques sont mieux couvertes par les bases d'enrichissement et
  // posent plus de pixels publicitaires que les cabinets comptables. Sans
  // garde-fou, on appellerait une seule verticale en croyant suivre le mérite.
  const parVerticale = new Map<string, number>();
  for (const c of classees.slice(0, 30)) {
    const v = c.ligne.verticale ?? "?";
    parVerticale.set(v, (parVerticale.get(v) ?? 0) + 1);
  }
  console.log("\n── Répartition des 30 premiers ──");
  for (const [v, n] of [...parVerticale.entries()].sort((a, b) => b[1] - a[1])) {
    console.log(`  ${String(n).padStart(3)}  ${v}`);
  }
  const domine = [...parVerticale.entries()].sort((a, b) => b[1] - a[1])[0];
  if (domine && domine[1] >= 18 && parVerticale.size > 1) {
    console.log(`\n⚠ « ${domine[0]} » occupe ${domine[1]} des 30 premières places.`);
    console.log("  C'est très probablement un biais de couverture de données, pas un signal.");
    console.log("  Utilisez la colonne `rang_verticale` pour appeler en parallèle sur les trois.");
  }

  // Rang à l'intérieur de sa propre verticale : c'est celui qu'on suit pour
  // travailler les trois de front, comme le veut la série 33/33/33.
  const compteurs = new Map<string, number>();
  const rangVerticale = new Map<number, number>();
  for (const [i, c] of classees.entries()) {
    const v = c.ligne.verticale ?? "?";
    const n = (compteurs.get(v) ?? 0) + 1;
    compteurs.set(v, n);
    rangVerticale.set(i, n);
  }

  const sortie = opts.sortie ?? fichier.replace(/\.csv$/, "-classe.csv");
  const champsSource = Object.keys(lignes[0]!);
  const champs = ["rang", "rang_verticale", "temperature", "note_sur_100", "pourquoi", ...champsSource,
    "pts_joignable", "pts_signaux", "pts_adequation", "pts_solidite"];
  const out = [champs.join(";")];
  for (const [i, c] of classees.entries()) {
    out.push(champs.map((ch) => {
      const v = ch === "rang" ? String(i + 1)
        : ch === "rang_verticale" ? String(rangVerticale.get(i) ?? 0)
        : ch === "temperature" ? c.t.palier
        : ch === "note_sur_100" ? String(c.t.score)
        : ch === "pourquoi" ? c.t.pourquoi
        : ch === "pts_joignable" ? String(c.t.detail.joignable)
        : ch === "pts_signaux" ? String(c.t.detail.signaux)
        : ch === "pts_adequation" ? String(c.t.detail.adequation)
        : ch === "pts_solidite" ? String(c.t.detail.solidite)
        : (c.ligne[ch] ?? "");
      return echapper(v);
    }).join(";"));
  }
  writeFileSync(sortie, out.join("\n") + "\n", "utf8");
  console.log(`\nClassement écrit : ${sortie}`);
  console.log("Rappel : sans scan GEO, la note mesure une promesse d'opportunité, pas la douleur réelle.");
  console.log("Un `scan-lot` sur ces lignes ferait primer la douleur mesurée sur tous les indices.");
}
