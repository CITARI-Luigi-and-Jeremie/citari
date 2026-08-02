import { getDb, unwrap } from "@geo/core";
import { fetchText } from "../lib/crawl.js";
import { recordDeliverable, resolveClient, slugify, writeDeliverableFile } from "../lib/context.js";

/**
 * Chantier 3, la preuve : le client figure-t-il RÉELLEMENT sur chaque cible ?
 *
 * On crawle chaque cible de citation qui a une URL et on y cherche la marque
 * (comparaison normalisée : accents et ponctuation ignorés). Une cible marquée
 * « obtenue » dans notre suivi mais introuvable sur la page est reclassée : le
 * rapport de fin de sprint ne doit jamais affirmer une citation invérifiable.
 */

function normaliser(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

/** Entités HTML courantes dans les noms d'entreprises françaises. */
const ENTITES: Record<string, string> = {
  amp: "&", nbsp: " ", quot: '"', apos: "'",
  eacute: "é", egrave: "è", ecirc: "ê", agrave: "à", acirc: "â",
  ccedil: "ç", ocirc: "ô", ucirc: "û", ugrave: "ù", icirc: "î", iuml: "ï",
};

function decoderEntites(html: string): string {
  return html
    .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(Number(d)))
    .replace(/&([a-z]+);/gi, (_, n) => ENTITES[n.toLowerCase()] ?? " ");
}

export function marquePresente(html: string, marque: string): boolean {
  // On compare des textes normalisés : « Cabinet Vaurel &amp; Associés » doit
  // matcher « cabinet vaurel associes », balises retirées, entités décodées
  // (le test a attrapé le cas : « &amp; » laissait un « amp » parasite).
  const texte = normaliser(
    decoderEntites(html.replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>|<[^>]+>/g, " "))
  );
  const cible = normaliser(marque);
  if (cible.length < 3) return false;
  return texte.includes(cible) || texte.replace(/ /g, "").includes(cible.replace(/ /g, ""));
}

export async function verifyCitations(clientRef: string): Promise<void> {
  const client = await resolveClient(clientRef);
  const slug = slugify(client.brand);
  const db = getDb();

  const sprints = unwrap(await db.from("sprints").select("id").eq("client_id", client.id)) as { id: string }[];
  if (sprints.length === 0) throw new Error(`${client.brand} n'a aucun sprint. Lancez d'abord citation-targets.`);
  const cibles = unwrap(
    await db
      .from("citation_targets")
      .select("id, name, url, status")
      .in("sprint_id", sprints.map((s) => s.id))
  ) as { id: string; name: string; url: string | null; status: string | null }[];

  if (cibles.length === 0) throw new Error("Aucune cible de citation en base. Lancez d'abord citation-targets.");

  const resultats: { name: string; url: string | null; avant: string; verdict: string }[] = [];
  let obtenues = 0;

  for (const c of cibles) {
    const avant = c.status ?? "a_faire";
    if (!c.url) {
      resultats.push({ name: c.name, url: null, avant, verdict: "pas d'URL, vérification manuelle" });
      continue;
    }
    const html = await fetchText(c.url);
    if (html === null) {
      resultats.push({ name: c.name, url: c.url, avant, verdict: "page inaccessible" });
      continue;
    }
    const presente = marquePresente(html, client.brand);
    if (presente) {
      obtenues++;
      if (avant !== "obtenue") {
        await db.from("citation_targets").update({ status: "obtenue", obtained_on: new Date().toISOString().slice(0, 10) }).eq("id", c.id);
      }
      resultats.push({ name: c.name, url: c.url, avant, verdict: "✓ marque présente" });
    } else {
      // Une cible « obtenue » où la marque a disparu redevient « envoyee » :
      // le rapport ne doit jamais affirmer une citation invérifiable.
      if (avant === "obtenue") {
        await db.from("citation_targets").update({ status: "envoyee" }).eq("id", c.id);
        resultats.push({ name: c.name, url: c.url, avant, verdict: "⚠ marquée obtenue mais INTROUVABLE, reclassée" });
      } else {
        resultats.push({ name: c.name, url: c.url, avant, verdict: "absente pour l'instant" });
      }
    }
  }

  const md = `# Vérification des citations — ${client.brand}

${obtenues}/${cibles.length} cibles où la marque est vérifiée en ligne, le ${new Date().toLocaleDateString("fr-FR")}.

| Cible | Statut avant | Verdict |
|---|---|---|
${resultats.map((r) => `| ${r.url ? `[${r.name}](${r.url})` : r.name} | ${r.avant} | ${r.verdict} |`).join("\n")}
`;

  const path = writeDeliverableFile(slug, "verification-citations.md", md);
  await recordDeliverable(client.id, "citations_verifiees", `${obtenues}/${cibles.length} citations vérifiées en ligne`, path, {
    obtenues,
    total: cibles.length,
  });

  console.log(`\n${obtenues}/${cibles.length} citations vérifiées en ligne.`);
  for (const r of resultats) console.log(`  ${r.verdict.padEnd(46)} ${r.name}`);
  console.log(`→ ${path}`);
}
