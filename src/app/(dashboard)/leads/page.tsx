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
    new: 'bg-violet-100 text-violet-700',
    contacted: 'bg-amber-100 text-amber-700',
    qualified: 'bg-violet-100 text-violet-700',
    proposal: 'bg-violet-200 text-violet-800',
    won: 'bg-emerald-100 text-emerald-700',
    lost: 'bg-red-100 text-red-700',
  }

  const statusIcons: Record<string, React.ElementType> = {
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
        <h1 className="text-2xl font-semibold text-stone-900 mb-1">Leads</h1>
        <p className="text-stone-500">Track and convert potential customers</p>
      </div>

      {/* Pipeline summary */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {statuses.map((status) => {
          const count = (leads || []).filter((l: any) => l.status === status).length
          const Icon = statusIcons[status] || Target
          return (
            <div key={status} className="bg-white rounded-2xl border border-stone-200 shadow-sm p-4 text-center">
              <div className="flex justify-center mb-2">
                <div className={`p-2 rounded-xl ${status === 'won' ? 'bg-emerald-50' : status === 'lost' ? 'bg-red-50' : 'bg-violet-50'}`}>
                  <Icon className={`w-4 h-4 ${status === 'won' ? 'text-emerald-600' : status === 'lost' ? 'text-red-500' : 'text-violet-600'}`} />
                </div>
              </div>
              <p className="text-2xl font-semibold text-stone-900">{count}</p>
              <p className="text-xs text-stone-500 capitalize mt-0.5">{status}</p>
            </div>
          )
        })}
      </div>

      <div className="bg-white rounded-2xl border border-stone-200 shadow-sm">
        {!leads || leads.length === 0 ? (
          <div className="px-6 py-16 text-center">
            <div className="w-12 h-12 rounded-2xl bg-violet-50 flex items-center justify-center mx-auto mb-4">
              <Target className="w-6 h-6 text-violet-400" />
            </div>
            <p className="text-stone-700 font-medium mb-1">No leads yet</p>
            <p className="text-sm text-stone-500">Leads are automatically captured from conversations</p>
          </div>
        ) : (
          <div className="divide-y divide-stone-100">
            <div className="grid grid-cols-6 gap-4 px-6 py-3.5 text-xs font-medium text-stone-500 uppercase tracking-wide bg-stone-50 rounded-t-2xl">
              <span>Name</span>
              <span>Contact</span>
              <span>Source</span>
              <span>Status</span>
              <span>Score</span>
              <span>Added</span>
            </div>
            {leads.map((lead: any) => (
              <div key={lead.id} className="grid grid-cols-6 gap-4 px-6 py-4 items-center hover:bg-stone-50 transition-colors">
                <span className="text-sm font-medium text-stone-900">
                  {lead.clients?.name || 'Unknown'}
                </span>
                <span className="text-sm text-stone-700 truncate">
                  {lead.clients?.email || lead.clients?.phone || '--'}
                </span>
                <span className="text-sm text-stone-500 capitalize">
                  {lead.source_channel?.replace('_', ' ') || '--'}
                </span>
                <span>
                  <span className={`inline-block px-3 py-1 text-xs font-medium rounded-full ${statusColors[lead.status] || 'bg-stone-100 text-stone-600'}`}>
                    {lead.status}
                  </span>
                </span>
                <span className="text-sm text-stone-700">
                  <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full text-xs font-semibold ${
                    (lead.score || 0) >= 70
                      ? 'bg-emerald-100 text-emerald-700'
                      : (lead.score || 0) >= 40
                      ? 'bg-amber-100 text-amber-700'
                      : 'bg-stone-100 text-stone-600'
                  }`}>
                    {lead.score || 0}
                  </span>
                </span>
                <span className="text-sm text-stone-500">
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
