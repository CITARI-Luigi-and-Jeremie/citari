# Schéma de la base

La vérité vit dans le projet Supabase `ebcuhuhslrrsjouchiga` (Paris, eu-west-3),
et les migrations y sont appliquées directement.

`schema.sql` en est un **instantané fidèle**, exporté depuis la base réelle.
Il existe pour une seule raison : pouvoir tout reconstruire si le projet
Supabase était perdu. Sans lui, le dépôt ne contient aucune description de la
base et quatre mois de structure ne tiendraient qu'à un compte hébergé.

Les anciens fichiers `0001_init.sql`, `0002_seed_directories.sql` et
`0003_follow_ups.sql` ont été supprimés : ils décrivaient le schéma d'avant la
reprise du schéma Lovable et ne correspondaient plus à rien. Un fichier de
migration qui ment est pire que pas de fichier du tout.

## Régénérer cet instantané

Après toute migration, réexporter depuis la base plutôt que d'éditer ce fichier
à la main.

## Ce que l'instantané ne contient pas

Les données : les 57 annuaires de `directories` sont un jeu de départ, pas du
schéma. Et les politiques RLS : les 16 tables ont RLS actif **sans aucune
policy**, ce qui vaut refus total. C'est voulu, tout passe par la clé de
service côté serveur.
