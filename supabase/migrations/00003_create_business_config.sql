create table public.business_config (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null unique references public.tenants(id) on delete cascade,
  business_name text,
  industry text,
  description text,
  address jsonb default '{}',
  phone text,
  email text,
  website text,
  hours jsonb default '{}',
  timezone text default 'America/New_York',
  tone text default 'friendly' check (tone in ('professional', 'friendly', 'casual', 'formal')),
  custom_instructions text,
  faqs jsonb default '[]',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_business_config_tenant on public.business_config(tenant_id);
