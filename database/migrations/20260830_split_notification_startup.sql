create or replace function public.get_app_state_without_files()
returns table (
  state jsonb,
  updated_at timestamptz,
  updated_by uuid
)
language sql
stable
security definer
set search_path = ''
as $$
  select
    coalesce(app_state.state, '{}'::jsonb) - 'files' - 'fileNotifications' as state,
    app_state.updated_at,
    app_state.updated_by
  from public.app_state as app_state
  where app_state.id = 'default';
$$;

revoke all on function public.get_app_state_without_files() from public;
revoke all on function public.get_app_state_without_files() from anon;
revoke all on function public.get_app_state_without_files() from authenticated;
grant execute on function public.get_app_state_without_files() to service_role;

create or replace function public.get_notification_snapshot()
returns table (
  notifications jsonb,
  notification_retention jsonb,
  users jsonb,
  updated_at timestamptz
)
language sql
stable
security definer
set search_path = ''
as $$
  select
    coalesce(app_state.state -> 'fileNotifications', '[]'::jsonb) as notifications,
    coalesce(app_state.state -> 'notificationRetention', '{}'::jsonb) as notification_retention,
    coalesce(app_state.state -> 'users', '[]'::jsonb) as users,
    app_state.updated_at
  from public.app_state as app_state
  where app_state.id = 'default';
$$;

revoke all on function public.get_notification_snapshot() from public;
revoke all on function public.get_notification_snapshot() from anon;
revoke all on function public.get_notification_snapshot() from authenticated;
grant execute on function public.get_notification_snapshot() to service_role;

comment on function public.get_notification_snapshot() is
  'Returns notification history and identity context for authenticated server-side visibility filtering.';
