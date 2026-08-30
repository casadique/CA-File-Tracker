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
    coalesce(app_state.state, '{}'::jsonb)
      - 'files'
      - 'fileNotifications'
      - 'feeReceipts'
      - 'auditLog' as state,
    app_state.updated_at,
    app_state.updated_by
  from public.app_state as app_state
  where app_state.id = 'default';
$$;

revoke all on function public.get_app_state_without_files() from public;
revoke all on function public.get_app_state_without_files() from anon;
revoke all on function public.get_app_state_without_files() from authenticated;
grant execute on function public.get_app_state_without_files() to service_role;

comment on function public.get_app_state_without_files() is
  'Returns only dashboard-critical central state; large files, notifications, receipts and audit history are loaded separately.';
