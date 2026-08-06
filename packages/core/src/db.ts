import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { requireEnv } from "./env";

let client: SupabaseClient | null = null;

/**
 * La vraie base, toujours. Il n'y a plus de base simulée derrière cette
 * fonction, et il ne doit pas y en avoir.
 *
 * `getDb()` renvoyait une fausse base dès que `GEO_MOCK=1` traînait dans
 * l'environnement. C'est la fonction qu'utilise le toolkit pour rédiger les
 * relances : une variable oubliée suffisait donc à produire des emails
 * remplis de chiffres inventés, prêts à partir à de vrais prospects, sans
 * qu'aucun message ne signale quoi que ce soit. Le piège avait déjà mordu une
 * fois, l'admin ayant tourné des semaines sur des données simulées avec le mot
 * de passe « demo ».
 *
 * Une base absente doit échouer bruyamment, jamais se remplacer en silence.
 */
export function getDb(): SupabaseClient {
  if (!client) {
    client = createClient(requireEnv("SUPABASE_URL"), requireEnv("SUPABASE_SERVICE_ROLE_KEY"), {
      auth: { persistSession: false },
    });
  }
  return client;
}

/** Échoue bruyamment sur toute erreur Supabase — jamais d'erreur avalée. */
export function unwrap<T>(res: { data: T | null; error: { message: string } | null }): T {
  if (res.error) throw new Error(`Supabase: ${res.error.message}`);
  if (res.data === null) throw new Error("Supabase: data null");
  return res.data;
}
