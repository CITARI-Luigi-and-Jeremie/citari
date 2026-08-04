#!/usr/bin/env bash
# Importe ici le front terminé par Jérémie.
#
# Lovable ne sait pas travailler dans un dépôt existant ni dans un sous-dossier :
# son projet vit donc forcément dans un dépôt à lui. Ce script fait la jonction,
# une fois, à la fin. Pas de synchronisation continue : tant que le front n'est
# pas fini, la suivre n'apporte rien et ajoute une chose à surveiller.
#
#   ./scripts/importer-front.sh https://github.com/<compte>/<depot>.git [branche]
#
# Le code arrive dans apps/front-refonte/ avec son historique. Ensuite on
# remplace les routes et composants de apps/citari, et on branche les fonctions
# serveur à la place des données de démonstration.
set -euo pipefail

cd "$(dirname "$0")/.."

SOURCE="${1:-}"
BRANCHE="${2:-main}"
DOSSIER="apps/front-refonte"

if [[ -z "$SOURCE" ]]; then
  echo "Usage : $0 <url-du-depot-git> [branche]" >&2
  exit 1
fi

if [[ -n "$(git status --porcelain)" ]]; then
  echo "Le dépôt a des modifications non validées. Committez-les d'abord." >&2
  exit 1
fi

if [[ -d "$DOSSIER" ]]; then
  git subtree pull --prefix="$DOSSIER" "$SOURCE" "$BRANCHE" -m "Front : mise à jour depuis Lovable"
else
  git subtree add --prefix="$DOSSIER" "$SOURCE" "$BRANCHE"
fi

echo
echo "Importé dans $DOSSIER. Poussez avec : git push origin main"
