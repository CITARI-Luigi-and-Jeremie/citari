import { getDb, unwrap } from "@geo/core";
import { resolveClient } from "../lib/context.js";

/**
 * Relire, et corriger, le classement des concurrents d'un scan.
 *
 * Le classement automatique devine bien, mais il devine. Personne n'avait
 * encore relu une seule de ses décisions, et c'est un jugement de métier :
 * savoir si tel cabinet est un rival atteignable ou un groupe hors de portée
 * relève de Luigi et Jérémie, pas d'un modèle.
 *
 * Cette commande sert les deux temps de cette relecture. Sans argument, elle
 * affiche le classement rangé par catégorie, lisible d'un coup d'œil. Avec
 * `--corriger`, elle enregistre une décision humaine qui s'appliquera à tous
 * les scans suivants et que le modèle ne pourra plus contredire.
 *
 *   pnpm toolkit concurrents Dougs
 *   pnpm toolkit concurrents Dougs --corriger "Endrix=geant"
 *   pnpm toolkit concurrents Dougs --corriger "Pennylane=rival" --secteur
 */
const LIBELLES: Record<string, string> = {
  rival: "RIVAUX — vos vrais concurrents, ceux que vous pouvez dépasser",
  geant: "GÉANTS — hors de portée d'une PME, à ne pas viser",
  outil: "OUTILS — logiciels et plateformes, pas des prestataires",
  institution: "INSTITUTIONS — ordres, chambres, administrations",
};
const CLASSES = Object.keys(LIBELLES);

/** Clé de correction : « Exco Lyon » et « exco-lyon » ne doivent pas différer. */
function cleMarque(nom: string): string {
  return nom
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]/g, "");
}

export async function concurrents(
  clientRef: string,
  opts: { corriger?: string[]; secteur?: boolean } = {},
): Promise<void> {
  const client = await resolveClient(clientRef);
  if (!client.initialScanId) throw new Error(`${client.brand} n'a pas de scan initial rattaché.`);
  const db = getDb();

  const scan = unwrap(
    await db
      .from("scans")
      .select("sector, concurrent_classes, brand_aliases, share_of_voice, concurrents_suivis")
      .eq("id", client.initialScanId)
      .single(),
  ) as {
    sector: string | null;
    concurrent_classes: Record<string, string> | null;
    brand_aliases: Record<string, string> | null;
    share_of_voice: { name: string; count: number; target: boolean; variantes?: string[] }[] | null;
    concurrents_suivis: { saisi: string; releve: string | null; citations: number }[] | null;
  };

  // Enregistrement des corrections demandées.
  for (const brut of opts.corriger ?? []) {
    const [nom, classe] = brut.split("=").map((x) => x?.trim());
    if (!nom || !classe || !CLASSES.includes(classe)) {
      throw new Error(`Correction invalide : « ${brut} ». Attendu « Marque=${CLASSES.join("|")} ».`);
    }
    // `secteur` limite la portée : Pennylane est un outil pour un cabinet
    // traditionnel et un rival pour un cabinet en ligne. Sans l'option, la
    // correction vaut partout.
    // Chaîne vide = vaut pour tous les secteurs. Un NULL aurait été plus
    // parlant, mais deux NULL sont distincts pour Postgres et l'unicité ne
    // tiendrait pas.
    const secteur = opts.secteur ? (scan.sector ?? "") : "";
    unwrap(
      await db
        .from("brand_overrides")
        .upsert(
          { brand_key: cleMarque(nom), brand_label: nom, sector: secteur, classe },
          { onConflict: "brand_key,sector" },
        )
        .select("id"),
    );
    console.log(
      `✓ ${nom} → ${classe}${secteur ? ` (secteur « ${secteur} » uniquement)` : " (partout)"}`,
    );
  }
  if (opts.corriger?.length) {
    console.log(
      `\nLes corrections s'appliqueront aux prochains scans. Relancez le scan pour les voir ici.\n`,
    );
  }

  const classes = scan.concurrent_classes ?? {};
  const pdv = scan.share_of_voice ?? [];
  const comptes = new Map(pdv.map((p) => [p.name, p.count]));

  const corrections = unwrap(await db.from("brand_overrides").select("brand_key, classe, sector")) as {
    brand_key: string;
    classe: string;
    sector: string;
  }[];
  const corrigee = (nom: string) =>
    corrections.some((c) => c.brand_key === cleMarque(nom) && (c.sector === "" || c.sector === scan.sector));

  console.log(`\nClassement des concurrents — ${client.brand}\n`);

  for (const classe of CLASSES) {
    const noms = Object.entries(classes)
      .filter(([, c]) => c === classe)
      .map(([nom]) => nom)
      .sort((a, b) => (comptes.get(b) ?? 0) - (comptes.get(a) ?? 0));
    if (noms.length === 0) continue;
    console.log(`  ${LIBELLES[classe]}`);
    for (const nom of noms) {
      const n = comptes.get(nom);
      const variantes = pdv.find((p) => p.name === nom)?.variantes;
      console.log(
        `    ${n ? String(n).padStart(3) : "  ."}  ${nom}${corrigee(nom) ? "  [corrigé à la main]" : ""}` +
          (variantes?.length ? `\n         regroupe : ${variantes.join(", ")}` : ""),
      );
    }
    console.log();
  }

  const suivis = scan.concurrents_suivis ?? [];
  if (suivis.length) {
    console.log("  CONCURRENTS QUE LE PROSPECT A NOMMÉS");
    for (const c of suivis) {
      console.log(`    ${String(c.citations).padStart(3)}  ${c.saisi}${c.releve ? "" : "  (jamais cité)"}`);
    }
    console.log();
  }

  console.log(`Un classement vous paraît faux ? Corrigez-le, il tiendra pour tous les scans :`);
  console.log(`  pnpm toolkit concurrents ${clientRef} --corriger "Nom de l'entreprise=geant"`);
}
