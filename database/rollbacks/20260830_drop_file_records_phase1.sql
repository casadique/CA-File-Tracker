-- Disable FILES_RELATIONAL_SHADOW_WRITE and FILES_RELATIONAL_READ before using
-- this rollback. The original app_state.files array is intentionally untouched.

drop table if exists public.file_migration_runs;
drop table if exists public.file_records;
