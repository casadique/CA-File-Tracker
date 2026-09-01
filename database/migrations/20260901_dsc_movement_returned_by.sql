-- Staff member responsible for returning an issued-out DSC.

alter table public.dsc_movements
  add column if not exists returned_by_user_id uuid;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'dsc_movements_returned_by_user_id_fkey'
      and conrelid = 'public.dsc_movements'::regclass
  ) then
    execute 'alter table public.dsc_movements '
      || 'add constraint dsc_movements_returned_by_user_id_fkey '
      || 'foreign key (returned_by_user_id) references public.app_users(id) on delete set null';
  end if;
end $$;

create index if not exists dsc_movements_returned_by_idx
  on public.dsc_movements (returned_by_user_id, expected_return_date);

comment on column public.dsc_movements.returned_by_user_id is
  'Active staff member responsible for returning the DSC by the expected return date.';
