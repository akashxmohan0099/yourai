create table public.tenants (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  owner_id uuid, -- references auth.users(id), set after signup
  logo_url text,
  status text not null default 'onboarding' check (status in ('onboarding', 'active', 'suspended')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_tenants_slug on public.tenants(slug);
create index idx_tenants_owner on public.tenants(owner_id);
