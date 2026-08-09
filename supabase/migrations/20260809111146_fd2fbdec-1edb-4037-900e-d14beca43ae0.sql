-- 1. Roles enum
CREATE TYPE public.app_role AS ENUM ('teacher','parent','student');

-- 2. Whitelist of authorized users
CREATE TABLE public.authorized_users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL UNIQUE,
  role public.app_role NOT NULL,
  student_id integer,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.authorized_users TO authenticated;
GRANT ALL ON public.authorized_users TO service_role;
ALTER TABLE public.authorized_users ENABLE ROW LEVEL SECURITY;

-- 3. Profiles
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY,
  email text NOT NULL,
  full_name text NOT NULL DEFAULT '',
  school_name text NOT NULL DEFAULT '',
  role public.app_role NOT NULL,
  student_id integer,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 4. Performance records
CREATE TABLE public.student_performance (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id integer NOT NULL,
  subject text NOT NULL,
  class_score integer NOT NULL DEFAULT 0 CHECK (class_score BETWEEN 0 AND 100),
  exam_score integer NOT NULL DEFAULT 0 CHECK (exam_score BETWEEN 0 AND 100),
  attendance integer NOT NULL DEFAULT 0 CHECK (attendance BETWEEN 0 AND 100),
  participation integer NOT NULL DEFAULT 0 CHECK (participation BETWEEN 0 AND 10),
  remark text NOT NULL DEFAULT '',
  term text NOT NULL,
  academic_year text NOT NULL,
  teacher_id uuid,
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (student_id, subject, term, academic_year)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.student_performance TO authenticated;
GRANT ALL ON public.student_performance TO service_role;
ALTER TABLE public.student_performance ENABLE ROW LEVEL SECURITY;

-- 5. Security definer helpers (avoid recursive RLS)
CREATE OR REPLACE FUNCTION public.current_app_role()
RETURNS public.app_role
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$ SELECT role FROM public.profiles WHERE id = auth.uid() $$;

CREATE OR REPLACE FUNCTION public.current_student_id()
RETURNS integer
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$ SELECT student_id FROM public.profiles WHERE id = auth.uid() $$;

CREATE OR REPLACE FUNCTION public.is_email_authorized(_email text)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$ SELECT EXISTS (SELECT 1 FROM public.authorized_users WHERE lower(email) = lower(trim(_email))) $$;

REVOKE ALL ON FUNCTION public.is_email_authorized(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_email_authorized(text) TO anon, authenticated;

-- 6. Whitelist enforcement on profile creation (sign-up gate)
CREATE OR REPLACE FUNCTION public.enforce_whitelist()
RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE w public.authorized_users%ROWTYPE;
BEGIN
  SELECT * INTO w FROM public.authorized_users WHERE lower(email) = lower(trim(NEW.email));
  IF NOT FOUND THEN
    RAISE EXCEPTION 'ACCESS_DENIED: % is not on the school''s authorized users list', NEW.email
      USING ERRCODE = '42501';
  END IF;
  NEW.role := w.role;
  NEW.student_id := w.student_id;
  RETURN NEW;
END;
$$;

CREATE TRIGGER profiles_enforce_whitelist
BEFORE INSERT OR UPDATE OF email, role, student_id ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.enforce_whitelist();

CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS trigger LANGUAGE plpgsql SET search_path = public
AS $$ BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

CREATE TRIGGER profiles_touch BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE TRIGGER student_performance_touch BEFORE UPDATE ON public.student_performance
FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- 7. RLS policies
CREATE POLICY "Own profile readable" ON public.profiles
FOR SELECT TO authenticated USING (id = auth.uid() OR public.current_app_role() = 'teacher');

CREATE POLICY "Create own profile" ON public.profiles
FOR INSERT TO authenticated WITH CHECK (id = auth.uid());

CREATE POLICY "Update own profile" ON public.profiles
FOR UPDATE TO authenticated USING (id = auth.uid()) WITH CHECK (id = auth.uid());

CREATE POLICY "Own whitelist entry or teachers" ON public.authorized_users
FOR SELECT TO authenticated
USING (lower(email) = lower(coalesce(auth.jwt() ->> 'email','')) OR public.current_app_role() = 'teacher');

CREATE POLICY "Teachers manage whitelist insert" ON public.authorized_users
FOR INSERT TO authenticated WITH CHECK (public.current_app_role() = 'teacher');
CREATE POLICY "Teachers manage whitelist update" ON public.authorized_users
FOR UPDATE TO authenticated USING (public.current_app_role() = 'teacher') WITH CHECK (public.current_app_role() = 'teacher');
CREATE POLICY "Teachers manage whitelist delete" ON public.authorized_users
FOR DELETE TO authenticated USING (public.current_app_role() = 'teacher');

CREATE POLICY "Performance readable by owner or teacher" ON public.student_performance
FOR SELECT TO authenticated
USING (
  public.current_app_role() = 'teacher'
  OR (public.current_app_role() IN ('student','parent') AND student_id = public.current_student_id())
);

CREATE POLICY "Teachers insert performance" ON public.student_performance
FOR INSERT TO authenticated WITH CHECK (public.current_app_role() = 'teacher');
CREATE POLICY "Teachers update performance" ON public.student_performance
FOR UPDATE TO authenticated USING (public.current_app_role() = 'teacher') WITH CHECK (public.current_app_role() = 'teacher');
CREATE POLICY "Teachers delete performance" ON public.student_performance
FOR DELETE TO authenticated USING (public.current_app_role() = 'teacher');

-- 8. Realtime
ALTER TABLE public.student_performance REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.student_performance;