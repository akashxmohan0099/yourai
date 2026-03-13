import { requireTenant } from '@/lib/auth/guards'
import { createClient } from '@/lib/supabase/server'
import { Receipt } from 'lucide-react'

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
    draft: 'bg-gray-100 text-gray-700',
    sent: 'bg-blue-100 text-blue-700',
    paid: 'bg-green-100 text-green-700',
    overdue: 'bg-red-100 text-red-700',
    cancelled: 'bg-gray-100 text-gray-500',
  }

  // Calculate totals
  const totalOutstanding = (invoices || [])
    .filter((i: any) => ['sent', 'overdue'].includes(i.status))
    .reduce((sum: number, i: any) => sum + i.total_cents, 0)
  const totalPaid = (invoices || [])
    .filter((i: any) => i.status === 'paid')
    .reduce((sum: number, i: any) => sum + i.total_cents, 0)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Invoices</h1>
        <p className="text-gray-500">{invoices?.length || 0} invoices total</p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <p className="text-sm text-gray-500">Outstanding</p>
          <p className="text-2xl font-bold text-orange-600">${(totalOutstanding / 100).toFixed(2)}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <p className="text-sm text-gray-500">Paid</p>
          <p className="text-2xl font-bold text-green-600">${(totalPaid / 100).toFixed(2)}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <p className="text-sm text-gray-500">Overdue</p>
          <p className="text-2xl font-bold text-red-600">
            {(invoices || []).filter((i: any) => i.status === 'overdue').length}
          </p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200">
        {!invoices || invoices.length === 0 ? (
          <div className="px-5 py-12 text-center">
            <Receipt className="w-10 h-10 mx-auto mb-3 text-gray-300" />
            <p className="text-gray-500">No invoices yet</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            <div className="grid grid-cols-6 gap-4 px-5 py-3 text-xs font-medium text-gray-500 uppercase bg-gray-50">
              <span>Invoice #</span>
              <span>Client</span>
              <span>Total</span>
              <span>Status</span>
              <span>Due Date</span>
              <span>Created</span>
            </div>
            {invoices.map((inv: any) => (
              <div key={inv.id} className="grid grid-cols-6 gap-4 px-5 py-3 items-center hover:bg-gray-50">
                <span className="text-sm font-medium text-gray-900">{inv.invoice_number}</span>
                <span className="text-sm text-gray-600">{inv.clients?.name || 'N/A'}</span>
                <span className="text-sm font-medium text-gray-900">
                  ${(inv.total_cents / 100).toFixed(2)}
                </span>
                <span className={`inline-block px-2 py-0.5 text-xs rounded-full w-fit ${statusColors[inv.status] || 'bg-gray-100'}`}>
                  {inv.status}
                </span>
                <span className="text-sm text-gray-500">
                  {inv.due_date ? new Date(inv.due_date).toLocaleDateString() : '—'}
                </span>
                <span className="text-sm text-gray-400">
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
