-- Leads table
create table if not exists public.leads (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  client_id uuid references public.clients(id) on delete set null,
  source_channel text,
  status text not null default 'new' check (status in ('new', 'contacted', 'qualified', 'proposal', 'won', 'lost')),
  score int default 0,
  notes text,
  assigned_to uuid references public.user_profiles(id) on delete set null,
  last_contacted_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index idx_leads_tenant on public.leads(tenant_id);
create index idx_leads_status on public.leads(tenant_id, status);
create index idx_leads_client on public.leads(client_id);

alter table public.leads enable row level security;

create policy "Tenant isolation for leads"
  on public.leads for all
  using (tenant_id = public.get_user_tenant_id())
  with check (tenant_id = public.get_user_tenant_id());

alter publication supabase_realtime add table public.leads;
