import { requireTenant } from '@/lib/auth/guards'
import { createClient } from '@/lib/supabase/server'
import { Receipt, DollarSign, AlertTriangle, CheckCircle } from 'lucide-react'

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
    draft: 'bg-stone-100 text-stone-600',
    sent: 'bg-violet-100 text-violet-700',
    paid: 'bg-emerald-100 text-emerald-700',
    overdue: 'bg-red-100 text-red-700',
    cancelled: 'bg-stone-100 text-stone-500',
  }

  // Calculate totals
  const totalOutstanding = (invoices || [])
    .filter((i: any) => ['sent', 'overdue'].includes(i.status))
    .reduce((sum: number, i: any) => sum + i.total_cents, 0)
  const totalPaid = (invoices || [])
    .filter((i: any) => i.status === 'paid')
    .reduce((sum: number, i: any) => sum + i.total_cents, 0)
  const overdueCount = (invoices || []).filter((i: any) => i.status === 'overdue').length

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-stone-900 mb-1">Invoices</h1>
        <p className="text-stone-500">{invoices?.length || 0} invoices total</p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl border border-stone-200 shadow-sm p-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 rounded-xl bg-amber-50">
              <DollarSign className="w-4 h-4 text-amber-600" />
            </div>
            <span className="text-sm text-stone-500">Outstanding</span>
          </div>
          <p className="text-2xl font-semibold text-amber-600">${(totalOutstanding / 100).toFixed(2)}</p>
        </div>
        <div className="bg-white rounded-2xl border border-stone-200 shadow-sm p-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 rounded-xl bg-emerald-50">
              <CheckCircle className="w-4 h-4 text-emerald-600" />
            </div>
            <span className="text-sm text-stone-500">Paid</span>
          </div>
          <p className="text-2xl font-semibold text-emerald-600">${(totalPaid / 100).toFixed(2)}</p>
        </div>
        <div className="bg-white rounded-2xl border border-stone-200 shadow-sm p-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 rounded-xl bg-red-50">
              <AlertTriangle className="w-4 h-4 text-red-500" />
            </div>
            <span className="text-sm text-stone-500">Overdue</span>
          </div>
          <p className="text-2xl font-semibold text-red-600">{overdueCount}</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-stone-200 shadow-sm">
        {!invoices || invoices.length === 0 ? (
          <div className="px-6 py-16 text-center">
            <div className="w-12 h-12 rounded-2xl bg-violet-50 flex items-center justify-center mx-auto mb-4">
              <Receipt className="w-6 h-6 text-violet-400" />
            </div>
            <p className="text-stone-700 font-medium mb-1">No invoices yet</p>
            <p className="text-sm text-stone-500">
              Invoices will appear here once you create them
            </p>
          </div>
        ) : (
          <div className="divide-y divide-stone-100">
            <div className="grid grid-cols-6 gap-4 px-6 py-3.5 text-xs font-medium text-stone-500 uppercase tracking-wide bg-stone-50 rounded-t-2xl">
              <span>Invoice #</span>
              <span>Client</span>
              <span>Total</span>
              <span>Status</span>
              <span>Due Date</span>
              <span>Created</span>
            </div>
            {invoices.map((inv: any) => (
              <div key={inv.id} className="grid grid-cols-6 gap-4 px-6 py-4 items-center hover:bg-stone-50 transition-colors">
                <span className="text-sm font-medium text-stone-900">{inv.invoice_number}</span>
                <span className="text-sm text-stone-700">{inv.clients?.name || 'N/A'}</span>
                <span className="text-sm font-semibold text-stone-900">
                  ${(inv.total_cents / 100).toFixed(2)}
                </span>
                <span>
                  <span className={`inline-block px-3 py-1 text-xs font-medium rounded-full ${statusColors[inv.status] || 'bg-stone-100 text-stone-600'}`}>
                    {inv.status}
                  </span>
                </span>
                <span className="text-sm text-stone-500">
                  {inv.due_date ? new Date(inv.due_date).toLocaleDateString() : '--'}
                </span>
                <span className="text-sm text-stone-500">
                  {new Date(inv.created_at).toLocaleDateString()}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
