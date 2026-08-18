begin;

update public.app_state
set
  state = jsonb_set(
    state,
    '{fileDataBackups}',
    coalesce((
      select jsonb_agg(payload order by created_at desc)
      from public.app_state_archives
      where archive_type = 'file-data-reset'
    ), '[]'::jsonb),
    true
  ),
  updated_at = now()
where id = 'default';

do $$
declare
  embedded_count integer;
  archived_count integer;
begin
  select jsonb_array_length(coalesce(state -> 'fileDataBackups', '[]'::jsonb))
    into embedded_count
  from public.app_state
  where id = 'default';

  select count(*) into archived_count
  from public.app_state_archives
  where archive_type = 'file-data-reset';

  if embedded_count <> archived_count then
    raise exception 'Rollback verification failed: embedded %, archived %', embedded_count, archived_count;
  end if;
end $$;

commit;
