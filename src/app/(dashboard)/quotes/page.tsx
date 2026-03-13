import { requireTenant } from '@/lib/auth/guards'
import { createClient } from '@/lib/supabase/server'
import { FileText, Send, CheckCircle, XCircle, Clock, Download } from 'lucide-react'

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
    draft: 'bg-[#f5f5f7] text-[#424245]',
    sent: 'bg-[#f5f5f7] text-[#1d1d1f]',
    accepted: 'bg-emerald-100 text-emerald-700',
    rejected: 'bg-red-100 text-red-700',
    expired: 'bg-amber-100 text-amber-700',
  }

  const total = quotes?.length || 0
  const sent = (quotes || []).filter((q: any) => q.status === 'sent').length
  const accepted = (quotes || []).filter((q: any) => q.status === 'accepted').length
  const draft = (quotes || []).filter((q: any) => q.status === 'draft').length

  const summaryCards = [
    { label: 'Total Quotes', value: total, icon: FileText, color: 'text-[#1d1d1f]', bg: 'bg-[#f5f5f7]' },
    { label: 'Sent', value: sent, icon: Send, color: 'text-[#1d1d1f]', bg: 'bg-[#f5f5f7]' },
    { label: 'Accepted', value: accepted, icon: CheckCircle, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { label: 'Drafts', value: draft, icon: Clock, color: 'text-[#86868b]', bg: 'bg-[#f5f5f7]' },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-[#1d1d1f] mb-1">Quotes</h1>
        <p className="text-[#86868b]">Create and track quotes for your clients</p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {summaryCards.map((card) => {
          const Icon = card.icon
          return (
            <div key={card.label} className="bg-white rounded-2xl border border-[#d2d2d7] shadow-sm p-5">
              <div className="flex items-center gap-3 mb-2">
                <div className={`p-2 rounded-xl ${card.bg}`}>
                  <Icon className={`w-4 h-4 ${card.color}`} />
                </div>
              </div>
              <p className="text-2xl font-semibold text-[#1d1d1f]">{card.value}</p>
              <p className="text-sm text-[#86868b] mt-0.5">{card.label}</p>
            </div>
          )
        })}
      </div>

      <div className="bg-white rounded-2xl border border-[#d2d2d7] shadow-sm">
        {!quotes || quotes.length === 0 ? (
          <div className="px-6 py-16 text-center">
            <div className="w-12 h-12 rounded-2xl bg-[#f5f5f7] flex items-center justify-center mx-auto mb-4">
              <FileText className="w-6 h-6 text-[#86868b]" />
            </div>
            <p className="text-[#424245] font-medium mb-1">No quotes yet</p>
            <p className="text-sm text-[#86868b]">
              Ask your AI assistant to create a quote for a client
            </p>
          </div>
        ) : (
          <div className="divide-y divide-[#f5f5f7]">
            <div className="grid grid-cols-[1fr_1fr_1fr_1fr_1fr_1fr_auto] gap-4 px-6 py-3.5 text-xs font-medium text-[#86868b] uppercase tracking-wide bg-[#f5f5f7] rounded-t-2xl">
              <span>Quote #</span>
              <span>Client</span>
              <span>Total</span>
              <span>Status</span>
              <span>Valid Until</span>
              <span>Created</span>
              <span className="w-8"></span>
            </div>
            {quotes.map((q: any) => (
              <div key={q.id} className="grid grid-cols-[1fr_1fr_1fr_1fr_1fr_1fr_auto] gap-4 px-6 py-4 items-center hover:bg-[#f5f5f7] transition-colors">
                <span className="text-sm font-medium text-[#1d1d1f]">{q.quote_number}</span>
                <span className="text-sm text-[#424245]">{q.clients?.name || 'N/A'}</span>
                <span className="text-sm font-semibold text-[#1d1d1f]">
                  ${(q.total_cents / 100).toFixed(2)}
                </span>
                <span>
                  <span className={`inline-block px-3 py-1 text-xs font-medium rounded-full ${statusColors[q.status] || 'bg-[#f5f5f7] text-[#424245]'}`}>
                    {q.status}
                  </span>
                </span>
                <span className="text-sm text-[#86868b]">
                  {q.valid_until ? new Date(q.valid_until).toLocaleDateString() : '--'}
                </span>
                <span className="text-sm text-[#86868b]">
                  {new Date(q.created_at).toLocaleDateString()}
                </span>
                <a
                  href={`/api/quotes/${q.id}/pdf`}
                  target="_blank"
                  rel="noopener noreferrer"
                  title="Download PDF"
                  className="inline-flex items-center justify-center w-8 h-8 rounded-lg text-[#86868b] hover:text-[#1d1d1f] hover:bg-[#f5f5f7] transition-colors"
                >
                  <Download className="w-4 h-4" />
                </a>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
