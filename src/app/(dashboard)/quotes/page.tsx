import { requireTenant } from '@/lib/auth/guards'
import { createClient } from '@/lib/supabase/server'
import { FileText, Send, CheckCircle, XCircle, Clock } from 'lucide-react'

export default async function QuotesPage() {
  const { tenantId } = await requireTenant()
  const supabase = await createClient()

  const { data: quotes } = await supabase
    .from('quotes')
    .select('*, clients(name)')
    .eq('tenant_id', tenantId)
    .order('created_at', { ascending: false })
    .limit(50)

  const statusColors: Record<string, string> = {
    draft: 'bg-stone-100 text-stone-600',
    sent: 'bg-violet-100 text-violet-700',
    accepted: 'bg-emerald-100 text-emerald-700',
    rejected: 'bg-red-100 text-red-700',
    expired: 'bg-amber-100 text-amber-700',
  }

  const total = quotes?.length || 0
  const sent = (quotes || []).filter((q: any) => q.status === 'sent').length
  const accepted = (quotes || []).filter((q: any) => q.status === 'accepted').length
  const draft = (quotes || []).filter((q: any) => q.status === 'draft').length

  const summaryCards = [
    { label: 'Total Quotes', value: total, icon: FileText, color: 'text-violet-600', bg: 'bg-violet-50' },
    { label: 'Sent', value: sent, icon: Send, color: 'text-violet-600', bg: 'bg-violet-50' },
    { label: 'Accepted', value: accepted, icon: CheckCircle, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { label: 'Drafts', value: draft, icon: Clock, color: 'text-stone-500', bg: 'bg-stone-50' },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-stone-900 mb-1">Quotes</h1>
        <p className="text-stone-500">Create and track quotes for your clients</p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {summaryCards.map((card) => {
          const Icon = card.icon
          return (
            <div key={card.label} className="bg-white rounded-2xl border border-stone-200 shadow-sm p-5">
              <div className="flex items-center gap-3 mb-2">
                <div className={`p-2 rounded-xl ${card.bg}`}>
                  <Icon className={`w-4 h-4 ${card.color}`} />
                </div>
              </div>
              <p className="text-2xl font-semibold text-stone-900">{card.value}</p>
              <p className="text-sm text-stone-500 mt-0.5">{card.label}</p>
            </div>
          )
        })}
      </div>

      <div className="bg-white rounded-2xl border border-stone-200 shadow-sm">
        {!quotes || quotes.length === 0 ? (
          <div className="px-6 py-16 text-center">
            <div className="w-12 h-12 rounded-2xl bg-violet-50 flex items-center justify-center mx-auto mb-4">
              <FileText className="w-6 h-6 text-violet-400" />
            </div>
            <p className="text-stone-700 font-medium mb-1">No quotes yet</p>
            <p className="text-sm text-stone-500">
              Ask your AI assistant to create a quote for a client
            </p>
          </div>
        ) : (
          <div className="divide-y divide-stone-100">
            <div className="grid grid-cols-6 gap-4 px-6 py-3.5 text-xs font-medium text-stone-500 uppercase tracking-wide bg-stone-50 rounded-t-2xl">
              <span>Quote #</span>
              <span>Client</span>
              <span>Total</span>
              <span>Status</span>
              <span>Valid Until</span>
              <span>Created</span>
            </div>
            {quotes.map((q: any) => (
              <div key={q.id} className="grid grid-cols-6 gap-4 px-6 py-4 items-center hover:bg-stone-50 transition-colors">
                <span className="text-sm font-medium text-stone-900">{q.quote_number}</span>
                <span className="text-sm text-stone-700">{q.clients?.name || 'N/A'}</span>
                <span className="text-sm font-semibold text-stone-900">
                  ${(q.total_cents / 100).toFixed(2)}
                </span>
                <span>
                  <span className={`inline-block px-3 py-1 text-xs font-medium rounded-full ${statusColors[q.status] || 'bg-stone-100 text-stone-600'}`}>
                    {q.status}
                  </span>
                </span>
                <span className="text-sm text-stone-500">
                  {q.valid_until ? new Date(q.valid_until).toLocaleDateString() : '--'}
                </span>
                <span className="text-sm text-stone-500">
                  {new Date(q.created_at).toLocaleDateString()}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
