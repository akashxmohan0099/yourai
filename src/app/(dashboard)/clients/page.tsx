import { requireTenant } from '@/lib/auth/guards'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Users, Phone, Mail, Search } from 'lucide-react'
import { formatRelativeTime } from '@/lib/utils'

export default async function ClientsPage() {
  const { tenantId } = await requireTenant()
  const supabase = await createClient()

  const { data: clients } = await supabase
    .from('clients')
    .select('*, channel_identities(channel, identifier)')
    .eq('tenant_id', tenantId)
    .order('last_seen_at', { ascending: false })
    .limit(50)

  const channelColors: Record<string, string> = {
    web_chat: 'bg-[#f5f5f7] text-[#424245]',
    voice: 'bg-emerald-50 text-emerald-700',
    sms: 'bg-amber-50 text-amber-700',
    email: 'bg-[#f5f5f7] text-[#424245]',
  }

  return (
    <div className="min-h-screen bg-[#f5f5f7]">
      <div className="space-y-6 max-w-7xl mx-auto px-4 py-6">
        <div>
          <h1 className="text-2xl font-semibold text-[#1d1d1f] mb-1">Clients</h1>
          <p className="text-[#86868b] text-base">
            {clients?.length || 0} client{(clients?.length || 0) !== 1 ? 's' : ''} in your directory
          </p>
        </div>

        {(!clients || clients.length === 0) ? (
          <div className="bg-white rounded-2xl border border-[#d2d2d7] shadow-sm p-12 text-center">
            <div className="w-14 h-14 bg-[#f5f5f7] rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Users className="w-7 h-7 text-[#86868b]" />
            </div>
            <p className="text-[#424245] font-medium text-base">No clients yet</p>
            <p className="text-sm text-[#86868b] mt-1">Clients are created automatically when they contact you</p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-[#d2d2d7] shadow-sm divide-y divide-[#f5f5f7]">
            {clients.map((client: any) => (
              <Link
                key={client.id}
                href={`/clients/${client.id}`}
                className="flex items-center gap-4 px-6 py-4 hover:bg-[#f5f5f7] transition-colors"
              >
                <div className="w-11 h-11 bg-[#f5f5f7] rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-[#1d1d1f] font-semibold text-sm">
                    {(client.name || 'A').charAt(0).toUpperCase()}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-[#1d1d1f]">
                    {client.name || 'Anonymous'}
                  </p>
                  <div className="flex items-center gap-3 mt-1">
                    {client.phone && (
                      <span className="flex items-center gap-1.5 text-xs text-[#86868b]">
                        <Phone className="w-3 h-3" /> {client.phone}
                      </span>
                    )}
                    {client.email && (
                      <span className="flex items-center gap-1.5 text-xs text-[#86868b]">
                        <Mail className="w-3 h-3" /> {client.email}
                      </span>
                    )}
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <div className="flex gap-1.5 justify-end">
                    {(client.channel_identities || []).map((ci: any, i: number) => (
                      <span
                        key={i}
                        className={`rounded-full px-3 py-1 text-xs font-medium ${channelColors[ci.channel] || 'bg-[#f5f5f7] text-[#424245]'}`}
                      >
                        {ci.channel.replace('_', ' ')}
                      </span>
                    ))}
                  </div>
                  <p className="text-xs text-[#86868b] mt-1.5">
                    {formatRelativeTime(client.last_seen_at)}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
