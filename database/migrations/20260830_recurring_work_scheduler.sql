-- Recurring Work & Compliance Scheduler.
-- Additive only: generated work is written into the existing app_state.files and
-- file_records stores so the normal File Tracker remains the operational system.

create extension if not exists pgcrypto;

create table if not exists public.recurring_work_settings (
  id text primary key default 'default',
  weekend_rule text not null default 'Keep original date',
  inactive_client_action text not null default 'Ask administrator',
  automatic_document_reminders boolean not null default false,
  scheduler_enabled boolean not null default true,
  updated_by uuid references auth.users(id),
  updated_at timestamptz not null default now()
);
insert into public.recurring_work_settings (id) values ('default') on conflict (id) do nothing;

create table if not exists public.recurring_work_templates (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  service_type text not null,
  work_type text,
  frequency text not null,
  interval_value integer not null default 1 check (interval_value > 0),
  due_date_rule jsonb not null default '{}'::jsonb,
  internal_target_rule jsonb not null default '{}'::jsonb,
  document_due_rule jsonb not null default '{}'::jsonb,
  holiday_rule text not null default 'Keep original date',
  generate_before_days integer not null default 7 check (generate_before_days >= 0),
  checklist jsonb not null default '[]'::jsonb,
  productivity_weight numeric(10,2) not null default 1,
  assigned_team text,
  standard_tat integer,
  billing_frequency text not null default 'No automatic billing',
  active boolean not null default true,
  created_by uuid not null references auth.users(id),
  updated_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.recurring_work_schedules (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients(id) on delete restrict,
  client_name text not null,
  pan_reg_no text,
  service_type text not null,
  work_type text not null,
  return_type text,
  description text,
  frequency text not null check (frequency in ('Weekly','Monthly','Every N months','Quarterly','Half-yearly','Annual','Custom interval')),
  interval_value integer not null default 1 check (interval_value > 0),
  start_date date not null,
  start_period text,
  next_period_start date not null,
  end_date date,
  occurrence_limit integer check (occurrence_limit is null or occurrence_limit > 0),
  generated_count integer not null default 0,
  next_generation_date timestamptz not null,
  next_work_period text,
  due_date_rule jsonb not null default '{}'::jsonb,
  internal_target_rule jsonb not null default '{}'::jsonb,
  document_due_rule jsonb not null default '{}'::jsonb,
  holiday_rule text not null default 'Keep original date',
  generate_before_days integer not null default 7 check (generate_before_days >= 0),
  assignment_type text not null default 'Fixed employee' check (assignment_type in ('Fixed employee','Team assignment','Manager allocation required','Future auto-allocation')),
  assigned_staff_id uuid references public.app_users(id) on delete set null,
  assigned_team text,
  reviewer_id uuid references public.app_users(id) on delete set null,
  priority text not null default 'Medium',
  estimated_completion_days integer,
  standard_fee numeric(14,2),
  productivity_weight numeric(10,2) not null default 1,
  billing_frequency text not null default 'No automatic billing',
  checklist jsonb not null default '[]'::jsonb,
  remarks text,
  active boolean not null default true,
  paused boolean not null default false,
  pause_date date,
  pause_reason text,
  ended_at timestamptz,
  end_reason text,
  created_by uuid not null references auth.users(id),
  updated_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.recurring_work_occurrences (
  id uuid primary key default gen_random_uuid(),
  recurring_schedule_id uuid not null references public.recurring_work_schedules(id) on delete restrict,
  client_id uuid not null references public.clients(id) on delete restrict,
  service_type text not null,
  work_type text not null,
  work_period text not null,
  period_start date not null,
  period_end date not null,
  financial_year text not null,
  scheduled_generation_date timestamptz not null,
  actual_generation_date timestamptz,
  document_due_date date,
  internal_target_date date,
  statutory_due_date date,
  generated_file_id text references public.file_records(id) on delete set null,
  status text not null default 'Scheduled' check (status in ('Scheduled','Generated','Skipped','Already Exists','Failed','Manually Generated')),
  skip_reason text,
  error_message text,
  generated_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (recurring_schedule_id, period_start, work_type)
);

create table if not exists public.recurring_work_audit (
  id uuid primary key default gen_random_uuid(),
  schedule_id uuid references public.recurring_work_schedules(id) on delete cascade,
  occurrence_id uuid references public.recurring_work_occurrences(id) on delete set null,
  action text not null,
  old_value jsonb,
  new_value jsonb,
  actor_user_id uuid references auth.users(id),
  actor_name text,
  created_at timestamptz not null default now()
);

create index if not exists recurring_due_scheduler_idx on public.recurring_work_schedules (next_generation_date, id)
  where active = true and paused = false and ended_at is null;
create index if not exists recurring_client_idx on public.recurring_work_schedules (client_id, active, next_generation_date);
create index if not exists recurring_staff_idx on public.recurring_work_schedules (assigned_staff_id, active, next_generation_date);
create unique index if not exists recurring_schedule_definition_unique on public.recurring_work_schedules (client_id, lower(service_type), lower(work_type), frequency, start_date)
  where ended_at is null;
create index if not exists recurring_occurrence_generated_idx on public.recurring_work_occurrences (actual_generation_date desc, status);
create index if not exists recurring_occurrence_due_idx on public.recurring_work_occurrences (statutory_due_date, status);
create index if not exists recurring_audit_timeline_idx on public.recurring_work_audit (schedule_id, created_at desc);

create or replace function public.recurring_financial_year(p_date date)
returns text language sql immutable as $$
  select case when extract(month from p_date) >= 4
    then extract(year from p_date)::int::text || '-' || right((extract(year from p_date)::int + 1)::text, 2)
    else (extract(year from p_date)::int - 1)::text || '-' || right(extract(year from p_date)::int::text, 2)
  end
$$;

create or replace function public.recurring_period_end(p_start date, p_frequency text, p_interval integer)
returns date language sql immutable as $$
  select case p_frequency
    when 'Weekly' then p_start + 6
    when 'Quarterly' then (p_start + interval '3 months - 1 day')::date
    when 'Half-yearly' then (p_start + interval '6 months - 1 day')::date
    when 'Annual' then (p_start + interval '12 months - 1 day')::date
    when 'Every N months' then (p_start + make_interval(months => greatest(1,p_interval)) - interval '1 day')::date
    when 'Custom interval' then (p_start + (greatest(1,p_interval) - 1))::date
    else (p_start + interval '1 month - 1 day')::date
  end
$$;

create or replace function public.recurring_next_period(p_start date, p_frequency text, p_interval integer)
returns date language sql immutable as $$
  select case p_frequency
    when 'Weekly' then p_start + 7
    when 'Quarterly' then (p_start + interval '3 months')::date
    when 'Half-yearly' then (p_start + interval '6 months')::date
    when 'Annual' then (p_start + interval '12 months')::date
    when 'Every N months' then (p_start + make_interval(months => greatest(1,p_interval)))::date
    when 'Custom interval' then p_start + greatest(1,p_interval)
    else (p_start + interval '1 month')::date
  end
$$;

create or replace function public.recurring_period_label(p_start date, p_frequency text, p_interval integer)
returns text language plpgsql immutable as $$
declare fy text := public.recurring_financial_year(p_start); m int := extract(month from p_start); q int;
begin
  if p_frequency = 'Monthly' or p_frequency = 'Every N months' then return to_char(p_start, 'FMMonth YYYY'); end if;
  if p_frequency = 'Quarterly' then q := case when m between 4 and 6 then 1 when m between 7 and 9 then 2 when m between 10 and 12 then 3 else 4 end; return 'Q' || q || ' FY ' || fy; end if;
  if p_frequency = 'Half-yearly' then return (case when m between 4 and 9 then 'H1' else 'H2' end) || ' FY ' || fy; end if;
  if p_frequency = 'Annual' then return 'FY ' || fy; end if;
  if p_frequency = 'Weekly' then return to_char(p_start,'DD Mon YYYY') || ' - ' || to_char(p_start + 6,'DD Mon YYYY'); end if;
  return to_char(p_start,'DD Mon YYYY') || ' - ' || to_char(public.recurring_period_end(p_start,p_frequency,p_interval),'DD Mon YYYY');
end $$;

create or replace function public.recurring_rule_date(p_period_start date, p_period_end date, p_rule jsonb)
returns date language plpgsql immutable as $$
declare kind text := coalesce(p_rule->>'type','N days after period end'); day_no int := greatest(1,least(31,coalesce((p_rule->>'day')::int,1))); result date;
begin
  if kind = 'Fixed day in same month' then result := make_date(extract(year from p_period_end)::int,extract(month from p_period_end)::int,least(day_no,extract(day from (date_trunc('month',p_period_end)+interval '1 month - 1 day'))::int));
  elsif kind = 'Fixed day in following month' then result := (date_trunc('month',p_period_end)+interval '1 month')::date; result := result + least(day_no,extract(day from (date_trunc('month',result)+interval '1 month - 1 day'))::int)-1;
  elsif kind = 'Fixed annual date' then result := make_date(coalesce((p_rule->>'year')::int,extract(year from p_period_end)::int),coalesce((p_rule->>'month')::int,12),day_no);
  elsif kind = 'Custom manual date' and coalesce(p_rule->>'date','') ~ '^\d{4}-\d{2}-\d{2}$' then result := (p_rule->>'date')::date;
  else result := p_period_end + coalesce((p_rule->>'days')::int,0); end if;
  return result;
exception when others then return p_period_end; end $$;

create or replace function public.recurring_adjust_workday(p_date date, p_rule text)
returns date language plpgsql immutable as $$
declare d date := p_date;
begin
  if p_rule = 'Move to previous working day' then while extract(isodow from d) > 5 loop d := d - 1; end loop;
  elsif p_rule = 'Move to next working day' then while extract(isodow from d) > 5 loop d := d + 1; end loop;
  end if;
  return d;
end $$;

create or replace function public.generate_recurring_work(p_schedule_id uuid, p_actor uuid default null, p_manual boolean default false)
returns jsonb language plpgsql security definer set search_path = public as $$
declare s public.recurring_work_schedules%rowtype; staff public.app_users%rowtype; period_end date; due_date date; internal_date date; document_date date; period_label text; fy text; file_id text := gen_random_uuid()::text; occurrence_id uuid; payload jsonb; next_period date; next_end date; next_due date; next_generation timestamptz; existing public.recurring_work_occurrences%rowtype;
begin
  select * into s from public.recurring_work_schedules where id=p_schedule_id for update;
  if not found then raise exception 'Recurring schedule not found'; end if;
  if not s.active or s.paused or s.ended_at is not null then return jsonb_build_object('status','inactive','scheduleId',s.id); end if;
  if not p_manual and s.next_generation_date > now() then return jsonb_build_object('status','not_due','scheduleId',s.id); end if;
  if s.end_date is not null and s.next_period_start > s.end_date then update public.recurring_work_schedules set active=false,ended_at=now(),end_reason=coalesce(end_reason,'End date reached'),updated_at=now() where id=s.id; return jsonb_build_object('status','ended'); end if;
  if s.occurrence_limit is not null and s.generated_count >= s.occurrence_limit then update public.recurring_work_schedules set active=false,ended_at=now(),end_reason=coalesce(end_reason,'Occurrence limit reached'),updated_at=now() where id=s.id; return jsonb_build_object('status','ended'); end if;
  select * into existing from public.recurring_work_occurrences where recurring_schedule_id=s.id and period_start=s.next_period_start and work_type=s.work_type;
  if found and existing.status = 'Failed' then delete from public.recurring_work_occurrences where id=existing.id;
  elsif found then return jsonb_build_object('status','already_exists','occurrenceId',existing.id,'fileId',existing.generated_file_id); end if;
  period_end := public.recurring_period_end(s.next_period_start,s.frequency,s.interval_value);
  period_label := public.recurring_period_label(s.next_period_start,s.frequency,s.interval_value);
  fy := public.recurring_financial_year(s.next_period_start);
  due_date := public.recurring_adjust_workday(public.recurring_rule_date(s.next_period_start,period_end,s.due_date_rule),s.holiday_rule);
  internal_date := public.recurring_adjust_workday(public.recurring_rule_date(s.next_period_start,period_end,s.internal_target_rule),s.holiday_rule);
  document_date := public.recurring_adjust_workday(public.recurring_rule_date(s.next_period_start,period_end,s.document_due_rule),s.holiday_rule);
  if s.assigned_staff_id is not null then select * into staff from public.app_users where id=s.assigned_staff_id; end if;
  payload := jsonb_build_object('id',file_id,'clientId',s.client_id,'name',s.client_name,'pan',coalesce(s.pan_reg_no,''),'fy',fy,'serviceType',s.service_type,'workType',s.work_type,'returnType',coalesce(s.return_type,''),'workDescription',coalesce(s.description,''),'compliancePeriod',period_label,'periodStart',s.next_period_start,'periodEnd',period_end,'dueDate',due_date,'internalTargetDate',internal_date,'documentDueDate',document_date,'priority',s.priority,'assignedStaffId',coalesce(s.assigned_staff_id::text,''),'assignedStaff',coalesce(staff.name,s.assigned_team,''),'assignedStaffEmail',coalesce(staff.email,''),'reviewerId',coalesce(s.reviewer_id::text,''),'productivityWeight',s.productivity_weight,'standardFee',coalesce(s.standard_fee,0),'billingFrequency',s.billing_frequency,'checklist',s.checklist,'remarks',coalesce(s.remarks,''),'recurringScheduleId',s.id,'fileReceivedDate',current_date,'workAllotmentDate',current_date,'workflowStatus',case when s.assigned_staff_id is null and s.assigned_team is null then 'Received' else 'Allotted' end,'stages',jsonb_build_object('Received',true,'Allotted',(s.assigned_staff_id is not null or s.assigned_team is not null),'WIP',false,'Work Done',false,'Completed',false,'Billed',false,'Removed',false),'filed',false,'billed',false,'isRemoved',false,'createdAt',now(),'updatedAt',extract(epoch from now())*1000);
  insert into public.recurring_work_occurrences(recurring_schedule_id,client_id,service_type,work_type,work_period,period_start,period_end,financial_year,scheduled_generation_date,actual_generation_date,document_due_date,internal_target_date,statutory_due_date,generated_file_id,status,generated_by)
  values(s.id,s.client_id,s.service_type,s.work_type,period_label,s.next_period_start,period_end,fy,s.next_generation_date,now(),document_date,internal_date,due_date,file_id,case when p_manual then 'Manually Generated' else 'Generated' end,p_actor) returning id into occurrence_id;
  payload := payload || jsonb_build_object('recurringOccurrenceId',occurrence_id);
  update public.app_state set state=jsonb_set(state,'{files}',coalesce(state->'files','[]'::jsonb)||jsonb_build_array(payload),true),updated_at=now() where id='default';
  insert into public.file_records(id,client_id,client_name,pan_reg_no,financial_year,service_type,assigned_staff_id,assigned_staff_email,assigned_staff_name,workflow_status,priority,billing_status,file_received_date,due_date,status_updated_at,is_removed,is_completed,is_billed,payload,source_state_updated_at,updated_at)
  values(file_id,s.client_id::text,s.client_name,coalesce(s.pan_reg_no,''),fy,s.service_type,coalesce(s.assigned_staff_id::text,''),coalesce(staff.email,''),coalesce(staff.name,s.assigned_team,''),payload->>'workflowStatus',s.priority,s.billing_frequency,current_date,due_date,now(),false,false,false,payload,now(),now());
  update public.recurring_work_occurrences set generated_file_id=file_id,updated_at=now() where id=occurrence_id;
  next_period := public.recurring_next_period(s.next_period_start,s.frequency,s.interval_value); next_end := public.recurring_period_end(next_period,s.frequency,s.interval_value); next_due := public.recurring_adjust_workday(public.recurring_rule_date(next_period,next_end,s.due_date_rule),s.holiday_rule); next_generation := (next_due::timestamptz - make_interval(days=>s.generate_before_days));
  update public.recurring_work_schedules set next_period_start=next_period,next_work_period=public.recurring_period_label(next_period,s.frequency,s.interval_value),next_generation_date=next_generation,generated_count=generated_count+1,updated_at=now(),updated_by=coalesce(p_actor,updated_by) where id=s.id;
  insert into public.recurring_work_audit(schedule_id,occurrence_id,action,new_value,actor_user_id) values(s.id,occurrence_id,case when p_manual then 'Manual generation' else 'Automatic generation' end,jsonb_build_object('fileId',file_id,'period',period_label),p_actor);
  return jsonb_build_object('status','generated','scheduleId',s.id,'occurrenceId',occurrence_id,'fileId',file_id,'period',period_label,'assignedUserId',s.assigned_staff_id);
exception when unique_violation then return jsonb_build_object('status','already_exists','scheduleId',p_schedule_id); end $$;

alter table public.recurring_work_settings enable row level security;
alter table public.recurring_work_templates enable row level security;
alter table public.recurring_work_schedules enable row level security;
alter table public.recurring_work_occurrences enable row level security;
alter table public.recurring_work_audit enable row level security;
revoke all on public.recurring_work_settings,public.recurring_work_templates,public.recurring_work_schedules,public.recurring_work_occurrences,public.recurring_work_audit from anon,authenticated;
grant all on public.recurring_work_settings,public.recurring_work_templates,public.recurring_work_schedules,public.recurring_work_occurrences,public.recurring_work_audit to service_role;
revoke all on function public.generate_recurring_work(uuid,uuid,boolean) from public,anon,authenticated;
grant execute on function public.generate_recurring_work(uuid,uuid,boolean) to service_role;
