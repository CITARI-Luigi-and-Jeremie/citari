import { readFileSync, writeFileSync } from "node:fs";
import {
  angleCommercial,
  avisSchema,
  cadence,
  datesDuFlux,
  datesDuSitemap,
  faqBalisee,
  materiauGeo,
  type SignauxGeo,
} from "../lib/signaux-geo.js";
import { parserCsv } from "./verifier-base.js";

/**
 * Lit, sur le site de chaque prospect, de quoi un sprint GEO disposerait.
 *
 * Tout vient de formats que le prospect publie volontairement : plan du site,
 * flux RSS, API publique de son CMS, balisage schema.org de ses propres pages.
 * Aucune interrogation d'un service tiers, aucun contournement : ce qu'on lit
 * est ce qu'il expose au monde, robots d'IA compris.
 *
 * Le résultat sort dans un FICHIER SÉPARÉ. Il ne remplace pas la note de
 * température : celle-ci dit qui rappeler en premier, celui-ci dit quoi lui
 * dire. Les mélanger produirait une note unique impossible à interpréter.
 */

const UA = "Mozilla/5.0 (compatible; CitariBot/1.0; +https://citari.fr)";

async function get(url: string, ms = 9000): Promise<string> {
  try {
    const r = await fetch(url, { headers: { "user-agent": UA }, signal: AbortSignal.timeout(ms) });
    if (!r.ok) return "";
    return (await r.text()).slice(0, 900_000);
  } catch {
    return "";
  }
}

/** Le plan du site, sous ses quatre noms usuels, index de sitemaps compris. */
async function planDuSite(base: string): Promise<{ urls: string[]; dates: string[] }> {
  for (const chemin of ["/sitemap.xml", "/sitemap_index.xml", "/wp-sitemap.xml", "/sitemap-index.xml"]) {
    const xml = await get(base + chemin);
    if (!xml.includes("<")) continue;
    let urls = [...xml.matchAll(/<loc>\s*([^<\s]+)\s*<\/loc>/g)].map((m) => m[1]!);
    let dates = datesDuSitemap(xml);
    if (/<sitemapindex/i.test(xml)) {
      const sous = urls.slice(0, 10);
      urls = [];
      for (const s of sous) {
        const y = await get(s);
        urls.push(...[...y.matchAll(/<loc>\s*([^<\s]+)\s*<\/loc>/g)].map((m) => m[1]!));
        dates.push(...datesDuSitemap(y));
      }
      dates = [...new Set(dates)].sort().reverse();
    }
    if (urls.length) return { urls, dates };
  }
  return { urls: [], dates: [] };
}

/** Les dates d'articles, par l'API du CMS puis par les flux. */
async function datesDesArticles(base: string): Promise<string[]> {
  const out: string[] = [];
  const wp = await get(`${base}/wp-json/wp/v2/posts?per_page=100&_fields=date`);
  if (wp.startsWith("[")) {
    try {
      for (const p of JSON.parse(wp) as { date?: string }[]) {
        if (p.date) out.push(p.date.slice(0, 10));
      }
    } catch {
      /* JSON illisible : on passe aux flux */
    }
  }
  if (out.length) return out;
  for (const f of ["/feed", "/rss", "/blog/feed", "/atom.xml", "/feed.xml", "/index.php/feed"]) {
    const x = await get(base + f);
    if (x.includes("<")) out.push(...datesDuFlux(x));
    if (out.length) break;
  }
  return out;
}

const RE_ARTICLE = /\/(blog|actualite|actualites|article|articles|news|nos-actualites|publications|conseils|ressources|guides?|dossiers?)\//i;

export async function signauxGeo(fichier: string, opts: { sortie?: string; parallele?: number }): Promise<void> {
  const lignes = parserCsv(readFileSync(fichier, "utf8"));
  if (!lignes.length) throw new Error(`Aucune ligne lue dans ${fichier}.`);
  const parallele = Math.max(1, Math.min(8, opts.parallele ?? 6));
  const aujourdhui = new Date();

  console.log(`${lignes.length} sites · lecture des plans, flux et balisages…\n`);

  async function analyser(l: Record<string, string>): Promise<{ l: Record<string, string>; s: SignauxGeo }> {
    const base = (l.site_web ?? "").replace(/\/+$/, "");
    const vide: SignauxGeo = {
      pagesTotal: 0, dernierContenu: null, contenus12Mois: 0, contenusTotal: 0,
      avisNote: null, avisNombre: null, faqBalisee: false, llmsTxt: false,
    };
    if (!base) return { l, s: vide };

    const [plan, articles, accueil, llms] = await Promise.all([
      planDuSite(base),
      datesDesArticles(base),
      get(base + "/"),
      get(base + "/llms.txt", 5000),
    ]);

    // Les dates d'articles priment ; à défaut, le plan du site sur ses seules
    // URL d'articles — le `lastmod` d'une page « mentions légales » ne dit
    // rien d'une politique de publication.
    const datesArticles = articles.length
      ? articles
      : plan.urls.filter((u) => RE_ARTICLE.test(u)).length
        ? plan.dates.slice(0, 200)
        : [];

    const limite = new Date(aujourdhui.getTime() - 365 * 86400000).toISOString().slice(0, 10);
    const triees = [...new Set(datesArticles)].sort().reverse();

    // Le balisage se lit sur l'accueil, et sur une page d'article si l'accueil
    // est muet : les FAQ et les avis y sont souvent déportés.
    let html = accueil;
    const avis1 = avisSchema(accueil);
    if (!avis1.nombre || !faqBalisee(accueil)) {
      const candidate = plan.urls.find((u) => /faq|avis|temoignage|contact/i.test(u));
      if (candidate) html += await get(candidate);
    }
    const avis = avisSchema(html);

    return {
      l,
      s: {
        pagesTotal: plan.urls.length,
        dernierContenu: triees[0] ?? null,
        contenus12Mois: triees.filter((d) => d >= limite).length,
        contenusTotal: triees.length,
        avisNote: avis.note,
        avisNombre: avis.nombre,
        faqBalisee: faqBalisee(html),
        llmsTxt: llms.trim().length > 0,
      },
    };
  }

  const resultats: { l: Record<string, string>; s: SignauxGeo }[] = [];
  for (let i = 0; i < lignes.length; i += parallele) {
    const lot = await Promise.all(lignes.slice(i, i + parallele).map(analyser));
    resultats.push(...lot);
    process.stdout.write(`\r  … ${Math.min(i + parallele, lignes.length)}/${lignes.length}`);
  }
  console.log("\n");

  const parCadence = { actif: 0, ralenti: 0, endormi: 0, abandonne: 0, aucun: 0 };
  for (const r of resultats) parCadence[cadence(r.s, aujourdhui)]++;

  console.log("── Rythme de publication ──");
  const libelle = {
    actif: "publie régulièrement",
    ralenti: "publie peu",
    endormi: "s'est arrêté il y a 1 à 3 ans",
    abandonne: "s'est arrêté il y a plus de 3 ans",
    aucun: "n'a jamais publié",
  };
  for (const [k, n] of Object.entries(parCadence)) {
    console.log(`  ${String(n).padStart(3)}  ${libelle[k as "actif"]}`);
  }
  const dormants = parCadence.endormi + parCadence.abandonne;
  if (dormants) {
    console.log(`\n★ ${dormants} prospects ont publié PUIS SE SONT ARRÊTÉS.`);
    console.log("  Ce sont les meilleurs : ils ont déjà payé pour croire au contenu,");
    console.log("  l'outillage est en place, et il ne leur manque que la méthode.");
  }
  const avecAvis = resultats.filter((r) => r.s.avisNombre);
  const avecFaq = resultats.filter((r) => r.s.faqBalisee);
  console.log(`\n  ${avecAvis.length} affichent des avis clients balisés · ${avecFaq.length} ont une FAQ balisée`);

  const echapper = (v: string) => (/[;"\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v);
  const champs = ["entreprise", "verticale", "site_web", "rang", "cadence", "materiau_geo", "angle_commercial",
    "pages_site", "dernier_contenu", "contenus_12_mois", "contenus_total",
    "avis_note", "avis_nombre", "faq_balisee", "llms_txt", "priorite_angle"];
  const out = [champs.join(";")];
  const tries = resultats
    .map((r) => ({ ...r, c: cadence(r.s, aujourdhui), a: angleCommercial(r.s, aujourdhui), m: materiauGeo(r.s, aujourdhui) }))
    .sort((x, y) => x.a.priorite - y.a.priorite || y.m - x.m);
  for (const r of tries) {
    out.push([
      r.l.entreprise ?? "", r.l.verticale ?? "", r.l.site_web ?? "", r.l.rang ?? "",
      r.c, String(r.m), r.a.angle,
      String(r.s.pagesTotal), r.s.dernierContenu ?? "", String(r.s.contenus12Mois), String(r.s.contenusTotal),
      r.s.avisNote === null ? "" : String(r.s.avisNote), r.s.avisNombre === null ? "" : String(r.s.avisNombre),
      r.s.faqBalisee ? "oui" : "", r.s.llmsTxt ? "oui" : "", String(r.a.priorite),
    ].map(echapper).join(";"));
  }
  const sortie = opts.sortie ?? fichier.replace(/\.csv$/, "-signaux-geo.csv");
  writeFileSync(sortie, out.join("\n") + "\n", "utf8");
  console.log(`\nFichier séparé écrit : ${sortie}`);
  console.log("Il répond à « que lui dire », pas à « qui rappeler » — la température garde ce rôle.");
}
