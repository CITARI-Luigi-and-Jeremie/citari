import { readFileSync, writeFileSync } from "node:fs";
import {
  botsIaBloques,
  CHEMINS_CONTACT,
  detecterRegiesPub,
  extraireEmails,
  extraireResponsable,
  extraireTelephones,
  formaterTelephone,
  texteVisible,
} from "../lib/contacts.js";

/**
 * Enrichit un CSV de prospects avec ce que leur propre site publie.
 *
 * Les PME françaises publient leurs coordonnées : page contact, pied de page,
 * et mentions légales, obligatoires par la LCEN et qui nomment le responsable
 * de publication. C'est gratuit, exact à la source, et plus frais qu'une base
 * achetée, puisque c'est l'entreprise qui l'écrit elle-même.
 *
 * On récolte au passage deux signaux qui valent de l'or pour Citari :
 *
 *  - **robots.txt bloquant les robots d'IA** : la meilleure accroche possible,
 *    vérifiable par le prospect en trente secondes, et c'est une cause, pas un
 *    symptôme ;
 *  - **pixels publicitaires** : une société qui paye déjà des clics a un budget
 *    d'acquisition et comprend le problème en une phrase.
 *
 * Lecture seule et respectueuse : quelques pages publiques par domaine,
 * espacées, avec un en-tête d'agent honnête. Aucun contournement, aucune zone
 * protégée.
 */

const AGENT = "CitariBot/1.0 (+https://citari.fr ; prospection B2B ; contact@citari.fr)";

async function page(url: string, timeoutMs = 10000): Promise<string | null> {
  try {
    const res = await fetch(url, {
      headers: { "user-agent": AGENT, accept: "text/html,text/plain,*/*" },
      redirect: "follow",
      signal: AbortSignal.timeout(timeoutMs),
    });
    if (!res.ok) return null;
    const type = res.headers.get("content-type") ?? "";
    if (!/text\/(html|plain)/i.test(type)) return null;
    const brut = await res.text();
    return brut.slice(0, 400_000);
  } catch {
    return null;
  }
}

/** Devine l'origine à interroger : le domaine Apollo, sinon rien. */
function origine(domaine: string): string | null {
  const d = domaine.trim().replace(/^https?:\/\//, "").replace(/\/.*$/, "").toLowerCase();
  if (!d || !d.includes(".")) return null;
  return `https://${d}`;
}

export interface Enrichissement {
  site: string;
  emails: string[];
  mobiles: string[];
  fixes: string[];
  responsable: string | null;
  botsBloques: string[];
  regies: string[];
  pagesLues: number;
}

export async function enrichirDomaine(domaine: string): Promise<Enrichissement | null> {
  const base = origine(domaine);
  if (!base) return null;

  const emails = new Set<string>();
  const mobiles = new Set<string>();
  const fixes = new Set<string>();
  let responsable: string | null = null;
  let regies: string[] = [];
  let pagesLues = 0;

  for (const chemin of CHEMINS_CONTACT) {
    const html = await page(base + chemin);
    if (!html) continue;
    pagesLues++;
    const visible = texteVisible(html);
    for (const e of extraireEmails(html, domaine)) emails.add(e);
    const tels = extraireTelephones(visible);
    for (const t of tels.mobiles) mobiles.add(t);
    for (const t of tels.fixes) fixes.add(t);
    responsable ??= extraireResponsable(visible);
    if (chemin === "/") regies = detecterRegiesPub(html);
    // Assez pour un contact exploitable : on n'insiste pas sur un site poli.
    if (emails.size >= 3 && (mobiles.size || fixes.size) && responsable) break;
    await new Promise((r) => setTimeout(r, 400));
  }
  if (!pagesLues) return null;

  const robots = await page(base + "/robots.txt", 6000);
  return {
    site: base,
    emails: [...emails].slice(0, 6),
    mobiles: [...mobiles].slice(0, 3),
    fixes: [...fixes].slice(0, 3),
    responsable,
    botsBloques: robots ? botsIaBloques(robots) : [],
    regies,
    pagesLues,
  };
}

type Options = { colonne?: string; parallele?: number; max?: number };

export async function enrichir(fichier: string, opts: Options = {}): Promise<void> {
  const contenu = readFileSync(fichier, "utf8").split(/\r?\n/).filter((l) => l.trim());
  const entete = contenu[0]!.split(";");
  const colDomaine = entete.indexOf(opts.colonne ?? "domaine");
  if (colDomaine < 0) throw new Error(`Colonne « ${opts.colonne ?? "domaine"} » absente de ${fichier}.`);

  const lignes = contenu.slice(1).map((l) => {
    // Découpage respectant les champs entre guillemets.
    const champs: string[] = [];
    let courant = "", dansGuillemets = false;
    for (let i = 0; i < l.length; i++) {
      const c = l[i]!;
      if (c === '"') { if (dansGuillemets && l[i + 1] === '"') { courant += '"'; i++; } else dansGuillemets = !dansGuillemets; }
      else if (c === ";" && !dansGuillemets) { champs.push(courant); courant = ""; }
      else courant += c;
    }
    champs.push(courant);
    return champs;
  });

  const aTraiter = lignes.filter((c) => (c[colDomaine] ?? "").trim()).slice(0, opts.max ?? 500);
  const parallele = Math.max(1, Math.min(8, opts.parallele ?? 5));
  console.log(`${aTraiter.length} sites à visiter · ${parallele} en parallèle\n`);

  const resultats = new Map<string, Enrichissement | null>();
  let faits = 0;
  const file = [...aTraiter];
  await Promise.all(
    Array.from({ length: parallele }, async () => {
      for (;;) {
        const champs = file.shift();
        if (!champs) return;
        const domaine = champs[colDomaine]!.trim();
        const r = await enrichirDomaine(domaine);
        resultats.set(domaine, r);
        faits++;
        const marque = r ? [r.emails.length ? `${r.emails.length}@` : "", r.mobiles.length ? "mob" : "", r.fixes.length ? "fixe" : "", r.botsBloques.length ? "🤖bloqué" : ""].filter(Boolean).join(" ") : "injoignable";
        console.log(`  [${String(faits).padStart(3)}/${aTraiter.length}] ${domaine.padEnd(34)} ${marque}`);
      }
    }),
  );

  const nouvelles = ["site_verifie", "emails_site", "email_principal", "mobiles_site", "fixes_site", "responsable_publication", "bots_ia_bloques", "regies_pub"];
  const champCsv = (v: string) => (/[;"\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v);
  const sortie = [[...entete, ...nouvelles].join(";")];
  for (const champs of lignes) {
    const r = resultats.get((champs[colDomaine] ?? "").trim());
    sortie.push(
      [...champs,
        r?.site ?? "",
        r?.emails.join(" ") ?? "",
        r?.emails[0] ?? "",
        r?.mobiles.map(formaterTelephone).join(" ") ?? "",
        r?.fixes.map(formaterTelephone).join(" ") ?? "",
        r?.responsable ?? "",
        r?.botsBloques.join(" ") ?? "",
        r?.regies.join(" ") ?? "",
      ].map(champCsv).join(";"),
    );
  }
  writeFileSync(fichier, sortie.join("\n") + "\n", "utf8");

  const vus = [...resultats.values()].filter(Boolean) as Enrichissement[];
  const avecEmail = vus.filter((r) => r.emails.length).length;
  const avecTel = vus.filter((r) => r.mobiles.length || r.fixes.length).length;
  const avecMobile = vus.filter((r) => r.mobiles.length).length;
  const bloques = vus.filter((r) => r.botsBloques.length).length;
  const pub = vus.filter((r) => r.regies.length).length;
  console.log(`\n${vus.length}/${aTraiter.length} sites joignables`);
  console.log(`  ${avecEmail} avec au moins un email · ${avecTel} avec un téléphone (dont ${avecMobile} mobile)`);
  console.log(`  ${vus.filter((r) => r.responsable).length} avec responsable de publication nommé`);
  console.log(`  🤖 ${bloques} bloquent un robot d'IA — l'accroche la plus vérifiable`);
  console.log(`  💰 ${pub} ont un pixel publicitaire — budget d'acquisition déjà engagé`);
  console.log(`\nÉcrit dans ${fichier}`);
}
