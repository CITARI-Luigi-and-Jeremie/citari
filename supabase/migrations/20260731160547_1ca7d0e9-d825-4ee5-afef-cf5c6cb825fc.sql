CREATE TABLE public.tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  tags text[] NOT NULL DEFAULT '{}',
  completed boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.tasks TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.tasks TO authenticated;
GRANT ALL ON public.tasks TO service_role;

ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tasks_public_select" ON public.tasks FOR SELECT USING (true);
CREATE POLICY "tasks_public_insert" ON public.tasks FOR INSERT WITH CHECK (true);
CREATE POLICY "tasks_public_update" ON public.tasks FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "tasks_public_delete" ON public.tasks FOR DELETE USING (true);

CREATE TRIGGER tasks_touch_updated_at BEFORE UPDATE ON public.tasks
FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();