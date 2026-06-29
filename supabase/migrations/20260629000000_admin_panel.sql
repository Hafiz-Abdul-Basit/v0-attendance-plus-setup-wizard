-- AttendancePlus Setup Wizard - incremental migration.
-- Adds the role + per-user tab-visibility columns that were introduced
-- after the initial schema. Safe to re-run (every ALTER uses IF NOT EXISTS).
--
-- Why a separate file:
--   The initial migration (20260101000000_init.sql) was shipped before
--   the admin panel existed. Existing deployments that ran only the
--   initial file are missing `role`, `can_see_setup_clients`, and
--   `can_see_setups`. Run this in the Supabase SQL Editor (or via
--   `supabase db push`) and the admin endpoint will start working.
-- ============================================================

-- USER ROLES
alter table public.users
  add column if not exists role text not null default 'user';

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

-- PASSWORD RESET (forgot-password flow)
alter table public.users
  add column if not exists password_reset_token   text,
  add column if not exists password_reset_expires timestamptz;

create index if not exists users_password_reset_token_idx
  on public.users (password_reset_token)
  where password_reset_token is not null;

-- PER-USER TAB VISIBILITY
-- New users default to BOTH tabs hidden. Admins toggle either flag from
-- /admin → Users. The wizard reads both flags off the session JWT and
-- hides the corresponding buttons. Admins bypass the flags.
alter table public.users
  add column if not exists can_see_setup_clients boolean not null default false,
  add column if not exists can_see_setups       boolean not null default false;

-- Always promote the designated admin email (idempotent).
update public.users
   set role = 'admin',
       updated_at = now()
 where email = 'a.basit.freelancer@gmail.com';

-- Bootstrap: if there are still zero admins, promote the earliest user.
update public.users
   set role = 'admin',
       updated_at = now()
 where id = (select id from public.users order by created_at asc limit 1)
   and (select count(*) from public.users where role = 'admin') = 0;