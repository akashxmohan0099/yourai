-- Helper function to get current user's tenant ID
create or replace function public.get_user_tenant_id()
returns uuid
language sql
security definer
stable
as $$
  select tenant_id
  from public.user_profiles
  where auth_user_id = auth.uid()
  limit 1;
$$;

-- Enable RLS on all tables
alter table public.tenants enable row level security;
alter table public.user_profiles enable row level security;
alter table public.business_config enable row level security;
alter table public.services enable row level security;
alter table public.clients enable row level security;
alter table public.conversations enable row level security;
alter table public.messages enable row level security;
alter table public.ai_audit_log enable row level security;
alter table public.business_rules enable row level security;

-- Tenants policies
create policy "Users can view their own tenant"
  on public.tenants for select
  using (id = public.get_user_tenant_id());

create policy "Owners can update their tenant"
  on public.tenants for update
  using (id = public.get_user_tenant_id());

-- User profiles policies
create policy "Users can view profiles in their tenant"
  on public.user_profiles for select
  using (tenant_id = public.get_user_tenant_id());

create policy "Users can update their own profile"
  on public.user_profiles for update
  using (auth_user_id = auth.uid());

-- Business config policies
create policy "Users can view their business config"
  on public.business_config for select
  using (tenant_id = public.get_user_tenant_id());

create policy "Users can insert their business config"
  on public.business_config for insert
  with check (tenant_id = public.get_user_tenant_id());

create policy "Users can update their business config"
  on public.business_config for update
  using (tenant_id = public.get_user_tenant_id());

-- Services policies
create policy "Anyone can view active services by tenant"
  on public.services for select
  using (true);

create policy "Users can insert services in their tenant"
  on public.services for insert
  with check (tenant_id = public.get_user_tenant_id());

create policy "Users can update services in their tenant"
  on public.services for update
  using (tenant_id = public.get_user_tenant_id());

create policy "Users can delete services in their tenant"
  on public.services for delete
  using (tenant_id = public.get_user_tenant_id());

-- Clients policies
create policy "Users can view clients in their tenant"
  on public.clients for select
  using (tenant_id = public.get_user_tenant_id());

create policy "Users can insert clients in their tenant"
  on public.clients for insert
  with check (tenant_id = public.get_user_tenant_id());

create policy "Users can update clients in their tenant"
  on public.clients for update
  using (tenant_id = public.get_user_tenant_id());

-- Conversations policies
create policy "Users can view conversations in their tenant"
  on public.conversations for select
  using (tenant_id = public.get_user_tenant_id());

create policy "Users can insert conversations in their tenant"
  on public.conversations for insert
  with check (tenant_id = public.get_user_tenant_id());

create policy "Users can update conversations in their tenant"
  on public.conversations for update
  using (tenant_id = public.get_user_tenant_id());

-- Messages policies
create policy "Users can view messages in their tenant"
  on public.messages for select
  using (tenant_id = public.get_user_tenant_id());

create policy "Users can insert messages in their tenant"
  on public.messages for insert
  with check (tenant_id = public.get_user_tenant_id());

-- AI audit log policies
create policy "Users can view audit logs in their tenant"
  on public.ai_audit_log for select
  using (tenant_id = public.get_user_tenant_id());

create policy "Users can insert audit logs in their tenant"
  on public.ai_audit_log for insert
  with check (tenant_id = public.get_user_tenant_id());

-- Business rules policies
create policy "Users can view rules in their tenant"
  on public.business_rules for select
  using (tenant_id = public.get_user_tenant_id());

create policy "Users can insert rules in their tenant"
  on public.business_rules for insert
  with check (tenant_id = public.get_user_tenant_id());

create policy "Users can update rules in their tenant"
  on public.business_rules for update
  using (tenant_id = public.get_user_tenant_id());

create policy "Users can delete rules in their tenant"
  on public.business_rules for delete
  using (tenant_id = public.get_user_tenant_id());
