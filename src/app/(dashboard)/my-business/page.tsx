import { requireTenant } from '@/lib/auth/guards'
import { createClient } from '@/lib/supabase/server'
import { PageIntro } from '@/components/dashboard/page-intro'
import { MyBusinessForm } from '@/components/dashboard/my-business-form'
import { Building2 } from 'lucide-react'

export default async function MyBusinessPage() {
  const { tenantId, tenant } = await requireTenant()
  const supabase = await createClient()

  const [configResult, servicesResult] = await Promise.all([
    supabase.from('business_config').select('*').eq('tenant_id', tenantId).single(),
    supabase
      .from('services')
      .select('id, name, category, price_cents, price_type, duration_minutes, is_active, sort_order')
      .eq('tenant_id', tenantId)
      .order('sort_order'),
  ])

  return (
    <div className="dashboard-stack">
      <PageIntro
        eyebrow="My business"
        title="Your business profile."
        description="Everything your AI assistant knows about your business. Keep it up to date so customers get accurate info."
        aside={
          <div className="panel-muted w-full rounded-[28px] p-5 lg:max-w-sm">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[rgba(43,114,107,0.12)]">
                <Building2 className="h-5 w-5 text-[var(--teal)]" />
              </div>
              <div>
                <p className="text-sm font-semibold text-[var(--ink)]">{tenant.name}</p>
                <p className="text-xs text-[var(--ink-faint)]">Business identity, services, hours, and FAQs.</p>
              </div>
            </div>
          </div>
        }
      />
      <MyBusinessForm
        tenantId={tenantId}
        config={configResult.data}
        services={servicesResult.data || []}
      />
    </div>
  )
}
