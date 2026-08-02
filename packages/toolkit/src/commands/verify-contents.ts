import { fetchText, normalizeBase } from "../lib/crawl.js";
import { recordDeliverable, requireUrl, resolveClient, slugify, writeDeliverableFile } from "../lib/context.js";

/**
 * Chantier 2, la preuve : les contenus livrés sont-ils RÉELLEMENT publiés ?
 *
 * Pour chaque URL de contenu : la page répond, elle porte du JSON-LD
 * (schema.org), et le llms.txt du site la référence. Trois conditions pour
 * qu'un moteur puisse la trouver, la lire et la citer.
 */

type Verif = { url: string; enLigne: boolean; jsonLd: boolean; dansLlms: boolean | null };

export function analyserContenu(html: string): { jsonLd: boolean } {
  return { jsonLd: /<script[^>]+application\/ld\+json/i.test(html) };
}

export async function verifyContents(clientRef: string, urls: string[]): Promise<void> {
  const client = await resolveClient(clientRef);
  const slug = slugify(client.brand);
  if (urls.length === 0) {
    throw new Error("Aucune URL fournie. Usage : pnpm toolkit verify-contents <client> <url> [url…]");
  }
  const base = normalizeBase(requireUrl(client));
  const llms = await fetchText(`${base}/llms.txt`);

  const verifs: Verif[] = [];
  for (const url of urls) {
    const html = await fetchText(url);
    const enLigne = html !== null;
    verifs.push({
      url,
      enLigne,
      jsonLd: enLigne ? analyserContenu(html as string).jsonLd : false,
      dansLlms: llms === null ? null : llms.includes(new URL(url).pathname),
    });
  }

  const ok = verifs.filter((v) => v.enLigne && v.jsonLd && v.dansLlms !== false).length;
  const md = `# Vérification des contenus publiés — ${client.brand}

${ok}/${verifs.length} contenus pleinement en ordre, le ${new Date().toLocaleDateString("fr-FR")}.

| URL | En ligne | JSON-LD | Dans llms.txt |
|---|---|---|---|
${verifs
  .map(
    (v) =>
      `| ${v.url} | ${v.enLigne ? "✓" : "✗"} | ${v.jsonLd ? "✓" : "✗ balisage absent"} | ${
        v.dansLlms === null ? "llms.txt introuvable" : v.dansLlms ? "✓" : "✗ à ajouter"
      } |`
  )
  .join("\n")}

Un ✗ dans « En ligne » ou « JSON-LD » signifie qu'un moteur ne peut pas citer
cette page correctement : à corriger avant de considérer le chantier livré.
`;

  const path = writeDeliverableFile(slug, "verification-contenus.md", md);
  await recordDeliverable(client.id, "contenus_verifies", `${ok}/${verifs.length} contenus vérifiés en ligne`, path, {
    ok,
    total: verifs.length,
  });

  console.log(`\n${ok}/${verifs.length} contenus pleinement en ordre.`);
  for (const v of verifs) {
    console.log(
      `  ${v.enLigne ? "✓" : "✗"} en ligne · ${v.jsonLd ? "✓" : "✗"} JSON-LD · ${
        v.dansLlms === null ? "? llms.txt" : v.dansLlms ? "✓ llms.txt" : "✗ llms.txt"
      }  ${v.url}`
    );
  }
  console.log(`→ ${path}`);
}
