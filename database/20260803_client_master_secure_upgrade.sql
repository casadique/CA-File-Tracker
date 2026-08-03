begin;

alter table public.app_users
  add column if not exists permissions jsonb not null default '[]'::jsonb;

alter table public.clients
  add column if not exists tan text,
  add column if not exists normalized_tan text,
  add column if not exists gst_no text,
  add column if not exists normalized_gst_no text,
  add column if not exists cin text,
  add column if not exists normalized_cin text,
  add column if not exists other_regn_no text,
  add column if not exists normalized_other_regn_no text,
  add column if not exists it_password_encrypted text,
  add column if not exists gst_password_encrypted text,
  add column if not exists traces_login_encrypted text,
  add column if not exists traces_password_encrypted text;

create table if not exists public.client_types (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  normalized_name text not null unique,
  is_active boolean not null default true,
  display_order integer not null default 100,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.client_constitutions (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  normalized_name text not null unique,
  is_active boolean not null default true,
  display_order integer not null default 100,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.client_type_assignments (
  client_id uuid not null references public.clients(id) on delete cascade,
  client_type_id uuid not null references public.client_types(id) on delete restrict,
  created_at timestamptz not null default now(),
  primary key (client_id, client_type_id)
);

create unique index if not exists clients_unique_tan
  on public.clients(normalized_tan) where normalized_tan is not null and normalized_tan <> '';
create unique index if not exists clients_unique_gst
  on public.clients(normalized_gst_no) where normalized_gst_no is not null and normalized_gst_no <> '';
create unique index if not exists clients_unique_cin
  on public.clients(normalized_cin) where normalized_cin is not null and normalized_cin <> '';
create index if not exists clients_other_regn_search on public.clients(normalized_other_regn_no);
create index if not exists client_type_assignments_client on public.client_type_assignments(client_id);

insert into public.client_types (name, normalized_name, display_order) values
  ('IT Returns', 'it returns', 10),
  ('Statutory Audit', 'statutory audit', 20),
  ('Tax Audit', 'tax audit', 30),
  ('Independent Audit', 'independent audit', 40),
  ('GST Client', 'gst client', 50),
  ('TDS/TCS Client', 'tds tcs client', 60),
  ('EPF/ESI Client', 'epf esi client', 70),
  ('Other Client', 'other client', 80)
on conflict (normalized_name) do update set name = excluded.name;

insert into public.client_constitutions (name, normalized_name, display_order) values
  ('LLP', 'llp', 10),
  ('Private Limited Company', 'private limited company', 20),
  ('OPC', 'opc', 30),
  ('Trust', 'trust', 40),
  ('AOP', 'aop', 50),
  ('Individual', 'individual', 60),
  ('Society', 'society', 70),
  ('Section 8 Company', 'section 8 company', 80),
  ('Mutual Benefit Society', 'mutual benefit society', 90),
  ('Others', 'others', 100)
on conflict (normalized_name) do update set name = excluded.name;

-- Preserve the previous single client type as the first relational assignment.
insert into public.client_type_assignments (client_id, client_type_id)
select c.id, ct.id
from public.clients c
join public.client_types ct
  on ct.normalized_name = trim(lower(regexp_replace(trim(c.client_type), '[^a-zA-Z0-9]+', ' ', 'g')))
where coalesce(trim(c.client_type), '') <> ''
on conflict do nothing;

alter table public.client_types enable row level security;
alter table public.client_constitutions enable row level security;
alter table public.client_type_assignments enable row level security;

drop policy if exists client_types_authenticated_read on public.client_types;
create policy client_types_authenticated_read on public.client_types for select to authenticated using (true);
drop policy if exists client_constitutions_authenticated_read on public.client_constitutions;
create policy client_constitutions_authenticated_read on public.client_constitutions for select to authenticated using (true);
drop policy if exists client_type_assignments_authenticated_read on public.client_type_assignments;
create policy client_type_assignments_authenticated_read on public.client_type_assignments for select to authenticated using (true);

commit;
