-- 1. scans : nouvelles colonnes
ALTER TABLE public.scans
  ADD COLUMN IF NOT EXISTS progress integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS error text,
  ADD COLUMN IF NOT EXISTS actions jsonb,
  ADD COLUMN IF NOT EXISTS cost_cents integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS started_at timestamptz NOT NULL DEFAULT now();

ALTER TABLE public.scans ALTER COLUMN status SET DEFAULT 'generating_queries';
UPDATE public.scans SET status = 'generating_queries' WHERE status = 'pending';
ALTER TABLE public.scans DROP CONSTRAINT IF EXISTS scans_status_check;
ALTER TABLE public.scans ADD CONSTRAINT scans_status_check
  CHECK (status IN ('generating_queries','running','scoring','done','error'));

-- 2. queries
CREATE TABLE public.queries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  scan_id uuid NOT NULL REFERENCES public.scans(id) ON DELETE CASCADE,
  position integer NOT NULL,
  text text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (scan_id, position)
);
GRANT SELECT ON public.queries TO anon, authenticated;
GRANT ALL ON public.queries TO service_role;
ALTER TABLE public.queries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Queries readable by link" ON public.queries FOR SELECT TO anon, authenticated USING (true);

-- 3. responses (texte non lisible côté public via privilèges colonne)
CREATE TABLE public.responses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  scan_id uuid NOT NULL REFERENCES public.scans(id) ON DELETE CASCADE,
  query_id uuid NOT NULL REFERENCES public.queries(id) ON DELETE CASCADE,
  engine text NOT NULL,
  text text,
  latency_ms integer,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX responses_scan_id_idx ON public.responses(scan_id);
GRANT SELECT (id, scan_id, query_id, engine, latency_ms, created_at) ON public.responses TO anon, authenticated;
GRANT ALL ON public.responses TO service_role;
ALTER TABLE public.responses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Response metadata readable by link" ON public.responses FOR SELECT TO anon, authenticated USING (true);

-- 4. mentions (aucun accès public)
CREATE TABLE public.mentions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  response_id uuid NOT NULL REFERENCES public.responses(id) ON DELETE CASCADE,
  scan_id uuid NOT NULL REFERENCES public.scans(id) ON DELETE CASCADE,
  brand text NOT NULL,
  is_recommended boolean NOT NULL DEFAULT false,
  position integer,
  sentiment text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX mentions_scan_id_idx ON public.mentions(scan_id);
GRANT ALL ON public.mentions TO service_role;
ALTER TABLE public.mentions ENABLE ROW LEVEL SECURITY;

-- 5. reprise du JSONB existant vers responses, puis suppression de la colonne
DO $$
DECLARE s record; r jsonb; q_id uuid; i integer;
BEGIN
  FOR s IN SELECT id, responses FROM public.scans WHERE responses IS NOT NULL AND jsonb_typeof(responses) = 'array' AND jsonb_array_length(responses) > 0 LOOP
    i := 0;
    FOR r IN SELECT jsonb_array_elements(s.responses) LOOP
      i := i + 1;
      INSERT INTO public.queries (scan_id, position, text)
      VALUES (s.id, i, coalesce(r->>'query', 'Question ' || i))
      RETURNING id INTO q_id;
      INSERT INTO public.responses (scan_id, query_id, engine, text, latency_ms)
      VALUES (s.id, q_id, coalesce(r->>'engine', 'openai'), r->>'text', 1500);
    END LOOP;
  END LOOP;
END $$;

ALTER TABLE public.scans DROP COLUMN IF EXISTS responses;

-- 6. privilèges colonne sur scans : plus d'accès à actions / cost_cents / error
DROP POLICY IF EXISTS "Scans readable by link" ON public.scans;
REVOKE SELECT ON public.scans FROM anon, authenticated;
GRANT SELECT (id, created_at, started_at, domain, brand, sector, competitors, status, progress, score, score_detail, share_of_voice) ON public.scans TO anon, authenticated;
CREATE POLICY "Scans readable by link" ON public.scans FOR SELECT TO anon, authenticated USING (true);

-- 7. vues publiques
CREATE VIEW public.scans_public WITH (security_invoker = on) AS
  SELECT id, created_at, started_at, domain, brand, sector, competitors, status, progress, score, score_detail, share_of_voice
  FROM public.scans;
GRANT SELECT ON public.scans_public TO anon, authenticated;

CREATE VIEW public.responses_meta WITH (security_invoker = on) AS
  SELECT id, scan_id, query_id, engine, latency_ms, created_at
  FROM public.responses;
GRANT SELECT ON public.responses_meta TO anon, authenticated;

-- 8. l'insertion publique d'un scan démarre en génération des questions
DROP POLICY IF EXISTS "Anyone can request a scan" ON public.scans;
CREATE POLICY "Anyone can request a scan" ON public.scans FOR INSERT TO anon, authenticated
WITH CHECK (
  status = 'generating_queries'
  AND score IS NULL AND score_detail IS NULL AND share_of_voice IS NULL
  AND actions IS NULL AND error IS NULL AND cost_cents = 0 AND progress = 0
  AND char_length(domain) <= 255 AND char_length(brand) <= 120
  AND array_length(competitors, 1) IS DISTINCT FROM 0
  AND coalesce(array_length(competitors, 1), 0) <= 3
);

-- 9. données de démonstration pour le scan de dev
INSERT INTO public.queries (scan_id, position, text)
SELECT '11111111-1111-4111-8111-111111111111', p, t
FROM (VALUES
  (101, 'Quel cabinet comptable choisir à Lyon pour une PME ?'),
  (102, 'Meilleur expert-comptable pour startup en France ?'),
  (103, 'Qui peut m''accompagner sur ma liasse fiscale ?'),
  (104, 'Cabinet comptable en ligne recommandé ?'),
  (105, 'Comment choisir son expert-comptable ?'),
  (106, 'Alternatives aux cabinets comptables traditionnels ?')
) AS v(p, t)
WHERE EXISTS (SELECT 1 FROM public.scans WHERE id = '11111111-1111-4111-8111-111111111111');

INSERT INTO public.responses (scan_id, query_id, engine, text, latency_ms)
SELECT q.scan_id, q.id, e.engine, 'Réponse de démonstration.', e.latency
FROM public.queries q
CROSS JOIN (VALUES ('openai', 2340), ('anthropic', 1980), ('gemini', 1450), ('perplexity', 3120)) AS e(engine, latency)
WHERE q.scan_id = '11111111-1111-4111-8111-111111111111' AND q.position >= 101;