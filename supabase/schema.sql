-- Instantané du schéma réel, exporté depuis Supabase (ebcuhuhslrrsjouchiga).
-- Ne pas éditer à la main : réexporter après chaque migration.
-- Voir supabase/README.md.
--
-- RLS : les 15 tables ont RLS ACTIF et AUCUNE policy, donc accès public
-- entièrement refusé. Tout passe par la clé de service, côté serveur.

-- ─────────────────────────────── TABLES ───────────────────────────────

CREATE TABLE directories (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  sector text NOT NULL,
  name text NOT NULL,
  url text,
  kind text NOT NULL DEFAULT 'annuaire',
  language text NOT NULL DEFAULT 'fr',
  authority_note text,
  CONSTRAINT directories_pkey PRIMARY KEY (id));

CREATE TABLE scans (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  brand_name text NOT NULL,
  website_url text,
  sector text NOT NULL,
  city text,
  language text NOT NULL DEFAULT 'fr',
  competitors text[] NOT NULL DEFAULT '{}',
  status text NOT NULL DEFAULT 'pending',
  phase text NOT NULL DEFAULT 'init',
  error_message text,
  mode text NOT NULL DEFAULT 'complet',
  domain_key text,
  progress integer NOT NULL DEFAULT 0,
  score_global numeric, score_chatgpt numeric, score_claude numeric,
  score_gemini numeric, score_perplexity numeric, score_grok numeric,
  score_mistral numeric,
  mention_rate numeric, avg_position numeric, reco_rate numeric,
  sentiment_score numeric,
  share_of_voice jsonb NOT NULL DEFAULT '[]',
  actions jsonb NOT NULL DEFAULT '[]',
  audit jsonb, miroir jsonb,
  -- Classement des concurrents relatif au client suivi :
  -- { "Deloitte": "geant", "Cabinet Odicéo": "rival", "QuickBooks": "outil" }
  -- Vide = tout est rival, le parti pris prudent.
  concurrent_classes jsonb NOT NULL DEFAULT '{}',
  -- Variantes d'écriture regroupées sous le nom retenu :
  -- { "Exco Lyon": "Exco", "Fiducial Expertise": "Fiducial" }
  -- Les noms bruts restent intacts dans `mentions` : c'est la mesure.
  brand_aliases jsonb NOT NULL DEFAULT '{}',
  -- Concurrents nommés par le prospect, rapprochés de ce qui a été cité :
  -- [{ "saisi": "Fiducial", "releve": "Fiducial", "citations": 42 }]
  concurrents_suivis jsonb NOT NULL DEFAULT '[]',
  report_token text NOT NULL DEFAULT encode(gen_random_bytes(24), 'hex'),
  previous_scan_id uuid,
  ip_hash text,
  started_at timestamptz, completed_at timestamptz,
  CONSTRAINT scans_pkey PRIMARY KEY (id),
  CONSTRAINT scans_previous_scan_id_fkey FOREIGN KEY (previous_scan_id) REFERENCES scans(id) ON DELETE SET NULL,
  CONSTRAINT scans_report_token_key UNIQUE (report_token));

CREATE TABLE queries (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  scan_id uuid NOT NULL,
  rank integer NOT NULL,
  text text NOT NULL,
  intent text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT queries_pkey PRIMARY KEY (id),
  CONSTRAINT queries_scan_id_fkey FOREIGN KEY (scan_id) REFERENCES scans(id) ON DELETE CASCADE);

CREATE TABLE responses (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  scan_id uuid NOT NULL,
  query_id uuid NOT NULL,
  engine text NOT NULL,
  raw_text text,
  sources jsonb NOT NULL DEFAULT '[]',
  latency_ms integer,
  cost_eur numeric DEFAULT 0,
  error text,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT responses_pkey PRIMARY KEY (id),
  CONSTRAINT responses_query_id_fkey FOREIGN KEY (query_id) REFERENCES queries(id) ON DELETE CASCADE,
  CONSTRAINT responses_scan_id_fkey FOREIGN KEY (scan_id) REFERENCES scans(id) ON DELETE CASCADE);

CREATE TABLE mentions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  scan_id uuid NOT NULL,
  response_id uuid NOT NULL,
  query_id uuid NOT NULL,
  engine text NOT NULL,
  brand text NOT NULL,
  is_target boolean NOT NULL DEFAULT false,
  "position" integer,
  recommended boolean NOT NULL DEFAULT false,
  sentiment text,
  verbatim text,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT mentions_pkey PRIMARY KEY (id),
  CONSTRAINT mentions_query_id_fkey FOREIGN KEY (query_id) REFERENCES queries(id) ON DELETE CASCADE,
  CONSTRAINT mentions_response_id_fkey FOREIGN KEY (response_id) REFERENCES responses(id) ON DELETE CASCADE,
  CONSTRAINT mentions_scan_id_fkey FOREIGN KEY (scan_id) REFERENCES scans(id) ON DELETE CASCADE);

CREATE TABLE cost_log (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  scan_id uuid,
  engine text NOT NULL,
  tokens_in integer DEFAULT 0,
  tokens_out integer DEFAULT 0,
  cost_eur numeric NOT NULL DEFAULT 0,
  CONSTRAINT cost_log_pkey PRIMARY KEY (id),
  CONSTRAINT cost_log_scan_id_fkey FOREIGN KEY (scan_id) REFERENCES scans(id) ON DELETE CASCADE);

CREATE TABLE leads (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  scan_id uuid,
  email text NOT NULL,
  first_name text, phone text, company text,
  status text NOT NULL DEFAULT 'nouveau',
  priority text NOT NULL DEFAULT 'tiede',
  converted boolean NOT NULL DEFAULT false,
  notes text,
  -- Horodatage du consentement RGPD, posé à la saisie de l'email.
  consent_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT leads_pkey PRIMARY KEY (id),
  CONSTRAINT leads_scan_id_fkey FOREIGN KEY (scan_id) REFERENCES scans(id) ON DELETE SET NULL);

CREATE TABLE follow_ups (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  lead_id uuid NOT NULL,
  step integer NOT NULL,
  due_on date NOT NULL,
  channel text NOT NULL DEFAULT 'email',
  subject text, body text,
  sent_at timestamptz,
  cancelled boolean NOT NULL DEFAULT false,
  CONSTRAINT follow_ups_pkey PRIMARY KEY (id),
  CONSTRAINT follow_ups_lead_id_fkey FOREIGN KEY (lead_id) REFERENCES leads(id) ON DELETE CASCADE);

CREATE TABLE clients (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  lead_id uuid, scan_id uuid,
  brand_name text NOT NULL,
  website_url text, sector text,
  contact_email text, contact_name text,
  offer text NOT NULL DEFAULT 'sprint',
  amount_eur numeric NOT NULL DEFAULT 2900,
  invoice_status text NOT NULL DEFAULT 'acompte_du',
  notes text,
  CONSTRAINT clients_pkey PRIMARY KEY (id),
  CONSTRAINT clients_lead_id_fkey FOREIGN KEY (lead_id) REFERENCES leads(id) ON DELETE SET NULL,
  CONSTRAINT clients_scan_id_fkey FOREIGN KEY (scan_id) REFERENCES scans(id) ON DELETE SET NULL);

CREATE TABLE client_data (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL,
  key text NOT NULL, value text,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT client_data_pkey PRIMARY KEY (id),
  CONSTRAINT client_data_client_id_fkey FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE);

CREATE TABLE sprints (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  client_id uuid NOT NULL,
  started_on date NOT NULL DEFAULT CURRENT_DATE,
  ends_on date,
  rescan_due_on date,
  rescan_scan_id uuid,
  rescan_reminder_sent boolean NOT NULL DEFAULT false,
  status text NOT NULL DEFAULT 'en_cours',
  CONSTRAINT sprints_pkey PRIMARY KEY (id),
  CONSTRAINT sprints_client_id_fkey FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE,
  CONSTRAINT sprints_rescan_scan_id_fkey FOREIGN KEY (rescan_scan_id) REFERENCES scans(id) ON DELETE SET NULL);

CREATE TABLE sprint_tasks (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  sprint_id uuid NOT NULL,
  week integer NOT NULL,
  label text NOT NULL,
  done boolean NOT NULL DEFAULT false,
  notes text,
  "position" integer NOT NULL DEFAULT 0,
  CONSTRAINT sprint_tasks_pkey PRIMARY KEY (id),
  CONSTRAINT sprint_tasks_sprint_id_fkey FOREIGN KEY (sprint_id) REFERENCES sprints(id) ON DELETE CASCADE);

CREATE TABLE deliverables (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  sprint_id uuid, client_id uuid,
  kind text NOT NULL, title text NOT NULL,
  url text, local_path text, data jsonb,
  status text NOT NULL DEFAULT 'a_faire',
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT deliverables_pkey PRIMARY KEY (id),
  CONSTRAINT deliverables_client_id_fkey FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE,
  CONSTRAINT deliverables_sprint_id_fkey FOREIGN KEY (sprint_id) REFERENCES sprints(id) ON DELETE CASCADE);

CREATE TABLE citation_targets (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  sprint_id uuid, directory_id uuid, client_id uuid,
  name text NOT NULL, url text,
  status text NOT NULL DEFAULT 'a_faire',
  contacted_on date, obtained_on date, notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT citation_targets_pkey PRIMARY KEY (id),
  CONSTRAINT citation_targets_client_id_fkey FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE,
  CONSTRAINT citation_targets_directory_id_fkey FOREIGN KEY (directory_id) REFERENCES directories(id) ON DELETE SET NULL,
  CONSTRAINT citation_targets_sprint_id_fkey FOREIGN KEY (sprint_id) REFERENCES sprints(id) ON DELETE CASCADE);

CREATE TABLE crawler_hits (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL,
  measured_on date NOT NULL DEFAULT CURRENT_DATE,
  period_start date, period_end date,
  bot text NOT NULL,
  hits integer NOT NULL DEFAULT 0,
  errors integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT crawler_hits_pkey PRIMARY KEY (id),
  CONSTRAINT crawler_hits_client_id_fkey FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE);

CREATE TABLE brand_overrides (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  -- Forme normalisée : « Exco Lyon » et « exco-lyon » ne demandent qu'une
  -- seule correction.
  brand_key text NOT NULL,
  brand_label text NOT NULL,
  -- Chaîne vide = vaut partout. Un NULL aurait été plus parlant, mais deux
  -- NULL sont distincts pour Postgres, donc l'unicité ne tiendrait pas et
  -- ON CONFLICT ne saurait pas s'y raccrocher.
  sector text NOT NULL DEFAULT '',
  classe text NOT NULL CHECK (classe IN ('rival', 'geant', 'outil', 'institution')),
  notes text,
  CONSTRAINT brand_overrides_pkey PRIMARY KEY (id));

-- ─────────────────────────────── INDEX ───────────────────────────────

CREATE UNIQUE INDEX directories_sector_url_uidx ON directories (sector, url);
CREATE INDEX directories_sector_idx ON directories (sector);
-- Empêche qu'une même paire question/moteur soit collectée deux fois : sans
-- lui, 32 % des appels étaient payés en double.
CREATE UNIQUE INDEX responses_scan_query_engine_uidx ON responses (scan_id, query_id, engine);
CREATE INDEX responses_query_idx ON responses (query_id);
CREATE INDEX queries_scan_idx ON queries (scan_id, rank);
CREATE INDEX mentions_scan_idx ON mentions (scan_id);
CREATE INDEX mentions_response_idx ON mentions (response_id);
CREATE INDEX mentions_query_idx ON mentions (query_id);
CREATE INDEX cost_log_scan_idx ON cost_log (scan_id);
-- Le cache 3 jours s'appuie dessus.
CREATE INDEX scans_domain_mode_idx ON scans (domain_key, mode, created_at DESC);
-- Le plafond de 2 scans par jour et par connexion s'appuie dessus.
CREATE INDEX scans_ip_idx ON scans (ip_hash, created_at DESC);
CREATE INDEX scans_previous_idx ON scans (previous_scan_id);
CREATE INDEX leads_status_idx ON leads (status, created_at DESC);
-- Lu à chaque affichage de résultat, pour le verrou du verbatim.
CREATE INDEX leads_scan_idx ON leads (scan_id);
CREATE INDEX follow_ups_lead_idx ON follow_ups (lead_id, step);
CREATE INDEX follow_ups_due_idx ON follow_ups (due_on) WHERE sent_at IS NULL AND cancelled = false;
CREATE INDEX client_data_client_idx ON client_data (client_id);
CREATE INDEX sprints_client_idx ON sprints (client_id, started_on DESC);
CREATE INDEX sprints_rescan_due_idx ON sprints (rescan_due_on) WHERE rescan_scan_id IS NULL;
CREATE INDEX sprint_tasks_sprint_idx ON sprint_tasks (sprint_id, "position");
CREATE INDEX deliverables_client_idx ON deliverables (client_id, created_at);
CREATE INDEX deliverables_sprint_idx ON deliverables (sprint_id);
CREATE INDEX citation_targets_client_idx ON citation_targets (client_id);
CREATE INDEX citation_targets_sprint_idx ON citation_targets (sprint_id);
CREATE INDEX crawler_hits_client_idx ON crawler_hits (client_id, measured_on DESC);
-- Une seule décision humaine par entreprise et par portée.
CREATE UNIQUE INDEX brand_overrides_uidx ON brand_overrides (brand_key, sector);

-- ──────────────────────────────── RLS ────────────────────────────────
-- Activé partout, AUCUNE policy : refus total pour la clé publique.
-- Tout accès passe par la clé de service, côté serveur uniquement.

ALTER TABLE directories      ENABLE ROW LEVEL SECURITY;
ALTER TABLE scans            ENABLE ROW LEVEL SECURITY;
ALTER TABLE queries          ENABLE ROW LEVEL SECURITY;
ALTER TABLE responses        ENABLE ROW LEVEL SECURITY;
ALTER TABLE mentions         ENABLE ROW LEVEL SECURITY;
ALTER TABLE cost_log         ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads            ENABLE ROW LEVEL SECURITY;
ALTER TABLE follow_ups       ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients          ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_data      ENABLE ROW LEVEL SECURITY;
ALTER TABLE sprints          ENABLE ROW LEVEL SECURITY;
ALTER TABLE sprint_tasks     ENABLE ROW LEVEL SECURITY;
ALTER TABLE deliverables     ENABLE ROW LEVEL SECURITY;
ALTER TABLE citation_targets ENABLE ROW LEVEL SECURITY;
ALTER TABLE crawler_hits     ENABLE ROW LEVEL SECURITY;
ALTER TABLE brand_overrides  ENABLE ROW LEVEL SECURITY;
