-- AttendancePlus Setup Wizard - incremental migration.
-- Lets the QA sheet come from a Google Sheets link instead of an upload.
--
--   source_url  the Google Sheets link the IDs were read from (null for
--               uploaded files). While the newest row has one, the server
--               re-reads that sheet before every export.
--   fetched_at  when the IDs were last read from source_url (or uploaded).
-- ============================================================

alter table public.qa_sheets
  add column if not exists source_url text,
  add column if not exists fetched_at timestamptz not null default now();
