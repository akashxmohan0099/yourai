create table public.clients (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  name text,
  email text,
  phone text,
  metadata jsonb default '{}',
  first_seen_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now(),
  source_channel text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_clients_tenant on public.clients(tenant_id);
create index idx_clients_email on public.clients(tenant_id, email);
create index idx_clients_phone on public.clients(tenant_id, phone);
