#!/usr/bin/env tsx
/**
 * Usine de livraison Citari — CLI interne du fondateur.
 * Usage : pnpm toolkit <commande> [args]
 */
import { Command } from "commander";
import { auditTechnique } from "./commands/audit-technique.js";
import { generateFixes } from "./commands/generate-fixes.js";
import { contentBrief } from "./commands/content-brief.js";
import { draftContent } from "./commands/draft-content.js";
import { citationTargets } from "./commands/citation-targets.js";
import { verifyFixes } from "./commands/verify-fixes.js";
import { crawlerLog } from "./commands/crawler-log.js";
import { sprintReport } from "./commands/sprint-report.js";
import { relance } from "./commands/relance.js";
import { proposition } from "./commands/proposition.js";
import { rescan } from "./commands/rescan.js";
import { prioriser } from "./commands/prioriser.js";
import { indexnow } from "./commands/indexnow.js";

const program = new Command()
  .name("toolkit")
  .description("Outils de livraison des sprints GEO (Chantiers 1, 2, 3)");

program
  .command("audit-technique")
  .argument("<url>", "URL du site à auditer")
  .option("-c, --client <client>", "rattacher au client (nom ou id)")
  .description("Chantier 1 — crawle le site : robots.txt, llms.txt, schema.org, Hn, meta, latence")
  .action((url: string, opts: { client?: string }) => run(auditTechnique(url, opts)));

program
  .command("generate-fixes")
  .argument("<client>", "nom ou id du client")
  .description("Chantier 1 — robots.txt corrigé, llms.txt, blocs JSON-LD + doc de specs")
  .action((client: string) => run(generateFixes(client)));

program
  .command("prioriser")
  .argument("<client>", "nom ou id du client")
  .description("Chantier 2 — classe les questions perdues par gagnabilité avant J+90 (sans clé API)")
  .action((client: string) => run(prioriser(client)));

program
  .command("indexnow")
  .argument("<client>", "nom ou id du client")
  .argument("<urls...>", "URLs publiées à signaler à Bing/IndexNow")
  .option("--dry-run", "affiche le payload sans l'envoyer")
  .action((client: string, urls: string[], opts: { dryRun?: boolean }) =>
    run(indexnow(client, urls, opts)));

program
  .command("content-brief")
  .argument("<client>", "nom ou id du client")
  .description("Chantier 2 — 4-6 briefs de contenu ciblés sur les requêtes où le client est absent")
  .action((client: string) => run(contentBrief(client)));

program
  .command("draft-content")
  .argument("<client>", "nom ou id du client")
  .argument("<brief-id>", "id du brief (voir content-briefs.md ou l'admin)")
  .description("Chantier 2 — rédige le brouillon complet d'un contenu (relecture obligatoire)")
  .action((client: string, briefId: string) => run(draftContent(client, briefId)));

program
  .command("citation-targets")
  .argument("<client>", "nom ou id du client")
  .description("Chantier 3 — cibles de citation priorisées + brouillons de pitchs presse")
  .action((client: string) => run(citationTargets(client)));

program
  .command("verify-fixes")
  .argument("<client>", "nom ou id du client")
  .description("Contrôle — vérifie que les correctifs livrés sont réellement en ligne")
  .action((client: string) => run(verifyFixes(client)));

program
  .command("crawler-log")
  .argument("<client>", "nom ou id du client")
  .argument("<fichier>", "log d'accès du serveur, format combiné Apache/Nginx")
  .description("Preuve — compte les passages réels des crawlers IA sur le site du client")
  .action((client: string, fichier: string) => run(crawlerLog(client, fichier)));

program
  .command("relance")
  .argument("[lead]", "id, email ou marque du lead")
  .option("-a, --all", "générer la séquence pour tous les leads au statut « new »")
  .description("Commercial — séquence de 3 relances personnalisées (J+2, J+7, J+21) à partir des données du scan")
  .action((lead: string | undefined, opts: { all?: boolean }) => {
    if (!lead && !opts.all) {
      console.error("Précisez un lead, ou utilisez --all pour tous les leads non traités.");
      process.exit(1);
    }
    run(relance(lead ?? "", opts));
  });

program
  .command("proposition")
  .argument("<cible>", "client, lead, email ou id de scan")
  .option("-o, --offer <offre>", "sprint (2 900 €) ou domination (4 900 €)", "sprint")
  .description("Commercial — proposition post-call personnalisée avec les chiffres réels du scan")
  .action((cible: string, opts: { offer?: string }) => run(proposition(cible, opts)));

program
  .command("sprint-report")
  .argument("<client>", "nom ou id du client")
  .description("Semaine 4 — rapport de fin de sprint : actions livrées, citations, re-scan J+90")
  .action((client: string) => run(sprintReport(client)));

program
  .command("rescan")
  .argument("<client>", "nom ou id du client")
  .description("Re-scan J+90 avec les MÊMES requêtes + rapport avant/après")
  .action((client: string) => run(rescan(client)));

function run(p: Promise<void>) {
  p.catch((e) => {
    console.error(`\n✗ ${e instanceof Error ? e.message : e}`);
    process.exit(1);
  });
}

program.parse();
