import { requireTenant } from '@/lib/auth/guards'
import { createClient } from '@/lib/supabase/server'
import { SettingsForm } from '@/components/dashboard/settings-form'
import { PageIntro } from '@/components/dashboard/page-intro'
import { Settings } from 'lucide-react'

export default async function SettingsPage() {
  const { tenantId, tenant } = await requireTenant()
  const supabase = await createClient()

  const { data: config } = await supabase
    .from('business_config')
    .select('*')
    .eq('tenant_id', tenantId)
    .single()

  return (
    <div className="dashboard-stack">
      <PageIntro
        eyebrow="Workspace settings"
        title="Shape how the assistant thinks, sounds, and escalates."
        description="Business details, AI guidance, daily briefings, and channel credentials all live here in one operational configuration surface."
        aside={
          <div className="panel-muted w-full rounded-[28px] p-5 lg:max-w-sm">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[rgba(208,109,79,0.12)]">
                <Settings className="h-5 w-5 text-[var(--accent)]" />
              </div>
              <div>
                <p className="text-sm font-semibold text-[var(--ink)]">{tenant.name}</p>
                <p className="text-xs text-[var(--ink-faint)]">Adjust tone, sync, and daily operator flows.</p>
              </div>
            </div>
          </div>
        }
      />
      <SettingsForm
        tenantId={tenantId}
        tenantSlug={tenant.slug}
        config={config}
      />
    </div>
  )
}
