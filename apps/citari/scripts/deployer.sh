#!/usr/bin/env bash
# Déploiement du site Citari sur Cloudflare Workers.
#
# Le build nitro génère .output/server/wrangler.json avec un nom de worker
# dérivé du chemin du dépôt (« luigirevelli-sprint-voice-insight-apps-citari »),
# qui deviendrait le sous-domaine public. On le remplace par « citari ».
#
# Les secrets ne sont JAMAIS dans ce dépôt ni dans ce script : ils sont posés
# une fois pour toutes dans Cloudflare (voir docs/DEPLOIEMENT.md), et le worker
# les lit dans process.env grâce au drapeau nodejs_compat.
set -euo pipefail

cd "$(dirname "$0")/.."

NOM="${CF_WORKER_NAME:-citari}"

echo "Construction…"
npx vite build

# Renommage du worker dans la configuration générée.
python3 - "$NOM" <<'PY'
import json, pathlib, sys
p = pathlib.Path(".output/server/wrangler.json")
d = json.loads(p.read_text())
d["name"] = sys.argv[1]
p.write_text(json.dumps(d, indent=2))
print(f"Worker nommé « {d['name'] } »")
PY

echo "Déploiement…"
npx wrangler deploy --config .output/server/wrangler.json

cat <<'FIN'

Déployé. Deux choses à vérifier une seule fois, après le tout premier déploiement :

  1. Les secrets sont bien posés côté Cloudflare :
       npx wrangler secret list --config .output/server/wrangler.json
     Il en faut huit : les six clés moteurs, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY.

  2. NEXT_PUBLIC_SITE_URL pointe sur le domaine public et non sur localhost,
     sinon les liens de rapport envoyés par email seront inutilisables.
FIN
