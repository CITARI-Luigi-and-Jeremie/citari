CREATE TABLE public.scans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
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
  score_global numeric,
  score_chatgpt numeric,
  score_claude numeric,
  score_gemini numeric,
  score_perplexity numeric,
  mention_rate numeric,
  avg_position numeric,
  reco_rate numeric,
  sentiment_score numeric,
  share_of_voice jsonb NOT NULL DEFAULT '[]'::jsonb,
  actions jsonb NOT NULL DEFAULT '[]'::jsonb,
  report_token text NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(24), 'hex'),
  previous_scan_id uuid REFERENCES public.scans(id) ON DELETE SET NULL,
  ip_hash text,
  started_at timestamptz,
  completed_at timestamptz
);
CREATE INDEX scans_created_idx ON public.scans (created_at DESC);
CREATE INDEX scans_ip_idx ON public.scans (ip_hash, created_at DESC);

CREATE TABLE public.queries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  scan_id uuid NOT NULL REFERENCES public.scans(id) ON DELETE CASCADE,
  rank int NOT NULL,
  text text NOT NULL,
  intent text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX queries_scan_idx ON public.queries (scan_id, rank);

CREATE TABLE public.responses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  scan_id uuid NOT NULL REFERENCES public.scans(id) ON DELETE CASCADE,
  query_id uuid NOT NULL REFERENCES public.queries(id) ON DELETE CASCADE,
  engine text NOT NULL,
  raw_text text,
  sources jsonb NOT NULL DEFAULT '[]'::jsonb,
  latency_ms int,
  cost_eur numeric DEFAULT 0,
  error text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX responses_scan_idx ON public.responses (scan_id);

CREATE TABLE public.mentions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  scan_id uuid NOT NULL REFERENCES public.scans(id) ON DELETE CASCADE,
  response_id uuid NOT NULL REFERENCES public.responses(id) ON DELETE CASCADE,
  query_id uuid NOT NULL REFERENCES public.queries(id) ON DELETE CASCADE,
  engine text NOT NULL,
  brand text NOT NULL,
  is_target boolean NOT NULL DEFAULT false,
  position int,
  recommended boolean NOT NULL DEFAULT false,
  sentiment text,
  verbatim text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX mentions_scan_idx ON public.mentions (scan_id);

CREATE TABLE public.leads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  scan_id uuid REFERENCES public.scans(id) ON DELETE SET NULL,
  email text NOT NULL,
  first_name text,
  phone text,
  company text,
  status text NOT NULL DEFAULT 'nouveau',
  priority text NOT NULL DEFAULT 'tiede',
  converted boolean NOT NULL DEFAULT false,
  notes text,
  consent_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX leads_created_idx ON public.leads (created_at DESC);

CREATE TABLE public.clients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  lead_id uuid REFERENCES public.leads(id) ON DELETE SET NULL,
  scan_id uuid REFERENCES public.scans(id) ON DELETE SET NULL,
  brand_name text NOT NULL,
  contact_email text,
  contact_name text,
  offer text NOT NULL DEFAULT 'sprint',
  amount_eur numeric NOT NULL DEFAULT 2900,
  invoice_status text NOT NULL DEFAULT 'acompte_du',
  notes text
);

CREATE TABLE public.sprints (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  client_id uuid NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  started_on date NOT NULL DEFAULT current_date,
  ends_on date,
  rescan_due_on date,
  rescan_scan_id uuid REFERENCES public.scans(id) ON DELETE SET NULL,
  status text NOT NULL DEFAULT 'en_cours'
);

CREATE TABLE public.sprint_tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sprint_id uuid NOT NULL REFERENCES public.sprints(id) ON DELETE CASCADE,
  week int NOT NULL,
  label text NOT NULL,
  done boolean NOT NULL DEFAULT false,
  notes text,
  position int NOT NULL DEFAULT 0
);

CREATE TABLE public.deliverables (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sprint_id uuid NOT NULL REFERENCES public.sprints(id) ON DELETE CASCADE,
  kind text NOT NULL,
  title text NOT NULL,
  url text,
  status text NOT NULL DEFAULT 'a_faire',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.citation_targets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sprint_id uuid NOT NULL REFERENCES public.sprints(id) ON DELETE CASCADE,
  directory_id uuid,
  name text NOT NULL,
  url text,
  status text NOT NULL DEFAULT 'a_contacter',
  contacted_on date,
  obtained_on date,
  notes text
);

CREATE TABLE public.directories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  sector text NOT NULL,
  name text NOT NULL,
  url text,
  kind text NOT NULL DEFAULT 'annuaire',
  language text NOT NULL DEFAULT 'fr',
  authority_note text
);
CREATE INDEX directories_sector_idx ON public.directories (sector);

CREATE TABLE public.client_data (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  key text NOT NULL,
  value text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.cost_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  scan_id uuid REFERENCES public.scans(id) ON DELETE SET NULL,
  engine text NOT NULL,
  tokens_in int DEFAULT 0,
  tokens_out int DEFAULT 0,
  cost_eur numeric NOT NULL DEFAULT 0
);

CREATE TABLE public.follow_ups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  lead_id uuid NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  step int NOT NULL,
  due_on date NOT NULL,
  channel text NOT NULL DEFAULT 'email',
  subject text,
  body text,
  sent_at timestamptz,
  cancelled boolean NOT NULL DEFAULT false
);
CREATE INDEX follow_ups_due_idx ON public.follow_ups (due_on);

GRANT ALL ON public.scans TO service_role;
GRANT ALL ON public.queries TO service_role;
GRANT ALL ON public.responses TO service_role;
GRANT ALL ON public.mentions TO service_role;
GRANT ALL ON public.leads TO service_role;
GRANT ALL ON public.clients TO service_role;
GRANT ALL ON public.sprints TO service_role;
GRANT ALL ON public.sprint_tasks TO service_role;
GRANT ALL ON public.deliverables TO service_role;
GRANT ALL ON public.citation_targets TO service_role;
GRANT ALL ON public.directories TO service_role;
GRANT ALL ON public.client_data TO service_role;
GRANT ALL ON public.cost_log TO service_role;
GRANT ALL ON public.follow_ups TO service_role;

ALTER TABLE public.scans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.queries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mentions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sprints ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sprint_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deliverables ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.citation_targets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.directories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.client_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cost_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.follow_ups ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.touch_updated_at() RETURNS trigger AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER scans_touch BEFORE UPDATE ON public.scans FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE TRIGGER leads_touch BEFORE UPDATE ON public.leads FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE TRIGGER clients_touch BEFORE UPDATE ON public.clients FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();