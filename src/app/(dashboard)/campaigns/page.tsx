import { PageIntro } from '@/components/dashboard/page-intro'
import { requireTenant } from '@/lib/auth/guards'
import { createClient } from '@/lib/supabase/server'
import { CheckCircle, Eye, Megaphone, MessageCircle, Send } from 'lucide-react'

interface CampaignRow {
  id: string
  name: string
  type: string
  status: string
  stats?: {
    sent?: number
    delivered?: number
    opened?: number
    replied?: number
  } | null
}

export default async function CampaignsPage() {
  const { tenantId } = await requireTenant()
  const supabase = await createClient()

  const { data: campaigns } = await supabase
    .from('campaigns')
    .select('*')
    .eq('tenant_id', tenantId)
    .order('created_at', { ascending: false })

  const typeLabels: Record<string, string> = {
    review_request: 'Review Request',
    rebooking: 'Rebooking Nudge',
    loyalty: 'Loyalty Reward',
    quote_followup: 'Quote Follow-up',
    invoice_reminder: 'Invoice Reminder',
    custom: 'Custom',
  }

  const campaignRows = (campaigns || []) as CampaignRow[]

  return (
    <div className="dashboard-stack">
      <PageIntro
        eyebrow="Campaign engine"
        title="Retention and follow-up with a clearer pulse."
        description="Review request, rebooking, loyalty, and reminder campaigns now sit in the same product language as conversations and revenue."
        aside={
          <div className="panel-muted w-full rounded-[28px] p-5 lg:max-w-sm">
            <p className="text-sm font-semibold text-[var(--ink)]">{campaignRows.length} active or drafted flows</p>
            <p className="mt-2 text-xs text-[var(--ink-faint)]">Delivery, opens, and replies stay visible at a glance.</p>
          </div>
        }
      />

      {campaignRows.length === 0 ? (
        <div className="panel rounded-[32px]">
          <div className="dashboard-empty">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-[26px] bg-[rgba(208,109,79,0.12)]">
              <Megaphone className="h-7 w-7 text-[var(--accent)]" />
            </div>
            <p className="mt-5 text-lg font-semibold text-[var(--ink)]">No campaigns yet</p>
            <p className="mt-2 text-sm leading-7 text-[var(--ink-soft)]">
              Set up automated review requests, rebooking nudges, and more.
            </p>
          </div>
        </div>
      ) : (
        <div className="grid gap-4 xl:grid-cols-2">
          {campaignRows.map((campaign) => (
            <div key={campaign.id} className="panel rounded-[32px] px-6 py-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <span className="chip">{typeLabels[campaign.type] || campaign.type}</span>
                  <h3 className="mt-4 text-2xl font-semibold text-[var(--ink)]">{campaign.name}</h3>
                </div>
                <span className={campaign.status === 'active' ? 'chip chip-teal' : campaign.status === 'paused' ? 'chip chip-accent' : 'chip'}>
                  {campaign.status}
                </span>
              </div>

              {campaign.stats ? (
                <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
                  {[
                    { label: 'Sent', value: campaign.stats.sent || 0, icon: Send },
                    { label: 'Delivered', value: campaign.stats.delivered || 0, icon: CheckCircle },
                    { label: 'Opened', value: campaign.stats.opened || 0, icon: Eye },
                    { label: 'Replied', value: campaign.stats.replied || 0, icon: MessageCircle },
                  ].map((item) => (
                    <div key={item.label} className="rounded-[24px] bg-white/45 px-4 py-4 text-center">
                      <item.icon className="mx-auto h-4 w-4 text-[var(--ink-faint)]" />
                      <p className="mt-3 text-2xl font-semibold text-[var(--ink)]">{item.value}</p>
                      <p className="mt-1 text-xs uppercase tracking-[0.14em] text-[var(--ink-faint)]">{item.label}</p>
                    </div>
                  ))}
                </div>
              ) : null}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
