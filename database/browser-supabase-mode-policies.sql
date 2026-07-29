-- Required for browser-Supabase mode.
-- Run this once in Supabase SQL Editor after database/schema.sql.

drop policy if exists "authenticated users can insert central app state" on public.app_state;
create policy "authenticated users can insert central app state"
  on public.app_state for insert
  to authenticated
  with check (true);

drop policy if exists "authenticated users can update central app state" on public.app_state;
create policy "authenticated users can update central app state"
  on public.app_state for update
  to authenticated
  using (true)
  with check (true);

drop policy if exists "authenticated users can read active profiles by browser" on public.app_users;
create policy "authenticated users can read active profiles by browser"
  on public.app_users for select
  to authenticated
  using (is_active = true);
