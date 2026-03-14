-- Fix 1: Prevent users from changing their own role
-- Drop the old policy that allows updating any column
drop policy if exists "Users can update their own profile" on public.user_profiles;

-- New policy: users can update their own profile but NOT the role column
-- We use a column-level approach: create a restrictive policy
create policy "Users can update own profile (not role)"
  on public.user_profiles for update
  using (auth_user_id = auth.uid())
  with check (
    auth_user_id = auth.uid()
    -- Ensure role hasn't changed from the existing value
    and role = (select up.role from public.user_profiles up where up.auth_user_id = auth.uid() limit 1)
  );

-- Fix 2: Only owners/admins can update business_config
drop policy if exists "Users can update their business config" on public.business_config;

create or replace function public.get_user_role()
returns text
language sql
security definer
stable
as $$
  select role
  from public.user_profiles
  where auth_user_id = auth.uid()
  limit 1;
$$;

create policy "Owners and admins can update business config"
  on public.business_config for update
  using (
    tenant_id = public.get_user_tenant_id()
    and public.get_user_role() in ('owner', 'admin')
  );

-- Fix 3: Only owners can update tenant details
drop policy if exists "Owners can update their tenant" on public.tenants;

create policy "Only owners can update tenant"
  on public.tenants for update
  using (
    id = public.get_user_tenant_id()
    and public.get_user_role() = 'owner'
  );

-- Fix 4: Services SELECT should be tenant-scoped, not using(true)
drop policy if exists "Anyone can view active services by tenant" on public.services;

-- Public chat needs to read services, so we allow select for the tenant
-- but the public chat uses service-role which bypasses RLS anyway
create policy "Users can view services in their tenant"
  on public.services for select
  using (tenant_id = public.get_user_tenant_id());

-- Fix 5: Allow campaign_sends with NULL campaign_id for ad-hoc sends (invoice reminders)
alter table public.campaign_sends
  alter column campaign_id drop not null;
