-- AttendancePlus Setup Wizard - incremental migration.
-- Adds the `app_menus` table that stores a hierarchical menu JSON
-- (NextPremium menu shape) uploaded by admins and viewed by everyone.
--
-- Why this table exists:
--   The wizard exposes a "Main App Menu" tab where admins can upload a
--   menu JSON file and all signed-in users can browse the resulting
--   tree. The JSON payload is stored verbatim in `json` (jsonb) so the
--   client can render it without round-tripping. The latest active
--   menu is the single source of truth — re-uploading archives the
--   previous row by flipping `is_active=false` and inserts a new one.
-- ============================================================

create table if not exists public.app_menus (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  json jsonb not null,
  is_active boolean not null default true,
  created_by uuid references public.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists app_menus_is_active_idx
  on public.app_menus (is_active, updated_at desc);

-- Reuse the existing updated_at trigger function.
drop trigger if exists app_menus_set_updated_at on public.app_menus;
create trigger app_menus_set_updated_at
  before update on public.app_menus
  for each row execute function public.set_updated_at();

-- ── Row-Level Security ───────────────────────────────────────────────
alter table public.app_menus enable row level security;

-- Public read of the active menu (anyone signed in — the API already
-- gates by NextAuth). Browsing the menu tree is non-sensitive.
drop policy if exists "app_menus_read_active" on public.app_menus;
create policy "app_menus_read_active"
  on public.app_menus
  for select
  using (is_active = true);

-- Service-role bypass for the API (the API uses the service role and
-- enforces admin-only writes in code). Anonymous/authenticated clients
-- cannot write directly.
drop policy if exists "app_menus_service_role_write" on public.app_menus;
create policy "app_menus_service_role_write"
  on public.app_menus
  for all
  to service_role
  using (true)
  with check (true);
