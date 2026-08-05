-- Central, idempotent notification events and per-device delivery state.
-- Safe to run repeatedly. Existing preferences and valid notification history are preserved.

create extension if not exists pgcrypto;

create table if not exists public.notification_events (
  id uuid primary key default gen_random_uuid(),
  event_id text not null unique,
  event_key text not null unique,
  recipient_user_id uuid not null,
  event_type text not null,
  file_id text not null default '',
  payload jsonb not null default '{}'::jsonb,
  in_app_created_at timestamptz,
  desktop_status text not null default 'queued'
    check (desktop_status in ('queued','scheduled','sent','failed','opened','skipped')),
  scheduled_for timestamptz,
  sent_at timestamptz,
  failed_at timestamptz,
  opened_at timestamptz,
  read_at timestamptz,
  error_code text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_notification_events_recipient_created
  on public.notification_events (recipient_user_id, created_at desc);
create index if not exists idx_notification_events_scheduled
  on public.notification_events (scheduled_for) where desktop_status = 'scheduled';

alter table public.push_subscriptions add column if not exists device_id text not null default '';
alter table public.push_subscriptions add column if not exists browser_name text not null default '';
alter table public.push_subscriptions add column if not exists last_successful_delivery_at timestamptz;
create unique index if not exists idx_push_subscriptions_user_device
  on public.push_subscriptions (user_id, device_id) where device_id <> '' and is_active = true;

alter table public.notification_deliveries add column if not exists event_key text not null default '';
alter table public.notification_deliveries add column if not exists attempted_at timestamptz;
alter table public.notification_deliveries add column if not exists opened_at timestamptz;

alter table public.notification_events enable row level security;

-- Service-role API access only. Do not expose push subscriptions or delivery payloads
-- directly to browser clients.
