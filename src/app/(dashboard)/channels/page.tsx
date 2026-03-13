import { requireTenant } from '@/lib/auth/guards'
import { createClient } from '@/lib/supabase/server'
import { ChannelConfig } from '@/components/dashboard/channel-config'
import { PageIntro } from '@/components/dashboard/page-intro'
import { Radio } from 'lucide-react'

export default async function ChannelsPage() {
  const { tenantId } = await requireTenant()
  const supabase = await createClient()

  const { data: config } = await supabase
    .from('business_config')
    .select('voice_enabled, sms_enabled, vapi_assistant_id, vapi_phone_number_id, twilio_phone_number, owner_notification_phone, approval_timeout_minutes')
    .eq('tenant_id', tenantId)
    .single()

  return (
    <div className="dashboard-stack">
      <PageIntro
        eyebrow="Channel controls"
        title="Decide where the assistant shows up."
        description="Configure customer-facing entry points, owner notifications, and the approval timing that keeps automation inside your rules."
        aside={
          <div className="panel-muted w-full rounded-[28px] p-5 lg:max-w-sm">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[rgba(43,114,107,0.12)]">
                <Radio className="h-5 w-5 text-[var(--teal)]" />
              </div>
              <div>
                <p className="text-sm font-semibold text-[var(--ink)]">Voice, SMS, and web chat</p>
                <p className="text-xs text-[var(--ink-faint)]">Public entry points and owner alerts.</p>
              </div>
            </div>
          </div>
        }
      />
      <ChannelConfig tenantId={tenantId} config={config || {}} />
    </div>
  )
}
