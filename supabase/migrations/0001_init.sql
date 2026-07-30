-- GEO Sprint — schéma initial
create extension if not exists "pgcrypto";

-- ─── Scans & pipeline ────────────────────────────────────────────────
create table scans (
  id uuid primary key default gen_random_uuid(),
  brand text not null,
  url text not null,
  sector text not null,
  competitors jsonb not null default '[]',        -- [{name, url?}]
  lang text not null default 'fr',                -- fr | it | en
  status text not null default 'pending',         -- pending | generating_queries | running | scoring | done | error
  progress int not null default 0,                -- 0-100
  error text,
  score numeric,                                  -- 0-100
  score_detail jsonb,                             -- par moteur + composantes
  share_of_voice jsonb,                           -- {brand: x, competitors: {...}}
  actions jsonb,                                  -- 10 actions prioritaires (rapport)
  email text,
  report_token text unique,
  previous_scan_id uuid references scans(id),     -- re-scan J+90 → comparaison
  client_id uuid,                                 -- renseigné pour les rescans client
  ip text,
  cost_cents numeric not null default 0,
  created_at timestamptz not null default now(),
  completed_at timestamptz
);
create index scans_ip_created_idx on scans (ip, created_at);
create index scans_email_idx on scans (email);

create table queries (
  id uuid primary key default gen_random_uuid(),
  scan_id uuid not null references scans(id) on delete cascade,
  text text not null,
  category text not null,          -- comparative | problem | local | trust
  position int not null default 0
);
create index queries_scan_idx on queries (scan_id);

create table responses (
  id uuid primary key default gen_random_uuid(),
  query_id uuid not null references queries(id) on delete cascade,
  scan_id uuid not null references scans(id) on delete cascade,
  engine text not null,            -- openai | anthropic | gemini | perplexity
  text text not null,
  citations jsonb not null default '[]',   -- URLs (Perplexity surtout)
  latency_ms int,
  cost_cents numeric not null default 0,
  created_at timestamptz not null default now()
);
create index responses_scan_idx on responses (scan_id);

create table mentions (
  id uuid primary key default gen_random_uuid(),
  response_id uuid not null references responses(id) on delete cascade,
  scan_id uuid not null references scans(id) on delete cascade,
  brand text not null,
  mentioned boolean not null,
  position int,                    -- ordre de citation dans la réponse (1 = premier)
  sentiment text,                  -- positive | neutral | negative
  is_recommended boolean not null default false,
  method text not null default 'deterministic'  -- deterministic | llm
);
create index mentions_scan_idx on mentions (scan_id);

-- ─── CRM ─────────────────────────────────────────────────────────────
create table leads (
  id uuid primary key default gen_random_uuid(),
  scan_id uuid not null references scans(id),
  email text not null,
  brand text not null,
  sector text,
  score numeric,
  status text not null default 'new',   -- new | contacted | call_booked | client | lost
  notes text,
  created_at timestamptz not null default now()
);

create table clients (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid references leads(id),
  brand text not null,
  url text not null,
  sector text,
  competitors jsonb not null default '[]',
  contact_name text,
  contact_email text,
  site_access text,                -- notes accès CMS/repo
  initial_scan_id uuid references scans(id),
  rescan_due_at date,              -- J+90
  rescan_reminder_sent boolean not null default false,
  created_at timestamptz not null default now()
);
alter table scans add constraint scans_client_fk foreign key (client_id) references clients(id);

create table sprints (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references clients(id) on delete cascade,
  kind text not null default 'sprint',      -- sprint (2900) | domination (4900)
  starts_at date,
  ends_at date,
  status text not null default 'active',    -- active | done
  created_at timestamptz not null default now()
);

create table sprint_tasks (
  id uuid primary key default gen_random_uuid(),
  sprint_id uuid not null references sprints(id) on delete cascade,
  week int not null,
  position int not null,
  label text not null,
  done boolean not null default false,
  notes text,
  deliverable_id uuid
);

create table deliverables (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references clients(id) on delete cascade,
  kind text not null,     -- audit | fixes | brief | content | citations | rescan_report
  title text not null,
  path text,              -- chemin fichier dans deliverables/<client>/
  data jsonb,             -- contenu structuré (briefs, etc.)
  created_at timestamptz not null default now()
);
alter table sprint_tasks add constraint sprint_tasks_deliverable_fk
  foreign key (deliverable_id) references deliverables(id);

-- ─── Chantier 3 ──────────────────────────────────────────────────────
create table citation_targets (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references clients(id) on delete cascade,
  source text not null,            -- domaine / nom
  url text,
  type text,                       -- annuaire | comparateur | presse | forum | fiche | autre
  reason text,                     -- pourquoi (cité par Perplexity pour X sur Y requêtes…)
  action text,                     -- quoi faire
  difficulty text,                 -- easy | medium | hard
  pitch_draft text,                -- brouillon d'email
  status text not null default 'todo',  -- todo | sent | followed_up | obtained
  created_at timestamptz not null default now()
);

create table directories (
  id uuid primary key default gen_random_uuid(),
  sector text not null,
  name text not null,
  url text not null,
  type text not null default 'annuaire',
  notes text,
  created_at timestamptz not null default now()
);

create table client_data (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references clients(id) on delete cascade,
  key text not null,               -- prix, différenciateurs, verbatims, chiffres…
  value text not null,
  created_at timestamptz not null default now()
);

-- ─── Coûts ───────────────────────────────────────────────────────────
create table cost_log (
  id uuid primary key default gen_random_uuid(),
  scan_id uuid references scans(id) on delete cascade,
  engine text not null,
  input_tokens int not null default 0,
  output_tokens int not null default 0,
  cost_cents numeric not null default 0,
  created_at timestamptz not null default now()
);
