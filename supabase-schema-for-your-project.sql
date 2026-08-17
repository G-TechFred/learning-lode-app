-- Run this ONCE in your own Supabase project (SQL Editor).
-- It recreates the G-TECH AUTOMATION schema that was removed from Lovable Cloud.

create type public.app_role as enum ('teacher', 'parent', 'student');

-- 1. Whitelist of emails allowed to register -------------------------------
create table public.authorized_users (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  role public.app_role not null,
  student_id integer,
  created_at timestamptz not null default now()
);
grant select, insert, update, delete on public.authorized_users to authenticated;
grant all on public.authorized_users to service_role;
alter table public.authorized_users enable row level security;

-- 2. Profiles ---------------------------------------------------------------
create table public.profiles (
  id uuid primary key,
  email text not null,
  full_name text not null default '',
  school_name text not null default '',
  role public.app_role not null,
  student_id integer,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select, insert, update on public.profiles to authenticated;
grant all on public.profiles to service_role;
alter table public.profiles enable row level security;

-- 3. Student performance -----------------------------------------------------
create table public.student_performance (
  id uuid primary key default gen_random_uuid(),
  student_id integer not null,
  subject text not null,
  class_score integer not null default 0,
  exam_score integer not null default 0,
  attendance integer not null default 0,
  participation integer not null default 0,
  remark text not null default '',
  term text not null,
  academic_year text not null,
  teacher_id uuid,
  updated_at timestamptz not null default now(),
  -- required by the app's upsert (onConflict: student_id,subject,term,academic_year)
  unique (student_id, subject, term, academic_year)
);
alter table public.student_performance replica identity full;
grant select, insert, update, delete on public.student_performance to authenticated;
grant all on public.student_performance to service_role;
alter table public.student_performance enable row level security;

-- 4. Helpers -----------------------------------------------------------------
create or replace function public.current_app_role()
returns public.app_role language sql stable security definer set search_path = public
as $$ select role from public.profiles where id = auth.uid() $$;

create or replace function public.current_student_id()
returns integer language sql stable security definer set search_path = public
as $$ select student_id from public.profiles where id = auth.uid() $$;

create or replace function public.touch_updated_at()
returns trigger language plpgsql set search_path = public
as $$ begin new.updated_at = now(); return new; end; $$;

create or replace function public.enforce_whitelist()
returns trigger language plpgsql security definer set search_path = public
as $$
declare w public.authorized_users%rowtype;
begin
  select * into w from public.authorized_users where lower(email) = lower(trim(new.email));
  if not found then
    raise exception 'ACCESS_DENIED: % is not on the school''s authorized users list', new.email
      using errcode = '42501';
  end if;
  new.role := w.role;
  new.student_id := w.student_id;
  return new;
end; $$;

create or replace function public.create_profile_for_new_user()
returns trigger language plpgsql security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name, school_name, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    coalesce(new.raw_user_meta_data->>'school_name', ''),
    'student'
  )
  on conflict (id) do nothing;
  return new;
end; $$;

create trigger profiles_enforce_whitelist before insert or update on public.profiles
  for each row execute function public.enforce_whitelist();
create trigger profiles_touch before update on public.profiles
  for each row execute function public.touch_updated_at();
create trigger student_performance_touch before update on public.student_performance
  for each row execute function public.touch_updated_at();
create trigger auth_users_create_profile after insert on auth.users
  for each row execute function public.create_profile_for_new_user();

-- 5. Policies ------------------------------------------------------------------
create policy "Own whitelist entry or teachers" on public.authorized_users
  for select to authenticated
  using (lower(email) = lower(coalesce(auth.jwt() ->> 'email', '')) or public.current_app_role() = 'teacher');
create policy "Teachers manage whitelist insert" on public.authorized_users
  for insert to authenticated with check (public.current_app_role() = 'teacher');
create policy "Teachers manage whitelist update" on public.authorized_users
  for update to authenticated using (public.current_app_role() = 'teacher') with check (public.current_app_role() = 'teacher');
create policy "Teachers manage whitelist delete" on public.authorized_users
  for delete to authenticated using (public.current_app_role() = 'teacher');

create policy "Create own profile" on public.profiles
  for insert to authenticated with check (id = auth.uid());
create policy "Own profile readable" on public.profiles
  for select to authenticated using (id = auth.uid() or public.current_app_role() = 'teacher');
create policy "Update own profile" on public.profiles
  for update to authenticated using (id = auth.uid()) with check (id = auth.uid());

create policy "Performance readable by owner or teacher" on public.student_performance
  for select to authenticated
  using (
    public.current_app_role() = 'teacher'
    or (public.current_app_role() in ('student', 'parent') and student_id = public.current_student_id())
  );
create policy "Teachers insert performance" on public.student_performance
  for insert to authenticated with check (public.current_app_role() = 'teacher');
create policy "Teachers update performance" on public.student_performance
  for update to authenticated using (public.current_app_role() = 'teacher') with check (public.current_app_role() = 'teacher');
create policy "Teachers delete performance" on public.student_performance
  for delete to authenticated using (public.current_app_role() = 'teacher');

-- 6. Realtime -------------------------------------------------------------------
alter publication supabase_realtime add table public.student_performance;

-- 7. Seed whitelist (edit these) --------------------------------------------------
insert into public.authorized_users (email, role, student_id) values
  ('teacher@gtech.school', 'teacher', null),
  ('student@gtech.school', 'student', 1),
  ('parent@gtech.school', 'parent', 1)
on conflict (email) do nothing;
