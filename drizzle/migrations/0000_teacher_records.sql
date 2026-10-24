CREATE TABLE public.teacher_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_email text NOT NULL,
  student_id integer NOT NULL,
  data jsonb NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (teacher_email, student_id)
);
GRANT SELECT, INSERT, UPDATE ON public.teacher_records TO anon, authenticated;
GRANT ALL ON public.teacher_records TO service_role;
ALTER TABLE public.teacher_records ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read records" ON public.teacher_records FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Anyone can add records" ON public.teacher_records FOR INSERT TO anon, authenticated WITH CHECK (length(teacher_email) > 3);
CREATE POLICY "Anyone can update records" ON public.teacher_records FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (length(teacher_email) > 3);