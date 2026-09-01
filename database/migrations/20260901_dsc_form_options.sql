-- Persistent custom values for the Add/Edit DSC dropdowns.

create table if not exists public.dsc_form_options (
  id uuid primary key default gen_random_uuid(),
  option_type text not null check (option_type in ('entity_name','designation','token_name')),
  value text not null check (length(btrim(value)) between 1 and 160),
  normalized_value text generated always as (lower(btrim(value))) stored,
  is_active boolean not null default true,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  unique (option_type, normalized_value)
);

create index if not exists dsc_form_options_active_idx
  on public.dsc_form_options (option_type, value) where is_active;

alter table public.dsc_form_options enable row level security;
revoke all on table public.dsc_form_options from anon, authenticated;

comment on table public.dsc_form_options is
  'Server-managed custom Entity Name, Designation and Token Name options for DSC forms.';
