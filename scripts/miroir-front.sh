#!/usr/bin/env bash
# Rapatrie dans ce dépôt le front que Jérémie construit sur Lovable.
#
# Pourquoi ce script existe : Lovable ne sait pas se connecter à un dépôt
# existant, et ne synchronise que la racine d'un dépôt, jamais un sous-dossier.
# Son projet vit donc forcément dans `citari-ai-audit`, et c'est la seule chose
# du projet qui ne peut pas être poussée directement ici.
#
# Le miroir résout ça : son travail arrive dans `apps/front-refonte/`, avec son
# historique, sans qu'il ait rien à changer à sa façon de travailler. Rien ne
# repart jamais vers son dépôt, la copie est à sens unique.
#
# Quand sa refonte est terminée, `apps/front-refonte` remplace les routes et
# composants de `apps/citari`, et `citari-ai-audit` devient jetable.
set -euo pipefail

cd "$(dirname "$0")/.."

SOURCE="https://github.com/LuigiRevelli/citari-ai-audit.git"
DOSSIER="apps/front-refonte"
BRANCHE="main"

if [[ -n "$(git status --porcelain)" ]]; then
  echo "Le dépôt a des modifications non validées. Committez avant de synchroniser." >&2
  exit 1
fi

if [[ -d "$DOSSIER" ]]; then
  echo "Mise à jour de $DOSSIER…"
  git subtree pull --prefix="$DOSSIER" "$SOURCE" "$BRANCHE" -m "Front (Lovable) : synchronisation"
else
  echo "Première importation dans $DOSSIER…"
  git subtree add --prefix="$DOSSIER" "$SOURCE" "$BRANCHE"
fi

echo
echo "Fait. Poussez avec : git push origin main"
