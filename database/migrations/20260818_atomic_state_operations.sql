begin;

create or replace function public.apply_app_state_operations(
  p_expected_updated_at timestamptz,
  p_operations jsonb,
  p_updated_by uuid default null
)
returns table(updated_at timestamptz)
language plpgsql
security definer
set search_path = public
as $$
declare
  working_state jsonb;
  operation_item jsonb;
  operation_name text;
  state_key text;
  target_id text;
  replacement_value jsonb;
  current_array jsonb;
  next_array jsonb;
  row_exists boolean;
begin
  if p_expected_updated_at is null then
    raise exception 'Expected state version is required' using errcode = '22023';
  end if;
  if p_operations is null or jsonb_typeof(p_operations) <> 'array' then
    raise exception 'State operations must be a JSON array' using errcode = '22023';
  end if;
  if jsonb_array_length(p_operations) > 5000 then
    raise exception 'Too many state operations' using errcode = '22023';
  end if;

  select current.state
    into working_state
  from public.app_state as current
  where current.id = 'default'
    and current.updated_at = p_expected_updated_at
  for update;

  if not found then
    return;
  end if;

  for operation_item in select value from jsonb_array_elements(p_operations)
  loop
    operation_name := operation_item ->> 'op';
    state_key := operation_item ->> 'key';
    if state_key is null or state_key = '' then
      raise exception 'State operation key is required' using errcode = '22023';
    end if;

    if operation_name = 'replace' then
      if not (operation_item ? 'value') then
        raise exception 'Replace operation value is required' using errcode = '22023';
      end if;
      working_state := jsonb_set(working_state, array[state_key], operation_item -> 'value', true);

    elsif operation_name = 'upsert' then
      replacement_value := operation_item -> 'value';
      target_id := replacement_value ->> 'id';
      if jsonb_typeof(replacement_value) <> 'object' or target_id is null or target_id = '' then
        raise exception 'Upsert operation requires an object with an id' using errcode = '22023';
      end if;
      current_array := coalesce(working_state -> state_key, '[]'::jsonb);
      if jsonb_typeof(current_array) <> 'array' then
        raise exception 'Upsert target must be an array' using errcode = '22023';
      end if;
      select exists(
        select 1 from jsonb_array_elements(current_array) as row_value
        where row_value ->> 'id' = target_id
      ) into row_exists;

      if row_exists then
        select coalesce(jsonb_agg(
          case when row_value ->> 'id' = target_id then replacement_value else row_value end
          order by row_number
        ), '[]'::jsonb)
        into next_array
        from jsonb_array_elements(current_array) with ordinality as rows(row_value, row_number);
      elsif operation_item ->> 'position' = 'append' then
        next_array := current_array || jsonb_build_array(replacement_value);
      else
        next_array := jsonb_build_array(replacement_value) || current_array;
      end if;
      working_state := jsonb_set(working_state, array[state_key], next_array, true);

    elsif operation_name = 'remove' then
      target_id := operation_item ->> 'id';
      if target_id is null or target_id = '' then
        raise exception 'Remove operation id is required' using errcode = '22023';
      end if;
      current_array := coalesce(working_state -> state_key, '[]'::jsonb);
      if jsonb_typeof(current_array) <> 'array' then
        raise exception 'Remove target must be an array' using errcode = '22023';
      end if;
      select coalesce(jsonb_agg(row_value order by row_number), '[]'::jsonb)
      into next_array
      from jsonb_array_elements(current_array) with ordinality as rows(row_value, row_number)
      where row_value ->> 'id' is distinct from target_id;
      working_state := jsonb_set(working_state, array[state_key], next_array, true);

    else
      raise exception 'Unsupported state operation: %', operation_name using errcode = '22023';
    end if;
  end loop;

  return query
  update public.app_state as current
  set
    state = working_state,
    updated_by = p_updated_by,
    updated_at = greatest(clock_timestamp(), p_expected_updated_at + interval '1 microsecond')
  where current.id = 'default'
    and current.updated_at = p_expected_updated_at
  returning current.updated_at;
end;
$$;

revoke all on function public.apply_app_state_operations(timestamptz, jsonb, uuid) from public;
revoke all on function public.apply_app_state_operations(timestamptz, jsonb, uuid) from anon;
revoke all on function public.apply_app_state_operations(timestamptz, jsonb, uuid) from authenticated;
grant execute on function public.apply_app_state_operations(timestamptz, jsonb, uuid) to service_role;

comment on function public.apply_app_state_operations(timestamptz, jsonb, uuid) is
  'Service-only compare-and-swap application of granular app_state row operations.';

commit;
