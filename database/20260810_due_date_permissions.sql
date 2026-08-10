-- Due dates are stored inside the central app_state JSON document. All writes
-- must pass through the authenticated Express service, which verifies the
-- server-side profile and applies the due-date authorization policy.

alter table public.app_state enable row level security;

revoke insert, update, delete, truncate, references, trigger
  on table public.app_state from anon, authenticated;

grant select on table public.app_state to authenticated;

-- Remove any legacy browser-write policies without changing the read policy.
do $$
declare
  policy_row record;
begin
  for policy_row in
    select policyname
      from pg_policies
     where schemaname = 'public'
       and tablename = 'app_state'
       and cmd <> 'SELECT'
  loop
    execute format('drop policy if exists %I on public.app_state', policy_row.policyname);
  end loop;
end
$$;

comment on table public.app_state is
  'Central application state. Authenticated clients are read-only; mutations use the protected server API.';
