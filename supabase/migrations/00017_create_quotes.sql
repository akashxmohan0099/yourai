-- Quotes table
create table if not exists public.quotes (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  client_id uuid references public.clients(id) on delete set null,
  conversation_id uuid references public.conversations(id) on delete set null,
  quote_number text not null,
  line_items jsonb not null default '[]',
  subtotal_cents int not null default 0,
  tax_cents int not null default 0,
  total_cents int not null default 0,
  status text not null default 'draft' check (status in ('draft', 'sent', 'accepted', 'rejected', 'expired')),
  valid_until date,
  pdf_url text,
  notes text,
  sent_at timestamptz,
  accepted_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index idx_quotes_tenant on public.quotes(tenant_id);
create index idx_quotes_client on public.quotes(client_id);
create index idx_quotes_status on public.quotes(tenant_id, status);
create unique index idx_quotes_number on public.quotes(tenant_id, quote_number);

alter table public.quotes enable row level security;

create policy "Tenant isolation for quotes"
  on public.quotes for all
  using (tenant_id = public.get_user_tenant_id())
  with check (tenant_id = public.get_user_tenant_id());

alter publication supabase_realtime add table public.quotes;
