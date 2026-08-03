import { existsSync } from "node:fs";
import { join } from "node:path";
import type { NextConfig } from "next";

/**
 * Les secrets vivent dans le `.env` de la racine, à un seul endroit.
 *
 * Next ne lit que le `.env.local` de son propre dossier. Recopier la clé de
 * service Supabase ici aurait créé un second exemplaire d'un secret, et surtout
 * deux vérités qui divergent : l'admin a tourné en mode démonstration sur des
 * données simulées sans que rien ne le signale ailleurs que dans un bandeau,
 * parce que sa configuration locale n'avait jamais été remise à jour.
 */
const racine = join(process.cwd(), "../../.env");
if (existsSync(racine)) process.loadEnvFile(racine);

const nextConfig: NextConfig = {
  transpilePackages: ["@geo/core"],
};

export default nextConfig;
