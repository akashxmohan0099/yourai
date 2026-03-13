-- Campaigns table
create table if not exists public.campaigns (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  name text not null,
  type text not null check (type in ('review_request', 'rebooking', 'loyalty', 'quote_followup', 'invoice_reminder', 'custom')),
  template jsonb not null default '{}',
  trigger_config jsonb not null default '{}',
  status text not null default 'active' check (status in ('active', 'paused', 'completed')),
  stats jsonb default '{"sent": 0, "delivered": 0, "opened": 0, "replied": 0}',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index idx_campaigns_tenant on public.campaigns(tenant_id);
create index idx_campaigns_status on public.campaigns(tenant_id, status);

alter table public.campaigns enable row level security;

create policy "Tenant isolation for campaigns"
  on public.campaigns for all
  using (tenant_id = public.get_user_tenant_id())
  with check (tenant_id = public.get_user_tenant_id());

-- Campaign sends
create table if not exists public.campaign_sends (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references public.campaigns(id) on delete cascade,
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  client_id uuid references public.clients(id) on delete set null,
  channel text not null,
  status text not null default 'pending' check (status in ('pending', 'sent', 'delivered', 'opened', 'clicked', 'replied', 'failed')),
  content text,
  sent_at timestamptz,
  delivered_at timestamptz,
  created_at timestamptz default now()
);

create index idx_campaign_sends_campaign on public.campaign_sends(campaign_id);
create index idx_campaign_sends_tenant on public.campaign_sends(tenant_id);
create index idx_campaign_sends_status on public.campaign_sends(campaign_id, status);

alter table public.campaign_sends enable row level security;

create policy "Tenant isolation for campaign_sends"
  on public.campaign_sends for all
  using (tenant_id = public.get_user_tenant_id())
  with check (tenant_id = public.get_user_tenant_id());

-- Add Stripe config to business_config
alter table public.business_config
  add column if not exists stripe_account_id text,
  add column if not exists stripe_connected boolean default false,
  add column if not exists default_tax_rate numeric(5,2) default 0;
