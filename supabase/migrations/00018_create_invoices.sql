-- Invoices table
create table if not exists public.invoices (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  client_id uuid references public.clients(id) on delete set null,
  quote_id uuid references public.quotes(id) on delete set null,
  invoice_number text not null,
  line_items jsonb not null default '[]',
  subtotal_cents int not null default 0,
  tax_cents int not null default 0,
  total_cents int not null default 0,
  status text not null default 'draft' check (status in ('draft', 'sent', 'paid', 'overdue', 'cancelled')),
  stripe_invoice_id text,
  stripe_payment_intent_id text,
  pdf_url text,
  notes text,
  due_date date,
  paid_at timestamptz,
  sent_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index idx_invoices_tenant on public.invoices(tenant_id);
create index idx_invoices_client on public.invoices(client_id);
create index idx_invoices_status on public.invoices(tenant_id, status);
create unique index idx_invoices_number on public.invoices(tenant_id, invoice_number);
create index idx_invoices_stripe on public.invoices(stripe_invoice_id);

alter table public.invoices enable row level security;

create policy "Tenant isolation for invoices"
  on public.invoices for all
  using (tenant_id = public.get_user_tenant_id())
  with check (tenant_id = public.get_user_tenant_id());

alter publication supabase_realtime add table public.invoices;
