import type { ElementType } from 'react'
import { requireTenant } from '@/lib/auth/guards'
import { createClient } from '@/lib/supabase/server'
import { Target, Sparkles, UserPlus, MessageCircle, FileCheck, Trophy, XCircle } from 'lucide-react'

export default async function LeadsPage() {
  const { tenantId } = await requireTenant()
  const supabase = await createClient()

  const { data: leads } = await supabase
    .from('leads')
    .select('*, clients(name, email, phone)')
    .eq('tenant_id', tenantId)
    .order('created_at', { ascending: false })
    .limit(50)

  const statusColors: Record<string, string> = {
    new: 'bg-[#f5f5f7] text-[#424245]',
    contacted: 'bg-amber-100 text-amber-700',
    qualified: 'bg-[#f5f5f7] text-[#424245]',
    proposal: 'bg-[#d2d2d7] text-[#1d1d1f]',
    won: 'bg-emerald-100 text-emerald-700',
    lost: 'bg-red-100 text-red-700',
  }

  const statusIcons: Record<string, ElementType> = {
    new: Sparkles,
    contacted: MessageCircle,
    qualified: UserPlus,
    proposal: FileCheck,
    won: Trophy,
    lost: XCircle,
  }

  const statuses = ['new', 'contacted', 'qualified', 'proposal', 'won', 'lost']

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-[#1d1d1f] mb-1">Leads</h1>
        <p className="text-[#86868b]">Track and convert potential customers</p>
      </div>

      {/* Pipeline summary */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {statuses.map((status) => {
          const count = (leads || []).filter((l: any) => l.status === status).length
          const Icon = statusIcons[status] || Target
          return (
            <div key={status} className="bg-white rounded-2xl border border-[#d2d2d7] shadow-sm p-4 text-center">
              <div className="flex justify-center mb-2">
                <div className={`p-2 rounded-xl ${status === 'won' ? 'bg-emerald-50' : status === 'lost' ? 'bg-red-50' : 'bg-[#f5f5f7]'}`}>
                  <Icon className={`w-4 h-4 ${status === 'won' ? 'text-emerald-600' : status === 'lost' ? 'text-red-500' : 'text-[#1d1d1f]'}`} />
                </div>
              </div>
              <p className="text-2xl font-semibold text-[#1d1d1f]">{count}</p>
              <p className="text-xs text-[#86868b] capitalize mt-0.5">{status}</p>
            </div>
          )
        })}
      </div>

      <div className="bg-white rounded-2xl border border-[#d2d2d7] shadow-sm">
        {!leads || leads.length === 0 ? (
          <div className="px-6 py-16 text-center">
            <div className="w-12 h-12 rounded-2xl bg-[#f5f5f7] flex items-center justify-center mx-auto mb-4">
              <Target className="w-6 h-6 text-[#86868b]" />
            </div>
            <p className="text-[#424245] font-medium mb-1">No leads yet</p>
            <p className="text-sm text-[#86868b]">Leads are automatically captured from conversations</p>
          </div>
        ) : (
          <div className="divide-y divide-[#f5f5f7]">
            <div className="grid grid-cols-6 gap-4 px-6 py-3.5 text-xs font-medium text-[#86868b] uppercase tracking-wide bg-[#f5f5f7] rounded-t-2xl">
              <span>Name</span>
              <span>Contact</span>
              <span>Source</span>
              <span>Status</span>
              <span>Score</span>
              <span>Added</span>
            </div>
            {leads.map((lead: any) => (
              <div key={lead.id} className="grid grid-cols-6 gap-4 px-6 py-4 items-center hover:bg-[#f5f5f7] transition-colors">
                <span className="text-sm font-medium text-[#1d1d1f]">
                  {lead.clients?.name || 'Unknown'}
                </span>
                <span className="text-sm text-[#424245] truncate">
                  {lead.clients?.email || lead.clients?.phone || '--'}
                </span>
                <span className="text-sm text-[#86868b] capitalize">
                  {lead.source_channel?.replace('_', ' ') || '--'}
                </span>
                <span>
                  <span className={`inline-block px-3 py-1 text-xs font-medium rounded-full ${statusColors[lead.status] || 'bg-[#f5f5f7] text-[#424245]'}`}>
                    {lead.status}
                  </span>
                </span>
                <span className="text-sm text-[#424245]">
                  <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full text-xs font-semibold ${
                    (lead.score || 0) >= 70
                      ? 'bg-emerald-100 text-emerald-700'
                      : (lead.score || 0) >= 40
                      ? 'bg-amber-100 text-amber-700'
                      : 'bg-[#f5f5f7] text-[#424245]'
                  }`}>
                    {lead.score || 0}
                  </span>
                </span>
                <span className="text-sm text-[#86868b]">
                  {new Date(lead.created_at).toLocaleDateString()}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
