REVOKE ALL ON FUNCTION public.is_email_authorized(text) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.enforce_whitelist() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.touch_updated_at() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.current_app_role() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.current_student_id() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.current_app_role() TO authenticated;
GRANT EXECUTE ON FUNCTION public.current_student_id() TO authenticated;