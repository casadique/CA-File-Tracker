-- Normalized invoice schema for installations moving invoices out of app_state.
-- The current application remains backward-compatible with the central app_state
-- document; this migration supplies database-level uniqueness and immutable history.
create table if not exists public.invoice_settings (
  id text primary key default 'default', settings jsonb not null default '{}'::jsonb,
  updated_by uuid references auth.users(id), updated_at timestamptz not null default now(),
  constraint invoice_settings_singleton check (id = 'default')
);

create table if not exists public.invoice_sequences (
  financial_year text not null, invoice_series text not null,
  last_used_number bigint not null default 0, updated_at timestamptz not null default now(),
  primary key (financial_year, invoice_series),
  constraint invoice_sequence_nonnegative check (last_used_number >= 0)
);

create table if not exists public.invoices (
  invoice_id uuid primary key default gen_random_uuid(),
  billing_record_id text not null, file_id text not null, client_id uuid,
  draft_reference text not null unique, invoice_number text unique,
  financial_year text not null, invoice_date date not null, due_date date,
  document_type text not null default 'Tax Invoice', status text not null default 'Draft',
  place_of_supply text not null, reverse_charge boolean not null default false,
  tax_inclusive boolean not null default false,
  supplier_snapshot jsonb not null, recipient_snapshot jsonb not null,
  gross_amount numeric(14,2) not null default 0, discount_amount numeric(14,2) not null default 0,
  taxable_amount numeric(14,2) not null default 0, cgst_amount numeric(14,2) not null default 0,
  sgst_amount numeric(14,2) not null default 0, igst_amount numeric(14,2) not null default 0,
  round_off numeric(14,2) not null default 0, invoice_total numeric(14,2) not null default 0,
  amount_received numeric(14,2) not null default 0, outstanding_amount numeric(14,2) not null default 0,
  pdf_storage_reference text, irn text, acknowledgement_number text,
  acknowledgement_date timestamptz, e_invoice_status text,
  created_by uuid references auth.users(id), issued_by uuid references auth.users(id),
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  issued_at timestamptz, cancelled_by uuid references auth.users(id), cancelled_at timestamptz,
  cancellation_reason text,
  constraint invoice_status_valid check (status in ('Draft','Issued','Cancelled','Credit Note Issued')),
  constraint issued_invoice_has_number check (status <> 'Issued' or invoice_number is not null),
  constraint invoice_values_nonnegative check (gross_amount >= 0 and taxable_amount >= 0 and invoice_total >= 0)
);

create unique index if not exists one_live_invoice_per_billing_record
  on public.invoices (billing_record_id) where status in ('Draft','Issued');

create table if not exists public.invoice_items (
  invoice_item_id uuid primary key default gen_random_uuid(), invoice_id uuid not null references public.invoices(invoice_id) on delete restrict,
  service_id text, description text not null, service_period text, sac text not null,
  quantity numeric(14,3) not null default 1, unit text not null default 'Service', rate numeric(14,2) not null,
  gross_amount numeric(14,2) not null, discount numeric(14,2) not null default 0,
  taxable_value numeric(14,2) not null, gst_rate numeric(7,3) not null default 0,
  cgst_rate numeric(7,3) not null default 0, cgst_amount numeric(14,2) not null default 0,
  sgst_rate numeric(7,3) not null default 0, sgst_amount numeric(14,2) not null default 0,
  igst_rate numeric(7,3) not null default 0, igst_amount numeric(14,2) not null default 0,
  line_total numeric(14,2) not null,
  constraint invoice_item_values_nonnegative check (quantity > 0 and rate >= 0 and taxable_value >= 0 and line_total >= 0)
);

create table if not exists public.invoice_audit_events (
  event_id uuid primary key default gen_random_uuid(), invoice_id uuid references public.invoices(invoice_id) on delete restrict,
  action text not null, previous_value jsonb, new_value jsonb, actor_user_id uuid references auth.users(id),
  remarks text, created_at timestamptz not null default now()
);

alter table public.invoice_settings enable row level security;
alter table public.invoice_sequences enable row level security;
alter table public.invoices enable row level security;
alter table public.invoice_items enable row level security;
alter table public.invoice_audit_events enable row level security;

-- All application invoice writes are server-only through the service-role client.
-- Authenticated direct browser access is intentionally denied by the absence of policies.
