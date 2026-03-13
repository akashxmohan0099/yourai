create table public.business_rules (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  rule_type text not null check (rule_type in ('hard_boundary', 'soft_guideline')),
  category text,
  rule text not null,
  tool_scope text[] default '{}',
  is_active boolean default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_rules_tenant on public.business_rules(tenant_id);
