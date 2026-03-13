import { PageIntro } from '@/components/dashboard/page-intro'
import { formatRelativeTime } from '@/lib/utils'
import { requireTenant } from '@/lib/auth/guards'
import { createClient } from '@/lib/supabase/server'
import { Mail, Phone, Users } from 'lucide-react'
import Link from 'next/link'

interface ChannelIdentity {
  channel: string
  identifier?: string | null
}

interface ClientRow {
  id: string
  name?: string | null
  phone?: string | null
  email?: string | null
  last_seen_at: string
  channel_identities?: ChannelIdentity[] | null
}

export default async function ClientsPage() {
  const { tenantId } = await requireTenant()
  const supabase = await createClient()

  const { data: clients } = await supabase
    .from('clients')
    .select('*, channel_identities(channel, identifier)')
    .eq('tenant_id', tenantId)
    .order('last_seen_at', { ascending: false })
    .limit(50)

  const clientRows = (clients || []) as ClientRow[]

  return (
    <div className="dashboard-stack">
      <PageIntro
        eyebrow="Client directory"
        title="Known people, not anonymous fragments."
        description="Every contact is assembled from their messages, calls, and channel identities so your team works from the same customer memory."
        aside={
          <div className="panel-muted w-full rounded-[28px] p-5 lg:max-w-sm">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[rgba(208,109,79,0.12)]">
                <Users className="h-5 w-5 text-[var(--accent)]" />
              </div>
              <div>
                <p className="text-sm font-semibold text-[var(--ink)]">
                  {clientRows.length} client{clientRows.length === 1 ? '' : 's'} loaded
                </p>
                <p className="text-xs text-[var(--ink-faint)]">Sorted by most recent activity.</p>
              </div>
            </div>
          </div>
        }
      />

      {clientRows.length === 0 ? (
        <div className="panel rounded-[32px]">
          <div className="dashboard-empty">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-[26px] bg-[rgba(208,109,79,0.12)]">
              <Users className="h-7 w-7 text-[var(--accent)]" />
            </div>
            <p className="mt-5 text-lg font-semibold text-[var(--ink)]">No clients yet</p>
            <p className="mt-2 text-sm leading-7 text-[var(--ink-soft)]">
              Client records are created automatically when customers contact the business.
            </p>
          </div>
        </div>
      ) : (
        <div className="panel dashboard-table rounded-[32px]">
          {clientRows.map((client) => (
            <Link
              key={client.id}
              href={`/clients/${client.id}`}
              className="dashboard-table-row flex flex-col gap-4 px-5 py-5 sm:flex-row sm:items-center sm:px-6"
            >
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/55">
                  <span className="text-sm font-semibold text-[var(--ink)]">
                    {(client.name || 'A').charAt(0).toUpperCase()}
                  </span>
                </div>
                <div>
                  <p className="text-sm font-semibold text-[var(--ink)]">{client.name || 'Anonymous'}</p>
                  <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-[var(--ink-faint)]">
                    {client.phone ? (
                      <span className="inline-flex items-center gap-1.5">
                        <Phone className="h-3 w-3" />
                        {client.phone}
                      </span>
                    ) : null}
                    {client.email ? (
                      <span className="inline-flex items-center gap-1.5">
                        <Mail className="h-3 w-3" />
                        {client.email}
                      </span>
                    ) : null}
                  </div>
                </div>
              </div>

              <div className="flex flex-1 flex-wrap items-center justify-between gap-3 sm:justify-end">
                <div className="flex flex-wrap gap-2">
                  {(client.channel_identities || []).map((identity, index: number) => (
                    <span key={index} className="chip capitalize">
                      {identity.channel.replace('_', ' ')}
                    </span>
                  ))}
                </div>
                <p className="text-xs uppercase tracking-[0.16em] text-[var(--ink-faint)]">
                  {formatRelativeTime(client.last_seen_at)}
                </p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
