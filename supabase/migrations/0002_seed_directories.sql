-- Base d'annuaires, comparateurs et plateformes d'avis francophones (Chantier 3).
-- Actif réutilisable : `citation-targets` s'en sert pour enrichir les cibles de chaque client,
-- et l'enrichit en retour à chaque sprint.
--
-- ⚠ Amorçage manuel : vérifier chaque URL avant la première utilisation client
--   (les plateformes changent de domaine et de politique d'inscription).

insert into directories (sector, name, url, type, notes) values

-- ─── Tous secteurs : les fondamentaux ───────────────────────────────────
('tous', 'Google Business Profile', 'https://www.google.com/business/', 'fiche', 'Priorité absolue en local. Fiche complète + avis = source très citée par les moteurs.'),
('tous', 'Pages Jaunes', 'https://www.pagesjaunes.fr', 'annuaire', 'Inscription gratuite. Forte autorité de domaine en France.'),
('tous', 'Trustpilot', 'https://fr.trustpilot.com', 'avis', 'Très fréquemment cité par Perplexity sur les requêtes de confiance.'),
('tous', 'Societe.com', 'https://www.societe.com', 'annuaire', 'Fiche automatique via INSEE — vérifier et compléter les informations.'),
('tous', 'LinkedIn (page entreprise)', 'https://www.linkedin.com/company/setup/new/', 'fiche', 'Page complète avec description factuelle et secteur renseigné.'),
('tous', 'Wikidata', 'https://www.wikidata.org', 'fiche', 'Élément Wikidata = source structurée reprise par plusieurs moteurs. Exige des sources secondaires.'),
('tous', 'Europages', 'https://www.europages.fr', 'annuaire', 'Annuaire B2B européen, utile à l''export.'),
('tous', 'Kompass', 'https://fr.kompass.com', 'annuaire', 'Annuaire B2B international, fiche détaillée par activité.'),

-- ─── SaaS / Logiciel ────────────────────────────────────────────────────
('SaaS / Logiciel', 'G2', 'https://www.g2.com', 'comparateur', 'Référence mondiale du B2B software — très citée par les IA sur les comparaisons.'),
('SaaS / Logiciel', 'Capterra', 'https://www.capterra.fr', 'comparateur', 'Gartner. Bon référencement FR sur les requêtes "meilleur logiciel X".'),
('SaaS / Logiciel', 'GetApp', 'https://www.getapp.fr', 'comparateur', 'Groupe Gartner, même dossier que Capterra.'),
('SaaS / Logiciel', 'Software Advice', 'https://www.softwareadvice.fr', 'comparateur', 'Groupe Gartner.'),
('SaaS / Logiciel', 'Appvizer', 'https://www.appvizer.fr', 'comparateur', 'Comparateur français de logiciels, très présent sur les requêtes FR.'),
('SaaS / Logiciel', 'Product Hunt', 'https://www.producthunt.com', 'comparateur', 'Utile au lancement, effet de notoriété durable.'),
('SaaS / Logiciel', 'Crunchbase', 'https://www.crunchbase.com', 'fiche', 'Fiche société, levées de fonds — source fréquente sur les requêtes de confiance.'),

-- ─── Agence marketing / communication ───────────────────────────────────
('Agence marketing / communication', 'Sortlist', 'https://www.sortlist.fr', 'comparateur', 'Place de marché agences, très citée sur "meilleure agence X".'),
('Agence marketing / communication', 'Clutch', 'https://clutch.co', 'comparateur', 'Référence internationale, avis vérifiés par entretien.'),
('Agence marketing / communication', 'La Fabrique du Net', 'https://www.lafabriquedunet.fr', 'comparateur', 'Comparateur et classements d''agences en France.'),

-- ─── Immobilier ─────────────────────────────────────────────────────────
('Immobilier', 'SeLoger', 'https://www.seloger.com', 'comparateur', 'Portail dominant, forte autorité.'),
('Immobilier', 'Bien''ici', 'https://www.bienici.com', 'comparateur', 'Portail majeur, fiches agences.'),
('Immobilier', 'MeilleursAgents', 'https://www.meilleursagents.com', 'comparateur', 'Classement et avis d''agences — cité sur les requêtes de choix d''agence.'),
('Immobilier', 'Logic-Immo', 'https://www.logic-immo.com', 'comparateur', 'Portail national.'),

-- ─── BTP / Artisanat ────────────────────────────────────────────────────
('BTP / Artisanat', 'Travaux.com', 'https://www.travaux.com', 'comparateur', 'Mise en relation et avis clients.'),
('BTP / Artisanat', 'Quotatis', 'https://www.quotatis.fr', 'comparateur', 'Devis travaux, fiches artisans.'),
('BTP / Artisanat', 'Houzz', 'https://www.houzz.fr', 'comparateur', 'Fort sur la rénovation et l''aménagement, portfolio visuel.'),
('BTP / Artisanat', 'Chambre de Métiers et de l''Artisanat', 'https://www.artisanat.fr', 'annuaire', 'Annuaire officiel — gage de sérieux pour les requêtes de confiance.'),

-- ─── Santé ──────────────────────────────────────────────────────────────
('Santé / Clinique / Praticien', 'Doctolib', 'https://www.doctolib.fr', 'annuaire', 'Incontournable. Fiche praticien détaillée.'),
('Santé / Clinique / Praticien', 'Annuaire santé Ameli', 'https://annuairesante.ameli.fr', 'annuaire', 'Annuaire officiel de l''Assurance Maladie.'),

-- ─── Cabinet d'avocats ──────────────────────────────────────────────────
('Cabinet d''avocats', 'Avocat.fr (CNB)', 'https://www.avocat.fr', 'annuaire', 'Annuaire officiel du Conseil National des Barreaux.'),
('Cabinet d''avocats', 'Village de la Justice', 'https://www.village-justice.com', 'presse', 'Média juridique de référence — publication d''articles d''expertise possible.'),
('Cabinet d''avocats', 'Justifit', 'https://www.justifit.fr', 'comparateur', 'Mise en relation avocats, fiches détaillées par spécialité.'),

-- ─── Comptabilité / conseil ─────────────────────────────────────────────
('Cabinet comptable / expertise', 'Annuaire de l''Ordre des experts-comptables', 'https://annuaire.experts-comptables.org', 'annuaire', 'Annuaire officiel — source d''autorité sur les requêtes de confiance.'),
('Cabinet comptable / expertise', 'Compta Online', 'https://www.compta-online.com', 'presse', 'Communauté et média du chiffre, tribunes possibles.'),

-- ─── Restauration / Hôtellerie ──────────────────────────────────────────
('Restauration', 'TheFork', 'https://www.thefork.fr', 'comparateur', 'Réservation + avis, très cité en local.'),
('Restauration', 'TripAdvisor', 'https://www.tripadvisor.fr', 'avis', 'Toujours massivement repris par les moteurs.'),
('Restauration', 'Guide Michelin', 'https://guide.michelin.com/fr', 'annuaire', 'Sélection éditoriale, forte autorité si éligible.'),
('Hôtellerie / Tourisme', 'Booking.com', 'https://www.booking.com', 'comparateur', 'Incontournable, avis structurés.'),
('Hôtellerie / Tourisme', 'TripAdvisor', 'https://www.tripadvisor.fr', 'avis', 'Idem restauration.'),

-- ─── RH / Recrutement ───────────────────────────────────────────────────
('RH / Recrutement', 'Welcome to the Jungle', 'https://www.welcometothejungle.com', 'fiche', 'Page entreprise riche, très bien référencée.'),
('RH / Recrutement', 'Glassdoor', 'https://www.glassdoor.fr', 'avis', 'Avis employés — pèse sur les requêtes de confiance.'),
('RH / Recrutement', 'Indeed', 'https://fr.indeed.com', 'annuaire', 'Page entreprise + avis.'),

-- ─── Formation ──────────────────────────────────────────────────────────
('Formation / Éducation', 'Mon Compte Formation', 'https://www.moncompteformation.gouv.fr', 'annuaire', 'Référencement officiel (nécessite Qualiopi) — très fort signal de confiance.'),
('Formation / Éducation', 'Kelformation', 'https://www.kelformation.com', 'comparateur', 'Comparateur de formations.'),
('Formation / Éducation', 'Diplomeo', 'https://diplomeo.com', 'comparateur', 'Orientation et comparaison d''écoles.'),

-- ─── Finance / Assurance ────────────────────────────────────────────────
('Finance / Assurance', 'LeLynx.fr', 'https://www.lelynx.fr', 'comparateur', 'Comparateur d''assurances grand public.'),
('Finance / Assurance', 'Assurland', 'https://www.assurland.com', 'comparateur', 'Comparateur historique.'),
('Finance / Assurance', 'Meilleurtaux', 'https://www.meilleurtaux.com', 'comparateur', 'Crédit et assurance emprunteur.'),
('Finance / Assurance', 'ORIAS', 'https://www.orias.fr', 'annuaire', 'Registre officiel des intermédiaires — obligatoire et très crédibilisant.'),

-- ─── E-commerce ─────────────────────────────────────────────────────────
('E-commerce', 'Avis Vérifiés', 'https://www.avis-verifies.com', 'avis', 'Avis certifiés AFNOR, repris par les moteurs.'),
('E-commerce', 'Trusted Shops', 'https://www.trustedshops.fr', 'avis', 'Label de confiance e-commerce européen.'),
('E-commerce', 'Les Numériques', 'https://www.lesnumeriques.com', 'presse', 'Tests produits — citations à fort poids sur les requêtes d''achat.'),

-- ─── Association / ONG ──────────────────────────────────────────────────
('Association / ONG', 'HelloAsso', 'https://www.helloasso.com', 'annuaire', 'Fiche association, dons.'),
('Association / ONG', 'Journal Officiel des associations', 'https://www.journal-officiel.gouv.fr/pages/associations-recherche/', 'annuaire', 'Publication officielle — source d''existence légale.');
