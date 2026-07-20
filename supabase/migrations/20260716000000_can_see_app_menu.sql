-- AttendancePlus Setup Wizard - incremental migration.
-- Adds the per-user "see Main App Menu" capability flag.
-- Safe to re-run (ALTER uses IF NOT EXISTS).
--
-- Why this column exists:
--   Lets an admin grant specific non-admin users the ability to open the
--   "Main App Menu" tab in the wizard. The menu is read+design-only for
--   non-admins (they can edit locally and copy/download JSON, but the
--   "Apply to database" / upload / per-row edit controls stay hidden).
--   The session callback in lib/auth.ts loads this flag lazily and
--   gracefully tolerates a missing column (returns false), so this
--   migration is safe to ship before the code change is deployed.
-- ============================================================

alter table public.users
  add column if not exists can_see_app_menu boolean not null default false;
