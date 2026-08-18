-- To-Do privacy boundary.
-- The central JSON contains user-scoped To-Do records, so authenticated browser
-- clients must not read it directly. All reads now pass through the Express API,
-- which filters records using the verified Supabase Auth user ID.

alter table public.app_state enable row level security;

revoke select, insert, update, delete, truncate, references, trigger
  on table public.app_state from anon, authenticated;

do $$
declare
  policy_row record;
begin
  for policy_row in
    select policyname
      from pg_policies
     where schemaname = 'public'
       and tablename = 'app_state'
  loop
    execute format('drop policy if exists %I on public.app_state', policy_row.policyname);
  end loop;
end
$$;

comment on table public.app_state is
  'Private central application state. Accessible only through the server service role and permission-filtered API routes.';
