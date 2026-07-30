create index if not exists idx_app_state_updated_at
  on public.app_state (updated_at desc);

create index if not exists idx_app_state_state_gin
  on public.app_state using gin (state);

do $$
begin
  if exists (
    select 1
    from pg_publication
    where pubname = 'supabase_realtime'
  ) and not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'app_state'
  ) then
    alter publication supabase_realtime add table public.app_state;
  end if;
end $$;
