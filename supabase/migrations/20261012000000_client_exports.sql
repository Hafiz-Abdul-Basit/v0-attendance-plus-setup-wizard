-- AttendancePlus Setup Wizard - incremental migration.
-- Adds `client_exports`: one row per Export Pack a user downloads for a
-- client (an Azure DevOps agent in the client's agent pool).
--
-- Why this table exists:
--   On the Azure Tasks page a user picks the client they are deploying
--   to and exports the pack. Remembering when THIS user last exported for
--   THIS client lets the next export start from that date ("since last
--   export"), on any device. Rows are a history log; the API reads the
--   latest row per (user, client).
-- ============================================================

create table if not exists public.client_exports (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  client_name text not null,
  exported_at timestamptz not null default now(),
  range_from timestamptz,
  range_to timestamptz,
  task_count integer not null default 0
);

create index if not exists client_exports_user_client_idx
  on public.client_exports (user_id, client_name, exported_at desc);

-- ── Row-Level Security ───────────────────────────────────────────────
-- Only the API (service role) reads / writes; it scopes every query to
-- the signed-in user in code.
alter table public.client_exports enable row level security;

drop policy if exists "client_exports_service_role_all" on public.client_exports;
create policy "client_exports_service_role_all"
  on public.client_exports
  for all
  to service_role
  using (true)
  with check (true);
