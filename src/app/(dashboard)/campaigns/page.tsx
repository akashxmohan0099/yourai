import { requireTenant } from '@/lib/auth/guards'
import { createClient } from '@/lib/supabase/server'
import { Megaphone, Play, Pause } from 'lucide-react'

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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Campaigns</h1>
        <p className="text-gray-500">Automated retention and engagement campaigns</p>
      </div>

      {!campaigns || campaigns.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 px-5 py-12 text-center">
          <Megaphone className="w-10 h-10 mx-auto mb-3 text-gray-300" />
          <p className="text-gray-500 mb-2">No campaigns yet</p>
          <p className="text-sm text-gray-400">
            Set up automated review requests, rebooking nudges, and more
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {campaigns.map((campaign: any) => (
            <div key={campaign.id} className="bg-white rounded-xl border border-gray-200 p-5">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-gray-900">{campaign.name}</h3>
                <span
                  className={`px-2 py-0.5 text-xs rounded-full ${
                    campaign.status === 'active'
                      ? 'bg-green-100 text-green-700'
                      : campaign.status === 'paused'
                      ? 'bg-yellow-100 text-yellow-700'
                      : 'bg-gray-100 text-gray-600'
                  }`}
                >
                  {campaign.status}
                </span>
              </div>
              <p className="text-xs text-gray-500 mb-3">
                {typeLabels[campaign.type] || campaign.type}
              </p>
              {campaign.stats && (
                <div className="grid grid-cols-4 gap-2 text-center">
                  <div>
                    <p className="text-lg font-semibold text-gray-900">{campaign.stats.sent || 0}</p>
                    <p className="text-xs text-gray-500">Sent</p>
                  </div>
                  <div>
                    <p className="text-lg font-semibold text-gray-900">{campaign.stats.delivered || 0}</p>
                    <p className="text-xs text-gray-500">Delivered</p>
                  </div>
                  <div>
                    <p className="text-lg font-semibold text-gray-900">{campaign.stats.opened || 0}</p>
                    <p className="text-xs text-gray-500">Opened</p>
                  </div>
                  <div>
                    <p className="text-lg font-semibold text-gray-900">{campaign.stats.replied || 0}</p>
                    <p className="text-xs text-gray-500">Replied</p>
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
