import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export async function requireAuth() {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()

  if (error || !user) {
    redirect('/login')
  }

  return user
}

export async function requireTenant() {
  const user = await requireAuth()
  const supabase = await createClient()

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('*, tenants(*)')
    .eq('auth_user_id', user.id)
    .single()

  if (!profile) {
    redirect('/signup')
  }

  return {
    user,
    profile,
    tenant: profile.tenants as any,
    tenantId: profile.tenant_id,
    role: profile.role,
  }
}

export async function getTenantBySlug(slug: string) {
  const { createAdminClient } = await import('@/lib/supabase/admin')
  const supabase = createAdminClient()

  const { data: tenant } = await supabase
    .from('tenants')
    .select('*')
    .eq('slug', slug)
    .eq('status', 'active')
    .single()

  return tenant
}
