-- AttendancePlus Setup Wizard - incremental migration.
-- Adds the per-user "edit all snippets" capability flag.
-- Safe to re-run (ALTER uses IF NOT EXISTS).
--
-- Why this column exists:
--   The admin can grant a non-admin user (e.g. a team lead) the ability
--   to edit or delete ANY snippet, not just snippets they own. Without
--   this flag, only users with role = 'admin' have that authority.
--   The session callback in lib/auth.ts loads this flag lazily and
--   gracefully tolerates a missing column (returns false), so this
--   migration is safe to ship before the code change is deployed.
-- ============================================================

alter table public.users
  add column if not exists can_edit_all_snippets boolean not null default false;
