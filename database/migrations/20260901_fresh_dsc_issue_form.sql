-- Requested simplified New Fresh DSC Issue fields and custody details.

alter table public.dsc_fresh_issues add column if not exists organization_name text;
alter table public.dsc_fresh_issues add column if not exists designation text;
alter table public.dsc_fresh_issues add column if not exists aadhaar_no text;
alter table public.dsc_fresh_issues add column if not exists token_name text;
alter table public.dsc_fresh_issues add column if not exists authority text;
alter table public.dsc_fresh_issues add column if not exists password_encrypted text;
alter table public.dsc_fresh_issues add column if not exists valid_from date;
alter table public.dsc_fresh_issues add column if not exists valid_to date;
alter table public.dsc_fresh_issues add column if not exists keep_in_custody boolean not null default false;
alter table public.dsc_fresh_issues add column if not exists box_id uuid references public.dsc_boxes(id) on delete set null;
alter table public.dsc_fresh_issues add column if not exists box_name text;
alter table public.dsc_fresh_issues add column if not exists slot_position text;

create index if not exists dsc_fresh_custody_box_idx
  on public.dsc_fresh_issues (box_id, status) where keep_in_custody;

comment on column public.dsc_fresh_issues.password_encrypted is
  'AES-256-GCM encrypted DSC password. Never return through browser APIs, reports, exports, notifications or QR codes.';
