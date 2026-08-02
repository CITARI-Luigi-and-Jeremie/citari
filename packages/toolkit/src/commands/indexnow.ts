import { randomBytes } from "node:crypto";
import { getDb, unwrap } from "@geo/core";
import { requireUrl, resolveClient } from "../lib/context.js";

/**
 * Chantier 2 — ping IndexNow après publication.
 *
 * La recherche de ChatGPT tourne sur Bing, et Bing indexe en heures les URLs
 * signalées via IndexNow au lieu de semaines. Dans une fenêtre de 90 jours,
 * c'est la différence entre un contenu qui compte au re-scan et un contenu
 * encore invisible. Coût : zéro. Presque personne ne le fait en France.
 *
 * Protocole : une clé par site, hébergée dans <racine>/<clé>.txt, puis un POST
 * à api.indexnow.org avec la liste d'URLs. La clé est générée ici et stockée
 * dans client_data ; le fichier à héberger fait partie des correctifs.
 */
export async function indexnow(
  clientRef: string,
  urls: string[],
  opts: { dryRun?: boolean } = {}
): Promise<void> {
  const client = await resolveClient(clientRef);
  const site = requireUrl(client);
  const host = new URL(site.startsWith("http") ? site : `https://${site}`).hostname;
  const db = getDb();

  if (urls.length === 0) {
    throw new Error("Aucune URL fournie. Usage : pnpm toolkit indexnow <client> <url> [url…]");
  }
  const hors = urls.filter((u) => {
    try {
      return new URL(u).hostname.replace(/^www\./, "") !== host.replace(/^www\./, "");
    } catch {
      return true;
    }
  });
  if (hors.length > 0) {
    throw new Error(`URLs hors du domaine ${host} : ${hors.join(", ")}`);
  }

  // Clé IndexNow du client : générée une fois, stockée dans client_data.
  const CLEF = "indexnow_key";
  const existante = unwrap(
    await db.from("client_data").select("value").eq("client_id", client.id).eq("key", CLEF)
  ) as { value: string }[];
  let cle = existante[0]?.value;
  if (!cle) {
    cle = randomBytes(16).toString("hex");
    await db.from("client_data").insert({ client_id: client.id, key: CLEF, value: cle });
    console.log(`Clé IndexNow générée pour ${client.brand}.`);
  }

  // Le fichier de clé doit être en ligne, sinon Bing ignore le ping.
  const urlCle = `https://${host}/${cle}.txt`;
  let cleEnLigne = false;
  try {
    const r = await fetch(urlCle, { signal: AbortSignal.timeout(8000) });
    cleEnLigne = r.ok && (await r.text()).trim() === cle;
  } catch {
    /* injoignable */
  }
  if (!cleEnLigne) {
    console.log(`⚠ Le fichier de clé n'est pas en ligne : ${urlCle}`);
    console.log(`  À déposer à la racine du site, contenant exactement : ${cle}`);
    console.log(`  (à ajouter au cahier des correctifs du chantier technique)`);
    if (!opts.dryRun) {
      console.log("  Ping annulé : il serait ignoré par Bing tant que la clé n'est pas hébergée.");
      return;
    }
  }

  const payload = { host, key: cle, keyLocation: urlCle, urlList: urls };
  if (opts.dryRun) {
    console.log("── dry-run : payload qui serait envoyé à api.indexnow.org ──");
    console.log(JSON.stringify(payload, null, 2));
    return;
  }

  const res = await fetch("https://api.indexnow.org/indexnow", {
    method: "POST",
    headers: { "content-type": "application/json; charset=utf-8" },
    body: JSON.stringify(payload),
    signal: AbortSignal.timeout(10000),
  });
  // 200 = accepté, 202 = accepté (clé à re-vérifier côté Bing)
  if (res.status === 200 || res.status === 202) {
    console.log(`✓ ${urls.length} URL(s) signalée(s) à IndexNow (HTTP ${res.status}).`);
    console.log("  Bing (et donc la recherche de ChatGPT) les verra sous quelques heures.");
  } else {
    throw new Error(`IndexNow a répondu HTTP ${res.status} : ${await res.text()}`);
  }
}
