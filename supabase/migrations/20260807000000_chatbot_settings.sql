-- AttendancePlus Setup Wizard - incremental migration.
-- Adds chatbot settings storage: a per-user `chatbot_access` override
-- column on `public.users` plus a tiny `public.app_settings` key/value
-- table that holds the global `chatbot_enabled` toggle.
--
-- Why this exists:
--   The admin panel gets a Chatbot Settings section. The admin can flip
--   a single master toggle that turns the in-app ChatWidget on/off for
--   every user, and pin individual users to "Enabled" / "Disabled" via
--   the per-user override. Global OFF always wins regardless of the
--   per-user override.
--
-- Safe to re-run (every ALTER uses IF NOT EXISTS, the seed row uses
-- ON CONFLICT DO NOTHING).
-- ============================================================

-- ── Per-user override ────────────────────────────────────────────────
alter table public.users
  add column if not exists chatbot_access text not null default 'inherit';

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'users_chatbot_access_check'
  ) then
    alter table public.users
      add constraint users_chatbot_access_check
      check (chatbot_access in ('inherit', 'enabled', 'disabled'));
  end if;
end$$;

-- ── Global toggle (key/value table for app-wide config) ──────────────
create table if not exists public.app_settings (
  key text primary key,
  value jsonb not null,
  updated_at timestamptz not null default now()
);

-- Reuse the existing updated_at trigger function.
drop trigger if exists app_settings_set_updated_at on public.app_settings;
create trigger app_settings_set_updated_at
  before update on public.app_settings
  for each row execute function public.set_updated_at();

-- Seed the master toggle (idempotent). DEFAULT `true` per spec.
insert into public.app_settings (key, value)
  values ('chatbot_enabled', 'true'::jsonb)
  on conflict (key) do nothing;

-- ── Row-Level Security ───────────────────────────────────────────────
alter table public.app_settings enable row level security;

-- No anon read policy — all reads go through authenticated API routes
-- which use the service_role key and enforce admin/role checks in code.
drop policy if exists "app_settings_no_anon_read" on public.app_settings;
create policy "app_settings_no_anon_read"
  on public.app_settings
  for select
  using (false);

-- Service-role bypass for the API (admin API + per-user status endpoint).
drop policy if exists "app_settings_service_role_write" on public.app_settings;
create policy "app_settings_service_role_write"
  on public.app_settings
  for all
  to service_role
  using (true)
  with check (true);
