-- Capture the non-sensitive receipt details entered for a DSC IN movement.

alter table public.dsc_movements add column if not exists received_from text;
alter table public.dsc_movements add column if not exists received_mobile text;
alter table public.dsc_movements add column if not exists box_name text;

-- Box Name supports the built-in Blue/Black choices and authorized custom options.
alter table public.dsc_master drop constraint if exists dsc_box_type_check;
alter table public.dsc_master add constraint dsc_box_type_check
  check (box_type is null or length(btrim(box_type)) between 1 and 160);

comment on column public.dsc_movements.received_from is 'Person from whom the DSC was received.';
comment on column public.dsc_movements.received_mobile is 'Contact number captured for the DSC receipt.';
comment on column public.dsc_movements.box_name is 'Physical box name selected for the DSC receipt.';
