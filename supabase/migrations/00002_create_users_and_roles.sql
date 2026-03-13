create table public.user_profiles (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid not null,
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  role text not null default 'owner' check (role in ('owner', 'admin', 'staff', 'viewer')),
  display_name text,
  phone text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(auth_user_id, tenant_id)
);

create index idx_user_profiles_auth on public.user_profiles(auth_user_id);
create index idx_user_profiles_tenant on public.user_profiles(tenant_id);
