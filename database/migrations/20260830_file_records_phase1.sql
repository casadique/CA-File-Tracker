-- Phase 1: lossless relational shadow table for file records.
--
-- This migration is additive and reversible. The existing app_state.files JSON
-- array remains the source of truth until the application read flag is enabled
-- after parity verification.

create table if not exists public.file_records (
  id text primary key,
  client_id text,
  client_name text not null default '',
  pan_reg_no text not null default '',
  financial_year text not null default '',
  service_type text not null default '',
  care_of text not null default '',
  assigned_staff_id text not null default '',
  assigned_staff_email text not null default '',
  assigned_staff_name text not null default '',
  workflow_status text not null default '',
  priority text not null default '',
  billing_status text not null default '',
  file_received_date date,
  due_date date,
  status_updated_at timestamptz,
  is_removed boolean not null default false,
  is_completed boolean not null default false,
  is_billed boolean not null default false,
  payload jsonb not null,
  source_state_updated_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  constraint file_records_payload_object check (jsonb_typeof(payload) = 'object')
);

create index if not exists file_records_received_date_idx
  on public.file_records (file_received_date desc, id);
create index if not exists file_records_due_date_idx
  on public.file_records (due_date, id)
  where deleted_at is null and is_removed = false;
create index if not exists file_records_status_updated_idx
  on public.file_records (status_updated_at desc nulls last, id)
  where deleted_at is null;
create index if not exists file_records_assigned_staff_id_idx
  on public.file_records (assigned_staff_id)
  where deleted_at is null;
create index if not exists file_records_assigned_staff_email_idx
  on public.file_records (lower(assigned_staff_email))
  where deleted_at is null;
create index if not exists file_records_service_type_idx
  on public.file_records (service_type)
  where deleted_at is null;
create index if not exists file_records_workflow_status_idx
  on public.file_records (workflow_status)
  where deleted_at is null;
create index if not exists file_records_client_name_idx
  on public.file_records (lower(client_name), id)
  where deleted_at is null;
create index if not exists file_records_pan_idx
  on public.file_records (lower(pan_reg_no), id)
  where deleted_at is null;
create index if not exists file_records_active_billing_idx
  on public.file_records (is_removed, is_completed, is_billed, file_received_date desc)
  where deleted_at is null;

alter table public.file_records enable row level security;
revoke all on table public.file_records from anon, authenticated;
grant select, insert, update, delete on table public.file_records to service_role;

create table if not exists public.file_migration_runs (
  id bigint generated always as identity primary key,
  executed_at timestamptz not null default now(),
  source_state_updated_at timestamptz,
  central_file_count integer not null default 0,
  relational_file_count integer not null default 0,
  status text not null,
  details jsonb not null default '{}'::jsonb
);

alter table public.file_migration_runs enable row level security;
revoke all on table public.file_migration_runs from anon, authenticated;
grant select, insert on table public.file_migration_runs to service_role;
grant usage, select on sequence public.file_migration_runs_id_seq to service_role;

with source_state as (
  select updated_at, coalesce(state -> 'files', '[]'::jsonb) as files
    from public.app_state
   where id = 'default'
), raw_source_files as (
  select source_state.updated_at as state_updated_at, item as payload
    from source_state
    cross join lateral jsonb_array_elements(source_state.files) as item
   where nullif(trim(item ->> 'id'), '') is not null
), source_files as (
  select distinct on (payload ->> 'id') state_updated_at, payload
    from raw_source_files
   order by payload ->> 'id',
            coalesce(payload ->> 'updatedAt', payload ->> 'updated_at', payload ->> 'statusUpdatedAt', '') desc
), normalized as (
  select
    payload ->> 'id' as id,
    nullif(coalesce(payload ->> 'clientId', payload ->> 'client_id'), '') as client_id,
    coalesce(payload ->> 'name', payload ->> 'clientName', payload ->> 'client_name', '') as client_name,
    coalesce(payload ->> 'pan', payload ->> 'panRegNo', payload ->> 'pan_reg_no', '') as pan_reg_no,
    coalesce(payload ->> 'fy', payload ->> 'financialYear', payload ->> 'financial_year', '') as financial_year,
    coalesce(payload ->> 'serviceType', payload ->> 'service_type', '') as service_type,
    coalesce(payload ->> 'careOf', payload ->> 'care_of', '') as care_of,
    coalesce(payload ->> 'assignedStaffId', payload ->> 'assigned_staff_id', '') as assigned_staff_id,
    lower(coalesce(payload ->> 'assignedStaffEmail', payload ->> 'assigned_staff_email', '')) as assigned_staff_email,
    coalesce(payload ->> 'assignedStaff', payload ->> 'assigned_staff', '') as assigned_staff_name,
    coalesce(payload ->> 'workflowStatus', payload ->> 'workflow_status', payload ->> 'status', '') as workflow_status,
    coalesce(payload ->> 'priority', '') as priority,
    coalesce(payload ->> 'billingStatus', payload ->> 'billing_status', payload ->> 'billingType', '') as billing_status,
    case
      when coalesce(payload ->> 'fileReceivedDate', payload ->> 'file_received_date', '') ~ '^\d{4}-\d{2}-\d{2}$'
      then coalesce(payload ->> 'fileReceivedDate', payload ->> 'file_received_date')::date
    end as file_received_date,
    case
      when coalesce(payload ->> 'dueDate', payload ->> 'due_date', '') ~ '^\d{4}-\d{2}-\d{2}$'
      then coalesce(payload ->> 'dueDate', payload ->> 'due_date')::date
    end as due_date,
    case
      when coalesce(payload ->> 'status_updated_at', payload ->> 'statusUpdatedAt', payload ->> 'updated_at', '') ~ '^\d{4}-\d{2}-\d{2}[T ]'
      then coalesce(payload ->> 'status_updated_at', payload ->> 'statusUpdatedAt', payload ->> 'updated_at')::timestamptz
    end as status_updated_at,
    lower(coalesce(payload ->> 'isRemoved', payload ->> 'is_removed', 'false')) in ('true', '1', 'yes')
      or lower(coalesce(payload ->> 'status', payload ->> 'workflowStatus', '')) = 'removed' as is_removed,
    lower(coalesce(payload ->> 'filed', payload ->> 'isCompleted', payload ->> 'is_completed', 'false')) in ('true', '1', 'yes')
      or coalesce(payload #>> '{stages,Completed}', 'false') = 'true' as is_completed,
    lower(coalesce(payload ->> 'billed', payload ->> 'isBilled', payload ->> 'is_billed', 'false')) in ('true', '1', 'yes')
      or coalesce(payload #>> '{stages,Billed}', 'false') = 'true' as is_billed,
    payload,
    state_updated_at
  from source_files
)
insert into public.file_records (
  id, client_id, client_name, pan_reg_no, financial_year, service_type, care_of,
  assigned_staff_id, assigned_staff_email, assigned_staff_name, workflow_status,
  priority, billing_status, file_received_date, due_date, status_updated_at,
  is_removed, is_completed, is_billed, payload, source_state_updated_at,
  updated_at, deleted_at
)
select
  id, client_id, client_name, pan_reg_no, financial_year, service_type, care_of,
  assigned_staff_id, assigned_staff_email, assigned_staff_name, workflow_status,
  priority, billing_status, file_received_date, due_date, status_updated_at,
  is_removed, is_completed, is_billed, payload, state_updated_at,
  now(), null
from normalized
on conflict (id) do update set
  client_id = excluded.client_id,
  client_name = excluded.client_name,
  pan_reg_no = excluded.pan_reg_no,
  financial_year = excluded.financial_year,
  service_type = excluded.service_type,
  care_of = excluded.care_of,
  assigned_staff_id = excluded.assigned_staff_id,
  assigned_staff_email = excluded.assigned_staff_email,
  assigned_staff_name = excluded.assigned_staff_name,
  workflow_status = excluded.workflow_status,
  priority = excluded.priority,
  billing_status = excluded.billing_status,
  file_received_date = excluded.file_received_date,
  due_date = excluded.due_date,
  status_updated_at = excluded.status_updated_at,
  is_removed = excluded.is_removed,
  is_completed = excluded.is_completed,
  is_billed = excluded.is_billed,
  payload = excluded.payload,
  source_state_updated_at = excluded.source_state_updated_at,
  updated_at = now(),
  deleted_at = null;

insert into public.file_migration_runs (
  source_state_updated_at,
  central_file_count,
  relational_file_count,
  status,
  details
)
select
  source.updated_at,
  source.central_count,
  relational.relational_count,
  case when source.central_count = relational.relational_count then 'parity-count-ok' else 'count-mismatch' end,
  jsonb_build_object('phase', 1, 'source', 'app_state.files', 'readCutover', false)
from (
  select updated_at, jsonb_array_length(coalesce(state -> 'files', '[]'::jsonb)) as central_count
    from public.app_state
   where id = 'default'
) source
cross join (
  select count(*)::integer as relational_count
    from public.file_records
   where deleted_at is null
) relational;

comment on table public.file_records is
  'Phase 1 relational shadow of app_state.files. payload is lossless; indexed columns support the later read cutover.';
comment on table public.file_migration_runs is
  'Audit trail for controlled app_state.files to file_records migration and parity checks.';
