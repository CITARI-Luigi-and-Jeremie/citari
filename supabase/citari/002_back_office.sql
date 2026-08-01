-- Citari — complément au schéma posé depuis Lovable.
--
-- À exécuter APRÈS la migration Lovable (20260731153127…). Ajoute ce dont
-- l'usine de livraison a besoin et qui manque au schéma initial, plus la base
-- d'annuaires.
--
-- Chaque bloc est idempotent : on peut le rejouer sans casse.

-- ─────────────────────────────────────────────────────────────
-- 1. Le site du client — indispensable et manquant
--
-- audit-technique, generate-fixes et verify-fixes travaillent tous sur l'URL
-- du site client. `clients` ne la porte pas : elle n'existe que sur le scan
-- initial, et un client peut changer de domaine en cours de mission.
-- ─────────────────────────────────────────────────────────────
alter table public.clients add column if not exists website_url text;
alter table public.clients add column if not exists sector text;

-- Le rappel de re-scan J+90 porte sur le sprint (`sprints.rescan_due_on`),
-- pas sur le client : un même client peut enchaîner plusieurs sprints.
alter table public.sprints add column if not exists rescan_reminder_sent boolean not null default false;

comment on column public.clients.website_url is
  'Site sur lequel travaille l''usine de livraison. Renseigné à la conversion du lead depuis scans.website_url, modifiable ensuite.';

-- ─────────────────────────────────────────────────────────────
-- 2. Grok — cinquième moteur
--
-- Le front annonce cinq moteurs, le schéma n'en score que quatre.
-- ─────────────────────────────────────────────────────────────
alter table public.scans add column if not exists score_grok numeric;
-- Le Chat (Mistral) : sixième moteur. Colonne nommée d'après l'éditeur,
-- plus stable qu'un nom de produit ; l'étiquette affichée reste « Le Chat ».
alter table public.scans add column if not exists score_mistral numeric;

-- ─────────────────────────────────────────────────────────────
-- 3. Traçabilité des livrables produits en local
--
-- Le toolkit écrit ses fichiers dans deliverables/<client>/. On garde le
-- chemin local en plus de l'URL publique, et la charge utile structurée
-- (briefs, listes de cibles) que les commandes se repassent entre elles.
-- ─────────────────────────────────────────────────────────────
alter table public.deliverables add column if not exists local_path text;
alter table public.deliverables add column if not exists data jsonb;
alter table public.deliverables add column if not exists client_id uuid references public.clients(id) on delete cascade;

create index if not exists deliverables_client_idx on public.deliverables (client_id);

comment on column public.deliverables.client_id is
  'Redondant avec sprint_id, mais le toolkit raisonne par client : un audit peut précéder la création du sprint.';

-- ─────────────────────────────────────────────────────────────
-- 4. Passages des crawlers IA — la preuve dure
--
-- Alimenté par `pnpm toolkit crawler-log`. Un site qui passe de 0 à 40 visites
-- de GPTBot par semaine est devenu lisible, indépendamment du score.
-- ─────────────────────────────────────────────────────────────
create table if not exists public.crawler_hits (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients(id) on delete cascade,
  measured_on date not null default current_date,
  period_start date,
  period_end date,
  bot text not null,
  hits int not null default 0,
  errors int not null default 0,
  created_at timestamptz not null default now()
);
create index if not exists crawler_hits_client_idx on public.crawler_hits (client_id, measured_on desc);

alter table public.crawler_hits enable row level security;
grant all on public.crawler_hits to service_role;

-- ─────────────────────────────────────────────────────────────
-- 5. Base d'annuaires francophones — actif réutilisable
--
-- Point de départ du chantier citations. S'enrichit à chaque mission.
-- ⚠ Vérifier chaque URL avant la première utilisation client : les plateformes
--   changent de domaine et de politique d'inscription.
-- ─────────────────────────────────────────────────────────────
-- Unicité sur (secteur, url) et non sur url seule : un annuaire généraliste
-- comme TripAdvisor sert légitimement plusieurs secteurs. C'est cet index qui
-- rend le `on conflict do nothing` ci-dessous opérant, donc le seed rejouable.
create unique index if not exists directories_sector_url_uidx
  on public.directories (sector, url);

insert into public.directories (sector, name, url, kind, authority_note) values
-- Tous secteurs
('tous', 'Google Business Profile', 'https://www.google.com/business/', 'fiche', 'Priorité absolue en local. Fiche complète + avis = source très citée.'),
('tous', 'Pages Jaunes', 'https://www.pagesjaunes.fr', 'annuaire', 'Inscription gratuite, forte autorité en France.'),
('tous', 'Trustpilot', 'https://fr.trustpilot.com', 'avis', 'Très fréquemment cité par Perplexity sur les requêtes de confiance.'),
('tous', 'Societe.com', 'https://www.societe.com', 'annuaire', 'Fiche automatique via INSEE — à vérifier et compléter.'),
('tous', 'LinkedIn (page entreprise)', 'https://www.linkedin.com/company/setup/new/', 'fiche', 'Description factuelle et secteur renseigné.'),
('tous', 'Wikidata', 'https://www.wikidata.org', 'fiche', 'Source structurée reprise par plusieurs moteurs. Exige des sources secondaires.'),
('tous', 'Europages', 'https://www.europages.fr', 'annuaire', 'Annuaire B2B européen, utile à l''export.'),
('tous', 'Kompass', 'https://fr.kompass.com', 'annuaire', 'Annuaire B2B international.'),
-- SaaS / Logiciel
('SaaS / Logiciel', 'G2', 'https://www.g2.com', 'comparateur', 'Référence mondiale du B2B software, très citée sur les comparaisons.'),
('SaaS / Logiciel', 'Capterra', 'https://www.capterra.fr', 'comparateur', 'Gartner. Bon référencement FR sur « meilleur logiciel X ».'),
('SaaS / Logiciel', 'GetApp', 'https://www.getapp.fr', 'comparateur', 'Groupe Gartner.'),
('SaaS / Logiciel', 'Software Advice', 'https://www.softwareadvice.fr', 'comparateur', 'Groupe Gartner.'),
('SaaS / Logiciel', 'Appvizer', 'https://www.appvizer.fr', 'comparateur', 'Comparateur français, très présent sur les requêtes FR.'),
('SaaS / Logiciel', 'Product Hunt', 'https://www.producthunt.com', 'comparateur', 'Utile au lancement, notoriété durable.'),
('SaaS / Logiciel', 'Crunchbase', 'https://www.crunchbase.com', 'fiche', 'Fiche société, levées — cité sur les requêtes de confiance.'),
-- Agences
('Agence marketing / communication', 'Sortlist', 'https://www.sortlist.fr', 'comparateur', 'Place de marché agences, citée sur « meilleure agence X ».'),
('Agence marketing / communication', 'Clutch', 'https://clutch.co', 'comparateur', 'Référence internationale, avis vérifiés par entretien.'),
('Agence marketing / communication', 'La Fabrique du Net', 'https://www.lafabriquedunet.fr', 'comparateur', 'Comparateur et classements d''agences.'),
-- Immobilier
('Immobilier', 'SeLoger', 'https://www.seloger.com', 'comparateur', 'Portail dominant, forte autorité.'),
('Immobilier', 'Bien''ici', 'https://www.bienici.com', 'comparateur', 'Portail majeur, fiches agences.'),
('Immobilier', 'MeilleursAgents', 'https://www.meilleursagents.com', 'comparateur', 'Classement et avis d''agences.'),
('Immobilier', 'Logic-Immo', 'https://www.logic-immo.com', 'comparateur', 'Portail national.'),
-- BTP / Artisanat
('BTP / Artisanat', 'Travaux.com', 'https://www.travaux.com', 'comparateur', 'Mise en relation et avis clients.'),
('BTP / Artisanat', 'Quotatis', 'https://www.quotatis.fr', 'comparateur', 'Devis travaux, fiches artisans.'),
('BTP / Artisanat', 'Houzz', 'https://www.houzz.fr', 'comparateur', 'Fort sur rénovation et aménagement, portfolio visuel.'),
('BTP / Artisanat', 'Chambre de Métiers et de l''Artisanat', 'https://www.artisanat.fr', 'annuaire', 'Annuaire officiel — gage de sérieux.'),
-- Santé
('Santé / Clinique / Praticien', 'Doctolib', 'https://www.doctolib.fr', 'annuaire', 'Incontournable. Fiche praticien détaillée.'),
('Santé / Clinique / Praticien', 'Annuaire santé Ameli', 'https://annuairesante.ameli.fr', 'annuaire', 'Annuaire officiel de l''Assurance Maladie.'),
-- Juridique
('Cabinet d''avocats', 'Avocat.fr (CNB)', 'https://www.avocat.fr', 'annuaire', 'Annuaire officiel du Conseil National des Barreaux.'),
('Cabinet d''avocats', 'Village de la Justice', 'https://www.village-justice.com', 'presse', 'Média juridique — publication de tribunes possible.'),
('Cabinet d''avocats', 'Justifit', 'https://www.justifit.fr', 'comparateur', 'Mise en relation, fiches par spécialité.'),
-- Comptabilité
('Expertise comptable', 'Annuaire de l''Ordre des experts-comptables', 'https://annuaire.experts-comptables.org', 'annuaire', 'Annuaire officiel — autorité sur les requêtes de confiance.'),
('Expertise comptable', 'Compta Online', 'https://www.compta-online.com', 'presse', 'Communauté et média du chiffre, tribunes possibles.'),
-- Restauration / Hôtellerie
('Restauration', 'TheFork', 'https://www.thefork.fr', 'comparateur', 'Réservation + avis, très cité en local.'),
('Restauration', 'TripAdvisor', 'https://www.tripadvisor.fr', 'avis', 'Massivement repris par les moteurs.'),
('Restauration', 'Guide Michelin', 'https://guide.michelin.com/fr', 'annuaire', 'Sélection éditoriale, forte autorité si éligible.'),
('Hôtellerie / Tourisme', 'Booking.com', 'https://www.booking.com', 'comparateur', 'Incontournable, avis structurés.'),
('Hôtellerie / Tourisme', 'TripAdvisor', 'https://www.tripadvisor.fr', 'avis', 'Idem restauration.'),
-- RH
('RH / Recrutement', 'Welcome to the Jungle', 'https://www.welcometothejungle.com', 'fiche', 'Page entreprise riche, très bien référencée.'),
('RH / Recrutement', 'Glassdoor', 'https://www.glassdoor.fr', 'avis', 'Avis employés — pèse sur les requêtes de confiance.'),
('RH / Recrutement', 'Indeed', 'https://fr.indeed.com', 'annuaire', 'Page entreprise + avis.'),
-- Formation
('Formation / Éducation', 'Mon Compte Formation', 'https://www.moncompteformation.gouv.fr', 'annuaire', 'Référencement officiel (Qualiopi requis) — fort signal de confiance.'),
('Formation / Éducation', 'Kelformation', 'https://www.kelformation.com', 'comparateur', 'Comparateur de formations.'),
('Formation / Éducation', 'Diplomeo', 'https://diplomeo.com', 'comparateur', 'Orientation et comparaison d''écoles.'),
-- Finance
('Finance / Assurance', 'LeLynx.fr', 'https://www.lelynx.fr', 'comparateur', 'Comparateur d''assurances grand public.'),
('Finance / Assurance', 'Assurland', 'https://www.assurland.com', 'comparateur', 'Comparateur historique.'),
('Finance / Assurance', 'Meilleurtaux', 'https://www.meilleurtaux.com', 'comparateur', 'Crédit et assurance emprunteur.'),
('Finance / Assurance', 'ORIAS', 'https://www.orias.fr', 'annuaire', 'Registre officiel des intermédiaires — obligatoire et crédibilisant.'),
-- E-commerce
('E-commerce', 'Avis Vérifiés', 'https://www.avis-verifies.com', 'avis', 'Avis certifiés AFNOR, repris par les moteurs.'),
('E-commerce', 'Trusted Shops', 'https://www.trustedshops.fr', 'avis', 'Label de confiance e-commerce européen.'),
('E-commerce', 'Les Numériques', 'https://www.lesnumeriques.com', 'presse', 'Tests produits — citations à fort poids sur les requêtes d''achat.'),
-- Associations
('Association / ONG', 'HelloAsso', 'https://www.helloasso.com', 'annuaire', 'Fiche association, dons.'),
('Association / ONG', 'Journal Officiel des associations', 'https://www.journal-officiel.gouv.fr/pages/associations-recherche/', 'annuaire', 'Publication officielle — existence légale.')
on conflict do nothing;

-- ─────────────────────────────────────────────────────────────
-- 6. Progression du scan
--
-- Le schéma porte `status` et `phase` mais pas de pourcentage. Le runner en
-- calcule un (réponses collectées / attendues) et l'écran d'attente l'affiche.
-- Colonne ignorable par le front s'il préfère le dériver lui-même.
-- ─────────────────────────────────────────────────────────────
alter table public.scans add column if not exists progress int not null default 0;
