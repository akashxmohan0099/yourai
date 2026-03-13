import { CallClientButton } from '@/components/dashboard/call-client-button'
import { ClientDetailEnhanced } from '@/components/dashboard/client-detail-enhanced'
import { requireTenant } from '@/lib/auth/guards'
import { formatDateTime, formatRelativeTime } from '@/lib/utils'
import { createClient } from '@/lib/supabase/server'
import { ArrowLeft, Mail, MessageSquare, Phone } from 'lucide-react'
import Link from 'next/link'
import { notFound } from 'next/navigation'

interface Props {
  params: Promise<{ id: string }>
}

interface ClientChannelIdentity {
  channel: string
  identifier: string
}

interface ClientRow {
  id: string
  name?: string | null
  phone?: string | null
  email?: string | null
  first_seen_at: string
  last_seen_at: string
  channel_identities?: ClientChannelIdentity[] | null
}

interface ClientConversation {
  id: string
  channel: string
  status: string
  started_at: string
}

export default async function ClientDetailPage({ params }: Props) {
  const { id } = await params
  const { tenantId } = await requireTenant()
  const supabase = await createClient()

  const [
    clientResult,
    conversationsResult,
    notesResult,
    tagsResult,
    appointmentsResult,
    configResult,
  ] = await Promise.all([
    supabase
      .from('clients')
      .select('*, channel_identities(channel, identifier, created_at)')
      .eq('id', id)
      .eq('tenant_id', tenantId)
      .single(),
    supabase
      .from('conversations')
      .select('id, channel, status, started_at, ended_at')
      .eq('client_id', id)
      .eq('tenant_id', tenantId)
      .order('started_at', { ascending: false })
      .limit(20),
    supabase
      .from('client_notes')
      .select('*')
      .eq('client_id', id)
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: false }),
    supabase
      .from('client_tags')
      .select('*')
      .eq('client_id', id)
      .eq('tenant_id', tenantId),
    supabase
      .from('appointments')
      .select('*, services(name)')
      .eq('client_id', id)
      .eq('tenant_id', tenantId)
      .order('starts_at', { ascending: false })
      .limit(10),
    supabase.from('business_config').select('voice_enabled').eq('tenant_id', tenantId).single(),
  ])

  const client = clientResult.data as ClientRow | null
  if (!client) notFound()

  const conversations = (conversationsResult.data || []) as ClientConversation[]
  const notes = notesResult.data || []
  const tags = tagsResult.data || []
  const appointments = appointmentsResult.data || []
  const voiceEnabled = configResult.data?.voice_enabled || false

  return (
    <div className="dashboard-stack">
      <section className="panel rounded-[32px] px-5 py-5 sm:px-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex items-start gap-4">
            <Link href="/clients" className="btn-secondary h-11 w-11 rounded-2xl px-0">
              <ArrowLeft className="h-4 w-4" />
            </Link>
            <div className="space-y-3">
              <p className="kicker">Client record</p>
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex h-14 w-14 items-center justify-center rounded-[24px] bg-white/55">
                  <span className="text-lg font-semibold text-[var(--ink)]">
                    {(client.name || 'A').charAt(0).toUpperCase()}
                  </span>
                </div>
                <div>
                  <h1 className="text-3xl font-semibold text-[var(--ink)]">{client.name || 'Anonymous'}</h1>
                  <p className="mt-2 text-sm leading-7 text-[var(--ink-soft)]">
                    First seen {formatRelativeTime(client.first_seen_at)} • Last seen{' '}
                    {formatRelativeTime(client.last_seen_at)}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <CallClientButton
            clientId={client.id}
            clientName={client.name || 'Anonymous'}
            clientPhone={client.phone || ''}
            voiceEnabled={voiceEnabled}
          />
        </div>
      </section>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
        <div className="dashboard-stack">
          <div className="panel rounded-[32px] px-6 py-6">
            <p className="kicker">Contact</p>
            <div className="mt-5 space-y-4">
              {client.phone ? (
                <div className="flex items-center gap-3 rounded-[24px] bg-white/45 px-4 py-4 text-sm text-[var(--ink-soft)]">
                  <Phone className="h-4 w-4 text-[var(--accent)]" />
                  {client.phone}
                </div>
              ) : null}
              {client.email ? (
                <div className="flex items-center gap-3 rounded-[24px] bg-white/45 px-4 py-4 text-sm text-[var(--ink-soft)]">
                  <Mail className="h-4 w-4 text-[var(--teal)]" />
                  {client.email}
                </div>
              ) : null}
              {!client.phone && !client.email ? (
                <p className="text-sm text-[var(--ink-soft)]">No contact info available.</p>
              ) : null}
            </div>

            <div className="mt-6 border-t border-[var(--line)] pt-5">
              <p className="text-xs uppercase tracking-[0.18em] text-[var(--ink-faint)]">Channel identities</p>
              <div className="mt-4 space-y-3">
                {(client.channel_identities || []).map((identity, index: number) => (
                  <div key={index} className="flex items-center justify-between rounded-[22px] bg-white/45 px-4 py-3 text-sm">
                    <span className="capitalize text-[var(--ink-soft)]">
                      {identity.channel.replace('_', ' ')}
                    </span>
                    <span className="font-mono text-xs text-[var(--ink-faint)]">{identity.identifier}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <ClientDetailEnhanced
            client={client}
            notes={notes}
            tags={tags}
            appointments={appointments}
          />
        </div>

        <div className="panel dashboard-table rounded-[32px]">
          <div className="border-b border-[var(--line)] px-6 py-5">
            <p className="kicker">Conversation history</p>
            <h2 className="mt-2 text-2xl font-semibold text-[var(--ink)]">
              {conversations.length} interaction{conversations.length === 1 ? '' : 's'}
            </h2>
          </div>
          {conversations.length === 0 ? (
            <div className="dashboard-empty">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-[26px] bg-[rgba(208,109,79,0.12)]">
                <MessageSquare className="h-7 w-7 text-[var(--accent)]" />
              </div>
              <p className="mt-5 text-lg font-semibold text-[var(--ink)]">No conversations yet</p>
            </div>
          ) : (
            conversations.map((conversation) => (
              <Link
                key={conversation.id}
                href={`/conversations/${conversation.id}`}
                className="dashboard-table-row flex flex-col gap-3 px-6 py-5 sm:flex-row sm:items-center"
              >
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/55">
                  <MessageSquare className="h-4 w-4 text-[var(--accent)]" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold capitalize text-[var(--ink)]">
                    {conversation.channel.replace('_', ' ')}
                  </p>
                  <p className="mt-2 text-xs text-[var(--ink-faint)]">{formatDateTime(conversation.started_at)}</p>
                </div>
                <span
                  className={`chip capitalize ${
                    conversation.status === 'active'
                      ? 'chip-teal'
                      : conversation.status === 'escalated'
                      ? 'chip-accent'
                      : ''
                  }`}
                >
                  {conversation.status}
                </span>
              </Link>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
