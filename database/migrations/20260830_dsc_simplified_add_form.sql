-- Simplified Add DSC fields requested for CA File Tracker.
-- PW is encrypted by the application before storage and is never returned by APIs.

alter table public.dsc_master add column if not exists care_of text;
alter table public.dsc_master add column if not exists token_name text;
alter table public.dsc_master add column if not exists box_type text;
alter table public.dsc_master add column if not exists password_encrypted text;
alter table public.dsc_master alter column token_serial drop not null;
alter table public.dsc_master drop constraint if exists dsc_box_type_check;
alter table public.dsc_master add constraint dsc_box_type_check check (box_type is null or box_type in ('Blue','Black'));

drop index if exists public.dsc_search_idx;
create index if not exists dsc_search_idx on public.dsc_master using gin (
  (client_name || ' ' || coalesce(pan,'') || ' ' || holder_name || ' ' || coalesce(token_name,'') || ' ' || coalesce(token_serial,'')) gin_trgm_ops
);

comment on column public.dsc_master.password_encrypted is
  'AES-256-GCM encrypted DSC password. Never select in browser APIs, exports, reports, notifications or QR codes.';
