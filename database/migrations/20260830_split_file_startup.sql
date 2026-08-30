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
    coalesce(app_state.state, '{}'::jsonb) - 'files' as state,
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
  'Returns the central application state without the files array for split browser startup.';

create or replace function public.get_file_snapshot()
returns table (
  files jsonb,
  total bigint
)
language sql
stable
security definer
set search_path = ''
as $$
  select
    coalesce(jsonb_agg(file_records.payload order by file_records.id), '[]'::jsonb) as files,
    count(*) as total
  from public.file_records as file_records
  where file_records.deleted_at is null;
$$;

revoke all on function public.get_file_snapshot() from public;
revoke all on function public.get_file_snapshot() from anon;
revoke all on function public.get_file_snapshot() from authenticated;
grant execute on function public.get_file_snapshot() to service_role;

comment on function public.get_file_snapshot() is
  'Returns the lossless relational file snapshot in one service-only request.';
