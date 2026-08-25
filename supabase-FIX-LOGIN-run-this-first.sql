-- =====================================================================
-- G-TECH AUTOMATION — LOGIN / SIGN-UP REPAIR SCRIPT
-- Run this in YOUR Supabase project: SQL Editor -> New query -> paste -> Run
-- Then run supabase-schema-for-your-project.sql (the whole file).
-- =====================================================================
-- Why: your project has a leftover trigger on auth.users that points at a
-- public.profiles table that no longer exists. Every sign-up / login lookup
-- then fails with "Database error finding user", so no account could ever be
-- created — which is why sign-in reports "Invalid login credentials".

-- 1. Remove the broken trigger + function so auth works again.
drop trigger if exists auth_users_create_profile on auth.users;
drop function if exists public.create_profile_for_new_user() cascade;

-- 2. Remove any other half-created leftovers (safe if they don't exist).
drop trigger if exists profiles_enforce_whitelist on public.profiles;
drop trigger if exists profiles_touch on public.profiles;
drop trigger if exists student_performance_touch on public.student_performance;

-- 3. Sanity check: this must return your email if the account exists.
--    If it returns nothing, sign up again in the app after step 4.
select id, email, email_confirmed_at, created_at
from auth.users
where lower(email) = lower('godfredmens78@gmail.com');

-- 4. NOW open supabase-schema-for-your-project.sql and run it completely.
--    It recreates profiles, authorized_users, student_performance, the
--    whitelist trigger, the auto-profile trigger and email_is_registered().

-- 5. Whitelist yourself so sign-up is allowed (change role if needed):
--    Run this AFTER step 4.
-- insert into public.authorized_users (email, role, full_name)
-- values ('godfredmens78@gmail.com', 'teacher', 'Godfred Mensah')
-- on conflict (email) do update set role = excluded.role;
