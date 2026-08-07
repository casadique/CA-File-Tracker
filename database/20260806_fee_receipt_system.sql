-- Durable relational mirror for the receipt system. The deployed application also
-- stores its atomic payment/receipt snapshot in app_state for backward compatibility.
create table if not exists public.receipt_sequences (
  financial_year text not null, receipt_series text not null,
  last_used_number bigint not null default 0, updated_at timestamptz not null default now(),
  primary key (financial_year, receipt_series),
  constraint receipt_sequence_nonnegative check (last_used_number >= 0)
);

create table if not exists public.payment_receipts (
  receipt_id uuid primary key, payment_id text not null, transaction_id text,
  billing_record_id text, file_id text, client_id uuid, bill_id uuid,
  receipt_number text not null unique, receipt_type text not null,
  financial_year text not null, receipt_issue_date date not null, payment_date date not null,
  receipt_snapshot jsonb not null, amount_received numeric(14,2) not null,
  previous_amount_received numeric(14,2) not null default 0,
  approved_discount numeric(14,2) not null default 0,
  approved_adjustment numeric(14,2) not null default 0,
  outstanding_balance numeric(14,2) not null default 0,
  payment_status text not null, payment_mode text not null, account text not null,
  payment_reference text, pdf_storage_reference text, verification_reference text not null unique,
  status text not null default 'Issued', idempotency_key text not null unique,
  issued_by uuid references auth.users(id), issued_at timestamptz not null default now(),
  cancelled_by uuid references auth.users(id), cancelled_at timestamptz, cancellation_reason text,
  constraint receipt_type_valid check (receipt_type in ('Payment Receipt','Receipt Voucher')),
  constraint receipt_status_valid check (status in ('Issued','Cancelled','Reversed')),
  constraint receipt_amount_nonnegative check (amount_received > 0 and approved_discount >= 0 and approved_adjustment >= 0 and outstanding_balance >= 0)
);

create unique index if not exists one_active_receipt_per_payment
  on public.payment_receipts (payment_id) where status = 'Issued';

create table if not exists public.receipt_events (
  event_id uuid primary key default gen_random_uuid(),
  receipt_id uuid not null references public.payment_receipts(receipt_id) on delete restrict,
  action text not null, previous_value jsonb, new_value jsonb,
  actor_user_id uuid references auth.users(id), reason text,
  created_at timestamptz not null default now()
);

alter table public.receipt_sequences enable row level security;
alter table public.payment_receipts enable row level security;
alter table public.receipt_events enable row level security;
-- Server service-role access only; no direct browser write policies are created.
