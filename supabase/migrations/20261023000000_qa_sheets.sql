-- AttendancePlus Setup Wizard - incremental migration.
-- Adds `qa_sheets`: each upload of the team's QA workbook ("Att Plus"
-- sheet, "Azure Task No" column), stored as the parsed task IDs only.
--
-- Why this table exists:
--   Export Packs must only contain tasks QA has fully tested. Anyone with
--   Azure Tasks access uploads the latest workbook; the newest row is the
--   active list every export is filtered against. Older rows are kept as a
--   history of who updated it and when.
-- ============================================================

create table if not exists public.qa_sheets (
  id uuid primary key default gen_random_uuid(),
  uploaded_by uuid references public.users(id) on delete set null,
  uploaded_at timestamptz not null default now(),
  file_name text not null,
  task_ids integer[] not null,
  row_count integer not null default 0
);

create index if not exists qa_sheets_uploaded_at_idx
  on public.qa_sheets (uploaded_at desc);

-- ── Row-Level Security ───────────────────────────────────────────────
-- Only the API (service role) reads / writes.
alter table public.qa_sheets enable row level security;

drop policy if exists "qa_sheets_service_role_all" on public.qa_sheets;
create policy "qa_sheets_service_role_all"
  on public.qa_sheets
  for all
  to service_role
  using (true)
  with check (true);
