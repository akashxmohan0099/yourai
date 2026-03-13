import { requireTenant } from '@/lib/auth/guards'
import { createClient } from '@/lib/supabase/server'
import { Target } from 'lucide-react'

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
    new: 'bg-blue-100 text-blue-700',
    contacted: 'bg-yellow-100 text-yellow-700',
    qualified: 'bg-purple-100 text-purple-700',
    proposal: 'bg-indigo-100 text-indigo-700',
    won: 'bg-green-100 text-green-700',
    lost: 'bg-red-100 text-red-700',
  }

  const statuses = ['new', 'contacted', 'qualified', 'proposal', 'won', 'lost']

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Leads</h1>
        <p className="text-gray-500">Track and convert potential customers</p>
      </div>

      {/* Pipeline summary */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {statuses.map((status) => {
          const count = (leads || []).filter((l: any) => l.status === status).length
          return (
            <div key={status} className="bg-white rounded-xl border border-gray-200 p-4 text-center">
              <p className="text-2xl font-bold text-gray-900">{count}</p>
              <p className="text-xs text-gray-500 capitalize mt-1">{status}</p>
            </div>
          )
        })}
      </div>

      <div className="bg-white rounded-xl border border-gray-200">
        {!leads || leads.length === 0 ? (
          <div className="px-5 py-12 text-center">
            <Target className="w-10 h-10 mx-auto mb-3 text-gray-300" />
            <p className="text-gray-500">No leads yet</p>
            <p className="text-sm text-gray-400 mt-1">Leads are automatically captured from conversations</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            <div className="grid grid-cols-6 gap-4 px-5 py-3 text-xs font-medium text-gray-500 uppercase bg-gray-50">
              <span>Name</span>
              <span>Contact</span>
              <span>Source</span>
              <span>Status</span>
              <span>Score</span>
              <span>Added</span>
            </div>
            {leads.map((lead: any) => (
              <div key={lead.id} className="grid grid-cols-6 gap-4 px-5 py-3 items-center hover:bg-gray-50">
                <span className="text-sm font-medium text-gray-900">
                  {lead.clients?.name || 'Unknown'}
                </span>
                <span className="text-sm text-gray-600 truncate">
                  {lead.clients?.email || lead.clients?.phone || '—'}
                </span>
                <span className="text-sm text-gray-500 capitalize">
                  {lead.source_channel?.replace('_', ' ') || '—'}
                </span>
                <span className={`inline-block px-2 py-0.5 text-xs rounded-full w-fit ${statusColors[lead.status] || 'bg-gray-100'}`}>
                  {lead.status}
                </span>
                <span className="text-sm text-gray-600">{lead.score || 0}</span>
                <span className="text-sm text-gray-400">
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
