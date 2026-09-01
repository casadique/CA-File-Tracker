-- Add the requested Class Type dropdown storage to Fresh DSC Issues.

alter table public.dsc_fresh_issues add column if not exists class_type text;
alter table public.dsc_fresh_issues drop constraint if exists dsc_fresh_class_type_check;
alter table public.dsc_fresh_issues add constraint dsc_fresh_class_type_check
  check (class_type is null or class_type in ('Class II','Class III'));
