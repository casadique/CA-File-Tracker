create extension if not exists "pgcrypto";
create extension if not exists "pg_trgm";

create table if not exists public.clients (
  id uuid primary key default gen_random_uuid(),
  client_code text not null unique,
  code_prefix text not null check (code_prefix in ('AU', 'ITR', 'OTR')),
  client_name text not null,
  normalized_name text not null,
  pan_reg_no text,
  normalized_pan text,
  aadhaar_no text,
  client_type text not null default 'Other',
  constitution text,
  contact_person text,
  contact_number text,
  email text,
  address text,
  place text,
  district text,
  care_of text,
  category text,
  status text not null default 'Active' check (status in ('Active', 'Inactive')),
  remarks text,
  created_by uuid references auth.users(id),
  updated_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists clients_normalized_pan_unique
  on public.clients (normalized_pan)
  where normalized_pan is not null and normalized_pan <> '';
create index if not exists clients_name_search_idx on public.clients (normalized_name);
create index if not exists clients_name_trgm_idx on public.clients using gin (client_name gin_trgm_ops);
create index if not exists clients_pan_trgm_idx on public.clients using gin (normalized_pan gin_trgm_ops);
create index if not exists clients_contact_search_idx on public.clients (contact_number);
create index if not exists clients_email_search_idx on public.clients (lower(email));
create index if not exists clients_status_idx on public.clients (status, updated_at desc);

create table if not exists public.client_audit_events (
  id uuid primary key default gen_random_uuid(),
  client_id uuid references public.clients(id) on delete cascade,
  actor_user_id uuid references auth.users(id),
  action text not null,
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index if not exists client_audit_events_client_idx
  on public.client_audit_events (client_id, created_at desc);

create table if not exists public.client_migration_backups (
  id uuid primary key default gen_random_uuid(),
  created_by uuid references auth.users(id),
  file_state jsonb not null,
  created_at timestamptz not null default now()
);

alter table public.clients enable row level security;
alter table public.client_audit_events enable row level security;
alter table public.client_migration_backups enable row level security;

drop policy if exists "authenticated users can read active clients" on public.clients;
create policy "authenticated users can read active clients"
  on public.clients for select to authenticated using (status = 'Active');

drop policy if exists "authenticated users can read client audit" on public.client_audit_events;
create policy "authenticated users can read client audit"
  on public.client_audit_events for select to authenticated using (
    exists (
      select 1 from public.app_users
      where app_users.auth_user_id = auth.uid()
        and app_users.is_active = true
        and app_users.role in ('Admin', 'Manager')
    )
  );
