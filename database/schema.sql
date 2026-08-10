create extension if not exists "pgcrypto";

create table if not exists public.app_users (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid unique references auth.users(id) on delete cascade,
  email text unique not null,
  name text not null,
  role text not null check (role in ('Admin', 'Manager', 'Staff Manager', 'Staff', 'Guest')),
  permissions jsonb not null default '[]'::jsonb,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.app_state (
  id text primary key default 'default',
  state jsonb not null default '{}'::jsonb,
  updated_by uuid references auth.users(id),
  updated_at timestamptz not null default now()
);

create table if not exists public.audit_events (
  id uuid primary key default gen_random_uuid(),
  actor_user_id uuid references auth.users(id),
  actor_email text,
  action text not null,
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

alter table public.app_users enable row level security;
alter table public.app_state enable row level security;
alter table public.audit_events enable row level security;

drop policy if exists "authenticated users can read active profiles" on public.app_users;
create policy "authenticated users can read active profiles"
  on public.app_users for select
  to authenticated
  using (is_active = true);

drop policy if exists "authenticated users can read central app state" on public.app_state;
create policy "authenticated users can read central app state"
  on public.app_state for select
  to authenticated
  using (true);

revoke insert, update, delete, truncate, references, trigger
  on table public.app_state from anon, authenticated;

drop policy if exists "authenticated users can read audit events" on public.audit_events;
create policy "authenticated users can read audit events"
  on public.audit_events for select
  to authenticated
  using (true);

insert into public.app_state (id, state)
values ('default', '{}'::jsonb)
on conflict (id) do nothing;

insert into storage.buckets (id, name, public)
values ('ca-file-tracker-attachments', 'ca-file-tracker-attachments', false)
on conflict (id) do nothing;
