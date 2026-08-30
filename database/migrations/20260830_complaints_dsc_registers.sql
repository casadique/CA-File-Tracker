-- Integrated Complaint Register and DSC custody registers.
-- Additive migration: no existing File Tracker table or workflow is altered.

create extension if not exists pgcrypto;
create extension if not exists pg_trgm;

create sequence if not exists public.complaint_number_seq start 1;
create sequence if not exists public.dsc_number_seq start 1;
create sequence if not exists public.dsc_request_number_seq start 1;

create table if not exists public.complaint_categories (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  is_active boolean not null default true,
  display_order integer not null default 100,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

insert into public.complaint_categories (name, display_order)
values
  ('Delay in Work', 10), ('Wrong Filing / Error', 20),
  ('Communication Issue', 30), ('Document Issue', 40),
  ('Billing / Fee Issue', 50), ('Staff Behaviour', 60),
  ('Non-Response', 70), ('Service Quality', 80),
  ('Missed Deadline', 90), ('Refund / Payment Issue', 100),
  ('Technical Issue', 110), ('Other', 120)
on conflict (name) do nothing;

create table if not exists public.complaint_settings (
  id text primary key default 'default',
  sla_low_minutes integer not null default 2400,
  sla_normal_minutes integer not null default 1440,
  sla_high_minutes integer not null default 480,
  sla_critical_minutes integer not null default 240,
  acknowledgement_minutes integer not null default 120,
  approaching_minutes integer not null default 120,
  reopen_escalation_count integer not null default 2,
  updated_by uuid references auth.users(id),
  updated_at timestamptz not null default now()
);
insert into public.complaint_settings (id) values ('default') on conflict (id) do nothing;

create table if not exists public.complaints (
  id uuid primary key default gen_random_uuid(),
  complaint_no text not null unique default ('CMP-' || to_char(current_date, 'YYYY') || '-' || lpad(nextval('public.complaint_number_seq')::text, 6, '0')),
  complaint_at timestamptz not null default now(),
  client_type text not null default 'Existing Client' check (client_type in ('Existing Client','Non-Client / General')),
  client_id uuid references public.clients(id) on delete restrict,
  client_name text not null,
  pan_reg_no text,
  contact_person text,
  contact_number text,
  email text,
  source text not null default 'Phone',
  category_id uuid references public.complaint_categories(id),
  category_name text not null default 'Other',
  service_type text,
  related_file_id text references public.file_records(id) on delete set null,
  subject text not null,
  description text not null,
  priority text not null default 'Normal' check (priority in ('Low','Normal','High','Critical')),
  severity text not null default 'Medium' check (severity in ('Low','Medium','High','Critical')),
  status text not null default 'New' check (status in ('New','Acknowledged','Assigned','Under Review','Action in Progress','Waiting for Client','Waiting for Third Party','Escalated','Resolution Proposed','Resolved','Closed','Reopened')),
  assigned_user_id uuid references public.app_users(id) on delete set null,
  assigned_team text,
  assigned_by uuid references auth.users(id),
  assigned_at timestamptz,
  target_resolution_at timestamptz,
  follow_up_at timestamptz,
  sla_due_at timestamptz,
  internal_remarks text,
  attachments jsonb not null default '[]'::jsonb,
  resolution_date date,
  resolution_summary text,
  action_taken text,
  root_cause text,
  corrective_action text,
  preventive_action text,
  compensation_adjustment numeric(14,2),
  follow_up_required boolean not null default false,
  resolved_by uuid references auth.users(id),
  closed_at timestamptz,
  reopen_count integer not null default 0,
  created_by uuid not null references auth.users(id),
  updated_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists complaints_status_priority_idx on public.complaints (status, priority, sla_due_at);
create index if not exists complaints_assigned_idx on public.complaints (assigned_user_id, status, follow_up_at);
create index if not exists complaints_client_idx on public.complaints (client_id, created_at desc);
create index if not exists complaints_file_idx on public.complaints (related_file_id) where related_file_id is not null;
create index if not exists complaints_created_idx on public.complaints (created_at desc);
create index if not exists complaints_search_idx on public.complaints using gin ((client_name || ' ' || complaint_no || ' ' || subject) gin_trgm_ops);

create table if not exists public.complaint_activity (
  id uuid primary key default gen_random_uuid(),
  complaint_id uuid not null references public.complaints(id) on delete cascade,
  activity_type text not null,
  remarks text,
  old_value jsonb,
  new_value jsonb,
  channel text,
  recipient text,
  actor_user_id uuid references auth.users(id),
  actor_name text,
  created_at timestamptz not null default now()
);
create index if not exists complaint_activity_timeline_idx on public.complaint_activity (complaint_id, created_at desc);

create table if not exists public.dsc_settings (
  id text primary key default 'default',
  approval_levels integer not null default 1 check (approval_levels between 0 and 2),
  reminder_days integer[] not null default array[90,60,30,15,7,0],
  approver_user_ids uuid[] not null default '{}',
  updated_by uuid references auth.users(id),
  updated_at timestamptz not null default now()
);
insert into public.dsc_settings (id) values ('default') on conflict (id) do nothing;

create table if not exists public.dsc_boxes (
  id uuid primary key default gen_random_uuid(),
  box_code text not null unique,
  box_name text,
  cabinet text,
  shelf text,
  location text not null,
  capacity integer not null check (capacity > 0),
  is_active boolean not null default true,
  created_by uuid references auth.users(id),
  updated_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.dsc_master (
  id uuid primary key default gen_random_uuid(),
  dsc_id text not null unique default ('DSC-' || lpad(nextval('public.dsc_number_seq')::text, 6, '0')),
  client_id uuid references public.clients(id) on delete restrict,
  client_name text not null,
  pan text,
  entity_name text,
  holder_name text not null,
  holder_designation text,
  din text,
  mobile text,
  email text,
  dsc_type text,
  certificate_class text,
  holder_type text check (holder_type is null or holder_type in ('Individual','Organisation')),
  token_make text,
  token_serial text not null,
  certificate_serial text,
  issued_date date,
  valid_from date,
  expiry_date date,
  status text not null default 'Fresh Issue Pending',
  current_custody text not null default 'Office',
  current_location text,
  box_id uuid references public.dsc_boxes(id) on delete set null,
  slot_position text,
  assigned_user_id uuid references public.app_users(id) on delete set null,
  remarks text,
  created_by uuid not null references auth.users(id),
  updated_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint dsc_no_credentials check (
    lower(coalesce(remarks,'')) !~ '(pin|password|passwd|pwd)[[:space:]]*[:=]'
  )
);
create unique index if not exists dsc_token_serial_unique on public.dsc_master (lower(token_serial));
create unique index if not exists dsc_certificate_serial_unique on public.dsc_master (lower(certificate_serial)) where certificate_serial is not null and certificate_serial <> '';
create index if not exists dsc_expiry_idx on public.dsc_master (expiry_date, status);
create index if not exists dsc_box_slot_idx on public.dsc_master (box_id, slot_position);
create index if not exists dsc_client_idx on public.dsc_master (client_id, expiry_date);
create index if not exists dsc_assigned_idx on public.dsc_master (assigned_user_id, status);
create index if not exists dsc_search_idx on public.dsc_master using gin ((client_name || ' ' || coalesce(pan,'') || ' ' || holder_name || ' ' || token_serial) gin_trgm_ops);

create table if not exists public.dsc_handover_requests (
  id uuid primary key default gen_random_uuid(),
  request_no text not null unique default ('DSC-REQ-' || lpad(nextval('public.dsc_request_number_seq')::text, 6, '0')),
  dsc_id uuid not null references public.dsc_master(id) on delete restrict,
  handover_to text not null,
  purpose text not null,
  proposed_date date not null,
  expected_return_date date,
  related_file_id text references public.file_records(id) on delete set null,
  related_work text,
  remarks text,
  status text not null default 'Requested' check (status in ('Requested','Level 1 Approved','Approved','Rejected','Handed Over','Returned','Cancelled')),
  approval_level integer not null default 0,
  requested_by uuid not null references auth.users(id),
  approved_by uuid references auth.users(id),
  approval_at timestamptz,
  approval_remarks text,
  communication_history jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists dsc_handover_status_idx on public.dsc_handover_requests (status, proposed_date);
create index if not exists dsc_handover_requester_idx on public.dsc_handover_requests (requested_by, created_at desc);

create table if not exists public.dsc_movements (
  id uuid primary key default gen_random_uuid(),
  dsc_id uuid not null references public.dsc_master(id) on delete restrict,
  handover_request_id uuid references public.dsc_handover_requests(id) on delete set null,
  movement_type text not null check (movement_type in ('OUT','RETURN','BOX_CHANGE','MISSING','RESTORED')),
  movement_at timestamptz not null default now(),
  issued_to text,
  purpose text,
  related_file_id text references public.file_records(id) on delete set null,
  expected_return_date date,
  approved_by uuid references auth.users(id),
  handled_by uuid not null references auth.users(id),
  condition text,
  from_box_id uuid references public.dsc_boxes(id) on delete set null,
  from_slot text,
  to_box_id uuid references public.dsc_boxes(id) on delete set null,
  to_slot text,
  remarks text,
  created_at timestamptz not null default now()
);
create index if not exists dsc_movements_timeline_idx on public.dsc_movements (dsc_id, movement_at desc);
create index if not exists dsc_movements_return_due_idx on public.dsc_movements (expected_return_date) where movement_type = 'OUT';

create table if not exists public.dsc_fresh_issues (
  id uuid primary key default gen_random_uuid(),
  application_no text not null unique,
  client_id uuid references public.clients(id) on delete restrict,
  client_name text not null,
  holder_name text not null,
  pan text, mobile text, email text,
  application_date date not null default current_date,
  provider_vendor text, application_type text, holder_type text,
  documents_required text, documents_received text, documents_pending text,
  payment_status text, verification_status text, video_verification_status text,
  status text not null default 'New Request',
  expected_issue_date date, actual_issue_date date, token_received_date date,
  assigned_user_id uuid references public.app_users(id) on delete set null,
  linked_dsc_id uuid references public.dsc_master(id) on delete set null,
  remarks text,
  created_by uuid not null references auth.users(id),
  updated_by uuid references auth.users(id),
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create index if not exists dsc_fresh_status_idx on public.dsc_fresh_issues (status, expected_issue_date);

create table if not exists public.dsc_renewals (
  id uuid primary key default gen_random_uuid(),
  existing_dsc_id uuid not null references public.dsc_master(id) on delete restrict,
  expiry_date date,
  initiated_date date not null default current_date,
  assigned_user_id uuid references public.app_users(id) on delete set null,
  documents_pending text,
  status text not null default 'Renewal Initiated',
  application_submitted_at timestamptz,
  verification_status text,
  new_dsc_issue_date date,
  new_token_serial text,
  new_dsc_id uuid references public.dsc_master(id) on delete set null,
  completion_date date,
  remarks text,
  created_by uuid not null references auth.users(id),
  updated_by uuid references auth.users(id),
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create index if not exists dsc_renewals_status_idx on public.dsc_renewals (status, expiry_date);

create table if not exists public.dsc_activity (
  id uuid primary key default gen_random_uuid(),
  dsc_id uuid not null references public.dsc_master(id) on delete cascade,
  action text not null,
  old_value jsonb,
  new_value jsonb,
  remarks text,
  actor_user_id uuid references auth.users(id),
  actor_name text,
  created_at timestamptz not null default now()
);
create index if not exists dsc_activity_timeline_idx on public.dsc_activity (dsc_id, created_at desc);

create table if not exists public.dsc_reminder_history (
  id uuid primary key default gen_random_uuid(),
  dsc_id uuid not null references public.dsc_master(id) on delete cascade,
  reminder_stage integer not null,
  recipient_user_id uuid,
  channel text not null default 'in_app',
  sent_at timestamptz not null default now(),
  unique (dsc_id, reminder_stage, recipient_user_id, channel)
);

-- All writes and exports pass through the authenticated Express API. Browser
-- clients cannot bypass backend role checks by calling Supabase directly.
alter table public.complaint_categories enable row level security;
alter table public.complaint_settings enable row level security;
alter table public.complaints enable row level security;
alter table public.complaint_activity enable row level security;
alter table public.dsc_settings enable row level security;
alter table public.dsc_boxes enable row level security;
alter table public.dsc_master enable row level security;
alter table public.dsc_handover_requests enable row level security;
alter table public.dsc_movements enable row level security;
alter table public.dsc_fresh_issues enable row level security;
alter table public.dsc_renewals enable row level security;
alter table public.dsc_activity enable row level security;
alter table public.dsc_reminder_history enable row level security;

revoke all on public.complaint_categories, public.complaint_settings, public.complaints,
  public.complaint_activity, public.dsc_settings, public.dsc_boxes, public.dsc_master,
  public.dsc_handover_requests, public.dsc_movements, public.dsc_fresh_issues,
  public.dsc_renewals, public.dsc_activity, public.dsc_reminder_history
from anon, authenticated;

grant all on public.complaint_categories, public.complaint_settings, public.complaints,
  public.complaint_activity, public.dsc_settings, public.dsc_boxes, public.dsc_master,
  public.dsc_handover_requests, public.dsc_movements, public.dsc_fresh_issues,
  public.dsc_renewals, public.dsc_activity, public.dsc_reminder_history
to service_role;
grant usage, select on sequence public.complaint_number_seq, public.dsc_number_seq,
  public.dsc_request_number_seq to service_role;
