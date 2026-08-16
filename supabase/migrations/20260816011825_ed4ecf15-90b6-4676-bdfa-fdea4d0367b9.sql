DROP TRIGGER IF EXISTS auth_users_create_profile ON auth.users;

DROP TABLE IF EXISTS public.student_performance CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;
DROP TABLE IF EXISTS public.authorized_users CASCADE;

DROP FUNCTION IF EXISTS public.create_profile_for_new_user() CASCADE;
DROP FUNCTION IF EXISTS public.enforce_whitelist() CASCADE;
DROP FUNCTION IF EXISTS public.current_app_role() CASCADE;
DROP FUNCTION IF EXISTS public.current_student_id() CASCADE;
DROP FUNCTION IF EXISTS public.is_email_authorized(text) CASCADE;
DROP FUNCTION IF EXISTS public.touch_updated_at() CASCADE;

DROP TYPE IF EXISTS public.app_role CASCADE;