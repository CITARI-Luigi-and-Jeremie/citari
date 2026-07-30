#!/usr/bin/env tsx
/**
 * Usine de livraison GEO Sprint — CLI interne du fondateur.
 * Usage : pnpm toolkit <commande> [args]
 */
import { Command } from "commander";
import { auditTechnique } from "./commands/audit-technique.js";
import { generateFixes } from "./commands/generate-fixes.js";
import { contentBrief } from "./commands/content-brief.js";
import { draftContent } from "./commands/draft-content.js";
import { citationTargets } from "./commands/citation-targets.js";
import { sprintReport } from "./commands/sprint-report.js";
import { rescan } from "./commands/rescan.js";

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
