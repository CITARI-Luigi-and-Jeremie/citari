import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { requireEnv } from "./env";
import { createFakeDb } from "./mock/fakeDb";
import { isMock } from "./mock/mockLlm";

let client: SupabaseClient | null = null;

export function getDb(): SupabaseClient {
  if (isMock()) return createFakeDb() as SupabaseClient;
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
