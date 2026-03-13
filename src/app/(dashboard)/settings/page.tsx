import { requireTenant } from '@/lib/auth/guards'
import { createClient } from '@/lib/supabase/server'
import { SettingsForm } from '@/components/dashboard/settings-form'

export default async function SettingsPage() {
  const { tenantId, tenant } = await requireTenant()
  const supabase = await createClient()

  const { data: config } = await supabase
    .from('business_config')
    .select('*')
    .eq('tenant_id', tenantId)
    .single()

  const { data: services } = await supabase
    .from('services')
    .select('*')
    .eq('tenant_id', tenantId)
    .order('sort_order')

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-[#1d1d1f]">Settings</h1>
      <SettingsForm
        tenantId={tenantId}
        tenantSlug={tenant.slug}
        config={config}
        services={services || []}
      />
    </div>
  )
}
