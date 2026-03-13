import { PageIntro } from '@/components/dashboard/page-intro'
import { requireTenant } from '@/lib/auth/guards'
import { createClient } from '@/lib/supabase/server'
import { AlertTriangle, CheckCircle, DollarSign, FileText, Receipt } from 'lucide-react'

interface InvoiceRow {
  id: string
  invoice_number: string
  total_cents: number
  status: string
  due_date?: string | null
  created_at: string
  clients?: { name?: string | null } | null
}

export default async function InvoicesPage() {
  const { tenantId } = await requireTenant()
  const supabase = await createClient()

  const { data: invoices } = await supabase
    .from('invoices')
    .select('*, clients(name)')
    .eq('tenant_id', tenantId)
    .order('created_at', { ascending: false })
    .limit(50)

  const statusColors: Record<string, string> = {
    draft: 'chip',
    sent: 'chip',
    paid: 'chip chip-teal',
    overdue: 'chip chip-accent',
    cancelled: 'chip',
  }

  const invoiceRows = (invoices || []) as InvoiceRow[]
  const totalOutstanding = invoiceRows
    .filter((invoice) => ['sent', 'overdue'].includes(invoice.status))
    .reduce((sum, invoice) => sum + invoice.total_cents, 0)
  const totalPaid = invoiceRows
    .filter((invoice) => invoice.status === 'paid')
    .reduce((sum, invoice) => sum + invoice.total_cents, 0)
  const overdueCount = invoiceRows.filter((invoice) => invoice.status === 'overdue').length

  return (
    <div className="dashboard-stack">
      <PageIntro
        eyebrow="Invoice ledger"
        title="Revenue status without spreadsheet fatigue."
        description="Outstanding, paid, overdue, and draft invoices are now easier to scan in the same visual rhythm as the rest of the product."
        aside={
          <div className="panel-muted w-full rounded-[28px] p-5 lg:max-w-sm">
            <p className="text-sm font-semibold text-[var(--ink)]">{invoiceRows.length} invoice records</p>
            <p className="mt-2 text-xs text-[var(--ink-faint)]">Monitor cash collection and overdue risk from one place.</p>
          </div>
        }
      />

      <div className="grid gap-4 md:grid-cols-3">
        {[
          {
            label: 'Outstanding',
            value: `$${(totalOutstanding / 100).toFixed(2)}`,
            icon: DollarSign,
          },
          {
            label: 'Paid',
            value: `$${(totalPaid / 100).toFixed(2)}`,
            icon: CheckCircle,
          },
          {
            label: 'Overdue',
            value: String(overdueCount),
            icon: AlertTriangle,
          },
        ].map((card) => (
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
        {invoiceRows.length === 0 ? (
          <div className="dashboard-empty">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-[26px] bg-[rgba(208,109,79,0.12)]">
              <Receipt className="h-7 w-7 text-[var(--accent)]" />
            </div>
            <p className="mt-5 text-lg font-semibold text-[var(--ink)]">No invoices yet</p>
            <p className="mt-2 text-sm leading-7 text-[var(--ink-soft)]">
              Invoices will appear here once they are created.
            </p>
          </div>
        ) : (
          invoiceRows.map((invoice) => (
            <div key={invoice.id} className="dashboard-table-row grid gap-3 px-6 py-5 lg:grid-cols-[1fr_1fr_1fr_1fr_1fr_auto] lg:items-center">
              <div>
                <p className="text-sm font-semibold text-[var(--ink)]">{invoice.invoice_number}</p>
                <p className="mt-1 text-xs text-[var(--ink-faint)]">{invoice.clients?.name || 'N/A'}</p>
              </div>
              <p className="text-sm font-semibold text-[var(--ink)]">${(invoice.total_cents / 100).toFixed(2)}</p>
              <div>
                <span className={statusColors[invoice.status] || 'chip'}>{invoice.status}</span>
              </div>
              <p className="text-sm text-[var(--ink-soft)]">
                {invoice.due_date ? new Date(invoice.due_date).toLocaleDateString() : '--'}
              </p>
              <p className="text-sm text-[var(--ink-faint)]">
                {new Date(invoice.created_at).toLocaleDateString()}
              </p>
              <a
                href={`/api/invoices/${invoice.id}/pdf`}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-secondary h-11 w-11 rounded-2xl px-0"
                title="View PDF"
              >
                <FileText className="h-4 w-4" />
              </a>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
