import { requireTenant } from '@/lib/auth/guards'
import { createClient } from '@/lib/supabase/server'
import { FileText, Plus } from 'lucide-react'
import Link from 'next/link'

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
    draft: 'bg-gray-100 text-gray-700',
    sent: 'bg-blue-100 text-blue-700',
    accepted: 'bg-green-100 text-green-700',
    rejected: 'bg-red-100 text-red-700',
    expired: 'bg-yellow-100 text-yellow-700',
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Quotes</h1>
          <p className="text-gray-500">{quotes?.length || 0} quotes total</p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200">
        {!quotes || quotes.length === 0 ? (
          <div className="px-5 py-12 text-center">
            <FileText className="w-10 h-10 mx-auto mb-3 text-gray-300" />
            <p className="text-gray-500">No quotes yet</p>
            <p className="text-sm text-gray-400 mt-1">
              Ask your AI assistant to create a quote for a client
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            <div className="grid grid-cols-6 gap-4 px-5 py-3 text-xs font-medium text-gray-500 uppercase bg-gray-50">
              <span>Quote #</span>
              <span>Client</span>
              <span>Total</span>
              <span>Status</span>
              <span>Valid Until</span>
              <span>Created</span>
            </div>
            {quotes.map((q: any) => (
              <div key={q.id} className="grid grid-cols-6 gap-4 px-5 py-3 items-center hover:bg-gray-50">
                <span className="text-sm font-medium text-gray-900">{q.quote_number}</span>
                <span className="text-sm text-gray-600">{q.clients?.name || 'N/A'}</span>
                <span className="text-sm font-medium text-gray-900">
                  ${(q.total_cents / 100).toFixed(2)}
                </span>
                <span className={`inline-block px-2 py-0.5 text-xs rounded-full w-fit ${statusColors[q.status] || 'bg-gray-100'}`}>
                  {q.status}
                </span>
                <span className="text-sm text-gray-500">
                  {q.valid_until ? new Date(q.valid_until).toLocaleDateString() : '—'}
                </span>
                <span className="text-sm text-gray-400">
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
