import { PageIntro } from '@/components/dashboard/page-intro'
import { requireTenant } from '@/lib/auth/guards'
import { createClient } from '@/lib/supabase/server'
import { CheckCircle, Clock, Download, FileText, Send } from 'lucide-react'

interface QuoteRow {
  id: string
  quote_number: string
  total_cents: number
  status: string
  valid_until?: string | null
  created_at: string
  clients?: { name?: string | null } | null
}

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
    draft: 'chip',
    sent: 'chip',
    accepted: 'chip chip-teal',
    rejected: 'chip chip-accent',
    expired: 'chip chip-accent',
  }

  const quoteRows = (quotes || []) as QuoteRow[]
  const total = quoteRows.length
  const sent = quoteRows.filter((quote) => quote.status === 'sent').length
  const accepted = quoteRows.filter((quote) => quote.status === 'accepted').length
  const draft = quoteRows.filter((quote) => quote.status === 'draft').length

  const summaryCards = [
    { label: 'Total quotes', value: total, icon: FileText },
    { label: 'Sent', value: sent, icon: Send },
    { label: 'Accepted', value: accepted, icon: CheckCircle },
    { label: 'Drafts', value: draft, icon: Clock },
  ]

  return (
    <div className="dashboard-stack">
      <PageIntro
        eyebrow="Quote tracker"
        title="Draft, send, and follow every proposal."
        description="Quotes now read like part of the operating system rather than a detached admin table."
        aside={
          <div className="panel-muted w-full rounded-[28px] p-5 lg:max-w-sm">
            <p className="text-sm font-semibold text-[var(--ink)]">{accepted} accepted quote{accepted === 1 ? '' : 's'}</p>
            <p className="mt-2 text-xs text-[var(--ink-faint)]">Track progression from draft to signed-off work.</p>
          </div>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {summaryCards.map((card) => (
          <div key={card.label} className="panel rounded-[28px] px-5 py-5">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/55">
              <card.icon className="h-4 w-4 text-[var(--accent)]" />
            </div>
            <p className="mt-4 text-3xl font-semibold text-[var(--ink)]">{card.value}</p>
            <p className="mt-1 text-sm text-[var(--ink-faint)]">{card.label}</p>
          </div>
        ))}
      </div>

      <div className="panel dashboard-table rounded-[32px]">
        {quoteRows.length === 0 ? (
          <div className="dashboard-empty">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-[26px] bg-[rgba(208,109,79,0.12)]">
              <FileText className="h-7 w-7 text-[var(--accent)]" />
            </div>
            <p className="mt-5 text-lg font-semibold text-[var(--ink)]">No quotes yet</p>
            <p className="mt-2 text-sm leading-7 text-[var(--ink-soft)]">
              Ask the assistant to create a quote and it will appear here.
            </p>
          </div>
        ) : (
          quoteRows.map((quote) => (
            <div key={quote.id} className="dashboard-table-row grid gap-3 px-6 py-5 lg:grid-cols-[1fr_1fr_1fr_1fr_1fr_auto] lg:items-center">
              <div>
                <p className="text-sm font-semibold text-[var(--ink)]">{quote.quote_number}</p>
                <p className="mt-1 text-xs text-[var(--ink-faint)]">{quote.clients?.name || 'N/A'}</p>
              </div>
              <p className="text-sm font-semibold text-[var(--ink)]">${(quote.total_cents / 100).toFixed(2)}</p>
              <div>
                <span className={statusColors[quote.status] || 'chip'}>{quote.status}</span>
              </div>
              <p className="text-sm text-[var(--ink-soft)]">
                {quote.valid_until ? new Date(quote.valid_until).toLocaleDateString() : '--'}
              </p>
              <p className="text-sm text-[var(--ink-faint)]">
                {new Date(quote.created_at).toLocaleDateString()}
              </p>
              <a
                href={`/api/quotes/${quote.id}/pdf`}
                target="_blank"
                rel="noopener noreferrer"
                title="Download PDF"
                className="btn-secondary h-11 w-11 rounded-2xl px-0"
              >
                <Download className="h-4 w-4" />
              </a>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
