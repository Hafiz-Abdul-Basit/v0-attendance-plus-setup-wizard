-- AttendancePlus Setup Wizard - incremental migration.
-- Adds `pending_registrations`: sign-ups waiting for their emailed
-- 6-digit code (see /api/auth/register and /api/auth/register/verify).
--
-- Why this table exists:
--   With email verification on, an account is only created in
--   public.users after the user proves they own the address. Until then
--   the sign-up (bcrypt password hash + HMAC of the code) waits here, one
--   row per email; registering again replaces it with a fresh code.
-- ============================================================

create table if not exists public.pending_registrations (
  email text primary key,
  name text,
  password_hash text not null,
  otp_hash text not null,
  expires_at timestamptz not null,
  attempts integer not null default 0,
  created_at timestamptz not null default now()
);

-- ── Row-Level Security ───────────────────────────────────────────────
-- Only the API (service role) touches this table.
alter table public.pending_registrations enable row level security;

drop policy if exists "pending_registrations_service_role_all" on public.pending_registrations;
create policy "pending_registrations_service_role_all"
  on public.pending_registrations
  for all
  to service_role
  using (true)
  with check (true);
