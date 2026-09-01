-- Persist the certificate authority selected during DSC receipt.

alter table public.dsc_master add column if not exists authority text;
alter table public.dsc_movements add column if not exists authority text;

comment on column public.dsc_master.authority is
  'DSC certificate authority, selected from built-in or authorized custom options.';
comment on column public.dsc_movements.authority is
  'Authority captured as part of the DSC IN movement receipt.';
