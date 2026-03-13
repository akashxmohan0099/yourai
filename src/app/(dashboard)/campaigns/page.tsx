import { requireTenant } from '@/lib/auth/guards'
import { createClient } from '@/lib/supabase/server'
import { Megaphone, Send, Eye, MessageCircle, CheckCircle } from 'lucide-react'

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

  const typeIcons: Record<string, string> = {
    review_request: 'bg-amber-50 text-amber-600',
    rebooking: 'bg-[#f5f5f7] text-[#1d1d1f]',
    loyalty: 'bg-emerald-50 text-emerald-600',
    quote_followup: 'bg-[#f5f5f7] text-[#1d1d1f]',
    invoice_reminder: 'bg-red-50 text-red-500',
    custom: 'bg-[#f5f5f7] text-[#424245]',
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-[#1d1d1f] mb-1">Campaigns</h1>
        <p className="text-[#86868b]">Automated retention and engagement campaigns</p>
      </div>

      {!campaigns || campaigns.length === 0 ? (
        <div className="bg-white rounded-2xl border border-[#d2d2d7] shadow-sm px-6 py-16 text-center">
          <div className="w-12 h-12 rounded-2xl bg-[#f5f5f7] flex items-center justify-center mx-auto mb-4">
            <Megaphone className="w-6 h-6 text-[#86868b]" />
          </div>
          <p className="text-[#424245] font-medium mb-1">No campaigns yet</p>
          <p className="text-sm text-[#86868b]">
            Set up automated review requests, rebooking nudges, and more
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {campaigns.map((campaign: any) => (
            <div key={campaign.id} className="bg-white rounded-2xl border border-[#d2d2d7] shadow-sm p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-xl ${typeIcons[campaign.type] || 'bg-[#f5f5f7] text-[#424245]'}`}>
                    <Megaphone className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-[#1d1d1f]">{campaign.name}</h3>
                    <p className="text-xs text-[#86868b] mt-0.5">
                      {typeLabels[campaign.type] || campaign.type}
                    </p>
                  </div>
                </div>
                <span
                  className={`px-3 py-1 text-xs font-medium rounded-full ${
                    campaign.status === 'active'
                      ? 'bg-emerald-100 text-emerald-700'
                      : campaign.status === 'paused'
                      ? 'bg-amber-100 text-amber-700'
                      : 'bg-[#f5f5f7] text-[#424245]'
                  }`}
                >
                  {campaign.status}
                </span>
              </div>
              {campaign.stats && (
                <div className="grid grid-cols-4 gap-3 pt-4 border-t border-[#f5f5f7]">
                  <div className="text-center">
                    <div className="flex justify-center mb-1">
                      <Send className="w-3.5 h-3.5 text-[#86868b]" />
                    </div>
                    <p className="text-lg font-semibold text-[#1d1d1f]">{campaign.stats.sent || 0}</p>
                    <p className="text-xs text-[#86868b]">Sent</p>
                  </div>
                  <div className="text-center">
                    <div className="flex justify-center mb-1">
                      <CheckCircle className="w-3.5 h-3.5 text-[#86868b]" />
                    </div>
                    <p className="text-lg font-semibold text-[#1d1d1f]">{campaign.stats.delivered || 0}</p>
                    <p className="text-xs text-[#86868b]">Delivered</p>
                  </div>
                  <div className="text-center">
                    <div className="flex justify-center mb-1">
                      <Eye className="w-3.5 h-3.5 text-[#86868b]" />
                    </div>
                    <p className="text-lg font-semibold text-[#1d1d1f]">{campaign.stats.opened || 0}</p>
                    <p className="text-xs text-[#86868b]">Opened</p>
                  </div>
                  <div className="text-center">
                    <div className="flex justify-center mb-1">
                      <MessageCircle className="w-3.5 h-3.5 text-[#86868b]" />
                    </div>
                    <p className="text-lg font-semibold text-[#1d1d1f]">{campaign.stats.replied || 0}</p>
                    <p className="text-xs text-[#86868b]">Replied</p>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
