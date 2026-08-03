-- Desktop/browser notification preferences, devices and delivery audit.
-- Run once in the Supabase SQL Editor.

create extension if not exists pgcrypto;

create table if not exists public.notification_preferences (
  user_id uuid primary key,
  desktop_enabled boolean not null default false,
  assignment_enabled boolean not null default true,
  correction_enabled boolean not null default true,
  checking_enabled boolean not null default true,
  due_enabled boolean not null default true,
  billing_enabled boolean not null default true,
  chat_enabled boolean not null default true,
  announcement_enabled boolean not null default true,
  sound_enabled boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  endpoint text not null unique,
  subscription jsonb not null,
  device_label text not null default '',
  user_agent text not null default '',
  is_active boolean not null default true,
  last_seen_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_push_subscriptions_user_active
  on public.push_subscriptions (user_id, is_active);

create table if not exists public.notification_deliveries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  subscription_id uuid references public.push_subscriptions(id) on delete cascade,
  notification_id text not null,
  category text not null,
  delivery_status text not null default 'pending',
  error_message text not null default '',
  delivered_at timestamptz,
  created_at timestamptz not null default now(),
  unique (user_id, subscription_id, notification_id)
);

create index if not exists idx_notification_deliveries_user_created
  on public.notification_deliveries (user_id, created_at desc);

create table if not exists public.desktop_notification_settings (
  id text primary key default 'default',
  organization_enabled boolean not null default true,
  assignment_enabled boolean not null default true,
  correction_enabled boolean not null default true,
  checking_enabled boolean not null default true,
  due_enabled boolean not null default true,
  billing_enabled boolean not null default true,
  chat_enabled boolean not null default true,
  announcement_enabled boolean not null default true,
  due_reminder_days integer[] not null default array[1, 0, -1],
  updated_by uuid,
  updated_at timestamptz not null default now()
);

insert into public.desktop_notification_settings (id)
values ('default') on conflict (id) do nothing;

alter table public.notification_preferences enable row level security;
alter table public.push_subscriptions enable row level security;
alter table public.notification_deliveries enable row level security;
alter table public.desktop_notification_settings enable row level security;

-- These tables are accessed only through the authenticated Express API using
-- the Supabase service-role key. No browser-direct table policy is required.
