-- Additional custody details for DSC issue-out and box/slot transfers.

alter table public.dsc_movements add column if not exists issued_mobile text;
alter table public.dsc_movements add column if not exists relation text;
alter table public.dsc_movements add column if not exists permission_sought boolean not null default false;
alter table public.dsc_movements add column if not exists permission_mode text;
alter table public.dsc_movements add column if not exists from_box_name text;

alter table public.dsc_movements drop constraint if exists dsc_movement_permission_mode_check;
alter table public.dsc_movements add constraint dsc_movement_permission_mode_check
  check (permission_mode is null or permission_mode in ('Whatsapp','Email','Call','Direct'));

comment on column public.dsc_movements.permission_sought is 'Whether permission was sought before the DSC was issued out.';
comment on column public.dsc_movements.permission_mode is 'Whatsapp, Email, Call or Direct.';
comment on column public.dsc_movements.from_box_name is 'Source box name captured for a box or slot transfer.';
