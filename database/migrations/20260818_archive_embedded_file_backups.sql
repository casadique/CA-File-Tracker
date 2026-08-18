begin;

create table if not exists public.app_state_archives (
  id text primary key,
  archive_type text not null,
  payload jsonb not null,
  payload_md5 text not null,
  created_by text,
  created_at timestamptz not null default now(),
  source_state_updated_at timestamptz,
  archived_at timestamptz not null default now(),
  constraint app_state_archives_type_check check (archive_type in ('file-data-reset'))
);

create index if not exists app_state_archives_created_at_idx
  on public.app_state_archives (created_at desc);

alter table public.app_state_archives enable row level security;

-- No browser-facing policy is created. Only the server service role can read or
-- write recovery archives. Copy every payload before reducing the hot state row.
insert into public.app_state_archives (
  id,
  archive_type,
  payload,
  payload_md5,
  created_by,
  created_at,
  source_state_updated_at
)
select
  coalesce(item ->> 'id', item -> 'backup' ->> 'backupId', md5(item::text)),
  'file-data-reset',
  item,
  md5(item::text),
  nullif(item ->> 'createdBy', ''),
  case
    when jsonb_typeof(item -> 'createdAt') = 'number'
      then to_timestamp((item ->> 'createdAt')::numeric / 1000)
    when nullif(item ->> 'createdAt', '') is not null
      then (item ->> 'createdAt')::timestamptz
    else now()
  end,
  source.updated_at
from public.app_state as source
cross join lateral jsonb_array_elements(coalesce(source.state -> 'fileDataBackups', '[]'::jsonb)) as item
where source.id = 'default'
on conflict (id) do update set
  payload = excluded.payload,
  payload_md5 = excluded.payload_md5,
  created_by = excluded.created_by,
  created_at = excluded.created_at,
  source_state_updated_at = excluded.source_state_updated_at;

do $$
declare
  expected_count integer;
  archived_count integer;
begin
  select jsonb_array_length(coalesce(state -> 'fileDataBackups', '[]'::jsonb))
    into expected_count
  from public.app_state
  where id = 'default';

  select count(*) into archived_count
  from public.app_state_archives
  where archive_type = 'file-data-reset';

  if archived_count < coalesce(expected_count, 0) then
    raise exception 'Archive verification failed: expected %, found %', expected_count, archived_count;
  end if;
end $$;

update public.app_state
set
  state = state - 'fileDataBackups',
  updated_at = now()
where id = 'default'
  and state ? 'fileDataBackups';

commit;
