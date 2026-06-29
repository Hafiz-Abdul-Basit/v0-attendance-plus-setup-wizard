-- AttendancePlus Setup Wizard - Supabase schema
-- Run this in the Supabase SQL Editor (or via `supabase db push`) before first start.
-- Safe to re-run.

-- Required for gen_random_uuid()
create extension if not exists "pgcrypto";

-- ============================================================
-- USERS TABLE
-- NextAuth Credentials provider reads from here.
-- Password is bcrypt hash (12 rounds) — never store plaintext.
-- ============================================================
create table if not exists public.users (
  id uuid primary key default gen_random_uuid(),
  email text unique not null,
  password_hash text not null,
  name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists users_email_idx on public.users (email);

-- ============================================================
-- SNIPPETS TABLE
-- Mirrors the shape of data/snippets.tsx.
-- `legacy_id` preserves the original string ID (e.g. "frontend-webconfig")
-- so existing references in installation-wizard.tsx keep working.
-- `table_data` (jsonb) holds the user-management interactive table payload.
-- ============================================================
create table if not exists public.snippets (
  id uuid primary key default gen_random_uuid(),
  legacy_id text unique,
  title text not null,
  description text,
  content text not null,
  category text not null,
  language text,
  icon text,
  color text,
  tags text[] not null default '{}',
  is_interactive boolean not null default false,
  table_data jsonb,
  is_public boolean not null default true,
  created_by uuid references public.users(id) on delete set null,
  last_used_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists snippets_fts_idx
  on public.snippets
  using gin (to_tsvector('english',
    title || ' ' || coalesce(description, '') || ' ' || content));

create index if not exists snippets_tags_idx
  on public.snippets
  using gin (tags);

create index if not exists snippets_category_idx
  on public.snippets (category);

create index if not exists snippets_legacy_id_idx
  on public.snippets (legacy_id);

-- ============================================================
-- ROW-LEVEL SECURITY (defense in depth — API uses service role)
-- ============================================================
alter table public.users enable row level security;
alter table public.snippets enable row level security;

-- Public read of public snippets (the API bypasses this with the service role key
-- but it ensures even anon Supabase clients can't accidentally expose data)
drop policy if exists "snippets_read_public" on public.snippets;
create policy "snippets_read_public"
  on public.snippets
  for select
  using (is_public = true);

-- service_role bypass for seeding/migration scripts (npm run db:seed / db:reset).
-- RLS does not auto-skip for the service role — we have to opt in with a policy
-- scoped to that role. Anonymous/authenticated clients still cannot write.
drop policy if exists "snippets_service_role_write" on public.snippets;
create policy "snippets_service_role_write"
  on public.snippets
  for all
  to service_role
  using (true)
  with check (true);

-- No anon write policies — all writes go through authenticated API routes
drop policy if exists "users_no_anon_read" on public.users;
create policy "users_no_anon_read"
  on public.users
  for select
  using (false);


-- ============================================================
-- updated_at trigger
-- ============================================================
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists users_set_updated_at on public.users;
create trigger users_set_updated_at
  before update on public.users
  for each row execute function public.set_updated_at();

drop trigger if exists snippets_set_updated_at on public.snippets;
create trigger snippets_set_updated_at
  before update on public.snippets
  for each row execute function public.set_updated_at();

-- ============================================================
-- USER ROLES (added for admin panel + snippet moderation)
-- role ∈ ('user', 'admin'). The first registered user is promoted
-- to admin by a one-shot backfill so an empty deployment gets a
-- usable admin right after the first /api/auth/register call.
--
-- Designated admin email (always promoted to admin on schema apply):
--   a.basit.freelancer@gmail.com
-- ============================================================
alter table public.users
  add column if not exists role text not null default 'user';

-- Add the CHECK constraint only if it isn't already there
-- (Postgres has no "ADD CONSTRAINT IF NOT EXISTS" — guard with DO block).
do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'users_role_check'
  ) then
    alter table public.users
      add constraint users_role_check check (role in ('user', 'admin'));
  end if;
end$$;

create index if not exists users_role_idx on public.users (role);

-- Always promote the designated admin email (idempotent).
update public.users
   set role = 'admin',
       updated_at = now()
 where email = 'a.basit.freelancer@gmail.com';

-- Bootstrap: if there are still zero admins (e.g. fresh deploy and the
-- designated admin hasn't registered yet), promote the earliest user.
update public.users
   set role = 'admin',
       updated_at = now()
 where id = (select id from public.users order by created_at asc limit 1)
   and (select count(*) from public.users where role = 'admin') = 0;

-- ============================================================
-- PASSWORD RESET (forgot-password flow)
-- A short-lived token is stored on the user; the API marks it NULL
-- once consumed. Index only non-null rows so lookups stay fast and
-- unused tokens don't bloat the index.
-- ============================================================
alter table public.users
  add column if not exists password_reset_token   text,
  add column if not exists password_reset_expires timestamptz;

create index if not exists users_password_reset_token_idx
  on public.users (password_reset_token)
  where password_reset_token is not null;

-- ============================================================
-- PER-USER TAB VISIBILITY
-- New users default to BOTH tabs hidden. Admins toggle either
-- flag from /admin → Users. The wizard reads both flags off the
-- session JWT and hides the corresponding buttons. Admins bypass
-- the flags (admins always see all tabs).
-- ============================================================
alter table public.users
  add column if not exists can_see_setup_clients boolean not null default false,
  add column if not exists can_see_setups       boolean not null default false;
