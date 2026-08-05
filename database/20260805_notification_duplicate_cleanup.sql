-- Audit-only duplicate detector for legacy notification rows held in app_state JSON.
-- It intentionally performs no broad deletion. The application cleanup service archives
-- only verified duplicate groups and preserves the canonical ID/read state.

create table if not exists public.notification_cleanup_audit (
  id uuid primary key default gen_random_uuid(),
  cleanup_version text not null unique,
  duplicate_groups integer not null default 0,
  archived_rows integer not null default 0,
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

alter table public.notification_cleanup_audit enable row level security;
