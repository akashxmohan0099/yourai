create table public.services (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  name text not null,
  description text,
  category text,
  price_cents integer,
  price_type text default 'fixed' check (price_type in ('fixed', 'hourly', 'starting_at', 'quote')),
  duration_minutes integer,
  is_active boolean default true,
  sort_order integer default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_services_tenant on public.services(tenant_id);
