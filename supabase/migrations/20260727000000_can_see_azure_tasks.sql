-- AttendancePlus Setup Wizard - incremental migration.
-- Adds the per-user "see Azure Tasks" capability flag.
-- Safe to re-run (ALTER uses IF NOT EXISTS).
--
-- Why this column exists:
--   Lets an admin grant specific non-admin users the ability to open the
--   Azure Tasks page (the work-item dashboard backed by Azure DevOps).
--   Without the flag, only admins can see the entry point in the wizard
--   header / profile menu. With the flag on, a regular user can browse
--   work items, view descriptions, and download attachments — same as
--   an admin. The session callback in lib/auth.ts loads this flag lazily
--   and gracefully tolerates a missing column (returns false), so this
--   migration is safe to ship before the code change is deployed.
-- ============================================================

alter table public.users
  add column if not exists can_see_azure_tasks boolean not null default false;
