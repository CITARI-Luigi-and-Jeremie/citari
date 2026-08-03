/**
 * Pilote de scans, exécuté dans apps/citari.
 *
 * Le moteur de mesure vit dans le dépôt du site et utilise l'alias « @/ »,
 * que tsx ne résout qu'avec ce dossier pour racine. Plutôt que de bricoler
 * des correspondances de chemins depuis le toolkit, on lance ce fichier en
 * sous-processus avec le bon dossier courant. La frontière reste nette :
 * le toolkit orchestre, le site mesure.
 *
 * Entrée  : un JSON sur argv[2] — { cibles, secteur, ville, mode }
 * Sortie  : une ligne JSON par entreprise sur la sortie standard, préfixée
 *           « RESULT », pour que la progression reste lisible en direct.
 */
type Cible = { nom: string; site: string | null };

const params = JSON.parse(process.argv[2] ?? "{}") as {
  cibles: Cible[];
  secteur: string;
  ville: string | null;
  mode: "apercu" | "complet";
  parallele: number;
};

const { creerScan, avancerScan, etatScan, teaserScan } = (await import(
  new URL("./src/lib/orchestrateur.server.ts", `file://${process.cwd()}/`).href
)) as any;

async function traiter(cible: Cible) {
  try {
    const scan = await creerScan({
      marque: cible.nom,
      url: cible.site,
      secteur: params.secteur,
      ville: params.ville,
      concurrents: [],
      langue: "fr",
      ipHash: "scan-lot",
      mode: params.mode,
    });
    // On pilote la collecte exactement comme le fait le navigateur.
    for (let tour = 0; tour < 40; tour++) {
      await avancerScan(scan.id);
      const etat = await etatScan(scan.id);
      if (!etat || etat.status !== "running") break;
    }
    const t = await teaserScan(scan.id);
    if (!t) return { ...cible, scanId: scan.id, erreur: "scan non terminé" };
    return {
      ...cible,
      scanId: scan.id,
      score: t.score,
      cite: t.comptage.citationsCible,
      concurrents: t.comptage.citationsConcurrents,
      perdues: t.comptage.questionsPerdues,
      botsBloques: t.aguiches.botsBloques ?? [],
    };
  } catch (e) {
    return { ...cible, erreur: e instanceof Error ? e.message : "erreur inconnue" };
  }
}

// File d'attente à parallélisme borné : au-delà de 3, les API renvoient des 429.
const file = [...params.cibles];
await Promise.all(
  Array.from({ length: Math.max(1, Math.min(5, params.parallele)) }, async () => {
    for (;;) {
      const cible = file.shift();
      if (!cible) return;
      console.log("RESULT " + JSON.stringify(await traiter(cible)));
    }
  }),
);
