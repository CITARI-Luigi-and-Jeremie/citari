CREATE TABLE public.scans (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  domain TEXT NOT NULL,
  brand TEXT NOT NULL,
  sector TEXT,
  competitors TEXT[] NOT NULL DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'pending',
  score INTEGER,
  score_detail JSONB,
  share_of_voice JSONB,
  responses JSONB NOT NULL DEFAULT '[]'::jsonb
);

GRANT SELECT ON public.scans TO anon, authenticated;
GRANT ALL ON public.scans TO service_role;
ALTER TABLE public.scans ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Scans readable by link" ON public.scans FOR SELECT TO anon, authenticated USING (true);

CREATE TABLE public.scan_leads (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  scan_id UUID NOT NULL REFERENCES public.scans(id) ON DELETE CASCADE,
  email TEXT NOT NULL
);

GRANT INSERT ON public.scan_leads TO anon, authenticated;
GRANT ALL ON public.scan_leads TO service_role;
ALTER TABLE public.scan_leads ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can leave an email" ON public.scan_leads FOR INSERT TO anon, authenticated WITH CHECK (char_length(email) <= 255 AND email LIKE '%_@_%.__%');

INSERT INTO public.scans (id, domain, brand, sector, competitors, status, score, score_detail, share_of_voice, responses)
VALUES (
  '11111111-1111-4111-8111-111111111111',
  'cabinet-vasseur.fr',
  'Cabinet Vasseur',
  'Cabinet comptable',
  ARRAY['Fiducial', 'Compta Lyon', 'Exco'],
  'done',
  38,
  '{"global": {"mentionRate": 0.375, "positionScore": 0.28, "recommendationRate": 0.17, "sentimentScore": 0.62, "mentionedCount": 9, "responses": 24}, "byEngine": {"openai": {"mentionedCount": 2, "responses": 4}, "anthropic": {"mentionedCount": 1, "responses": 4}, "gemini": {"mentionedCount": 3, "responses": 4}, "perplexity": {"mentionedCount": 3, "responses": 4}, "grok": {"mentionedCount": 0, "responses": 4}, "mistral": {"mentionedCount": 0, "responses": 4}}}'::jsonb,
  '{"share": {"Fiducial": 0.34, "Exco": 0.21, "Compta Lyon": 0.16, "Cabinet Vasseur": 0.11, "Autres": 0.18}}'::jsonb,
  '[
    {"engine": "openai", "asked_at": "2026-08-01T09:12:00Z", "text": "Pour un cabinet comptable fiable à Lyon, je recommande plutôt Fiducial, qui dispose d''une équipe dédiée aux TPE, ou Exco pour un accompagnement plus personnalisé.", "mentions": [{"brand": "Fiducial", "is_recommended": true}, {"brand": "Exco", "is_recommended": true}]},
    {"engine": "perplexity", "asked_at": "2026-08-01T09:13:00Z", "text": "Les cabinets les plus cités pour les artisans du bâtiment dans la région lyonnaise sont Fiducial et Compta Lyon ; Compta Lyon est souvent conseillé pour ses tarifs.", "mentions": [{"brand": "Fiducial", "is_recommended": true}, {"brand": "Compta Lyon", "is_recommended": true}]},
    {"engine": "gemini", "asked_at": "2026-08-01T09:14:00Z", "text": "Si vous cherchez un expert-comptable pour créer votre société à Lyon, Exco est un choix solide et très bien référencé auprès des jeunes entreprises.", "mentions": [{"brand": "Exco", "is_recommended": true}]},
    {"engine": "anthropic", "asked_at": "2026-08-01T09:15:00Z", "text": "Je conseillerais de contacter Fiducial en priorité : leur couverture locale et leur suivi des obligations fiscales sont régulièrement salués.", "mentions": [{"brand": "Fiducial", "is_recommended": true}]},
    {"engine": "grok", "asked_at": "2026-08-01T09:16:00Z", "text": "Compta Lyon revient souvent comme le meilleur rapport qualité-prix pour un commerce local qui démarre.", "mentions": [{"brand": "Compta Lyon", "is_recommended": true}]},
    {"engine": "openai", "asked_at": "2026-08-01T09:17:00Z", "text": "Cabinet Vasseur peut convenir pour une petite structure, même si Fiducial reste plus visible sur ce segment.", "mentions": [{"brand": "Cabinet Vasseur", "is_recommended": false}, {"brand": "Fiducial", "is_recommended": true}]}
  ]'::jsonb
);