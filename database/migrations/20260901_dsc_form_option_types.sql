-- Allow persistent custom Authority and Box Name values in Fresh DSC forms.

alter table public.dsc_form_options drop constraint if exists dsc_form_options_option_type_check;
alter table public.dsc_form_options add constraint dsc_form_options_option_type_check
  check (option_type in ('entity_name','designation','token_name','authority','box_name'));
