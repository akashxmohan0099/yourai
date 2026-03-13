import { requireTenant } from '@/lib/auth/guards'
import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { formatDateTime, formatRelativeTime } from '@/lib/utils'
import { ArrowLeft, Phone, Mail, MessageSquare } from 'lucide-react'
import Link from 'next/link'
import { ClientDetailEnhanced } from '@/components/dashboard/client-detail-enhanced'
import { CallClientButton } from '@/components/dashboard/call-client-button'

interface Props {
  params: Promise<{ id: string }>
}

export default async function ClientDetailPage({ params }: Props) {
  const { id } = await params
  const { tenantId } = await requireTenant()
  const supabase = await createClient()

  const [clientResult, conversationsResult, notesResult, tagsResult, appointmentsResult, configResult] = await Promise.all([
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
    supabase
      .from('business_config')
      .select('voice_enabled')
      .eq('tenant_id', tenantId)
      .single(),
  ])

  const client = clientResult.data
  if (!client) notFound()

  const conversations = conversationsResult.data || []
  const notes = notesResult.data || []
  const tags = tagsResult.data || []
  const appointments = appointmentsResult.data || []
  const voiceEnabled = configResult.data?.voice_enabled || false

  return (
    <div className="min-h-screen bg-stone-50">
      <div className="space-y-6 max-w-7xl mx-auto px-4 py-6">
        <div className="flex items-center gap-4">
          <Link href="/clients" className="p-2.5 hover:bg-stone-200 bg-white border border-stone-200 rounded-xl transition-colors">
            <ArrowLeft className="w-5 h-5 text-stone-600" />
          </Link>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-violet-100 rounded-full flex items-center justify-center">
              <span className="text-violet-600 font-semibold text-lg">
                {(client.name || 'A').charAt(0).toUpperCase()}
              </span>
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-semibold text-stone-900">{client.name || 'Anonymous'}</h1>
                <CallClientButton
                  clientId={client.id}
                  clientName={client.name || 'Anonymous'}
                  clientPhone={client.phone || ''}
                  voiceEnabled={voiceEnabled}
                />
              </div>
              <p className="text-sm text-stone-500">
                First seen {formatRelativeTime(client.first_seen_at)} — Last seen {formatRelativeTime(client.last_seen_at)}
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left column: Contact + Notes/Tags/Appointments */}
          <div className="space-y-6">
            {/* Contact info */}
            <div className="bg-white rounded-2xl border border-stone-200 shadow-sm p-6 space-y-4">
              <h2 className="text-sm font-semibold text-stone-500 uppercase tracking-wide">Contact</h2>
              {client.phone && (
                <div className="flex items-center gap-2.5 text-sm text-stone-700">
                  <Phone className="w-4 h-4 text-stone-400" /> {client.phone}
                </div>
              )}
              {client.email && (
                <div className="flex items-center gap-2.5 text-sm text-stone-700">
                  <Mail className="w-4 h-4 text-stone-400" /> {client.email}
                </div>
              )}
              {!client.phone && !client.email && (
                <p className="text-sm text-stone-400">No contact info</p>
              )}

              <h3 className="text-sm font-semibold text-stone-500 uppercase tracking-wide pt-2">Channels</h3>
              {(client.channel_identities || []).map((ci: any, i: number) => (
                <div key={i} className="flex items-center justify-between text-sm">
                  <span className="capitalize text-stone-700">{ci.channel.replace('_', ' ')}</span>
                  <span className="text-xs text-stone-400 font-mono">{ci.identifier}</span>
                </div>
              ))}
            </div>

            {/* Notes, Tags, Appointments (client component) */}
            <ClientDetailEnhanced
              client={client}
              notes={notes}
              tags={tags}
              appointments={appointments}
              tenantId={tenantId}
            />
          </div>

          {/* Right column: Conversation history */}
          <div className="lg:col-span-2 bg-white rounded-2xl border border-stone-200 shadow-sm p-6">
            <h2 className="text-sm font-semibold text-stone-500 uppercase tracking-wide mb-4">
              Conversations ({conversations.length})
            </h2>
            {conversations.length === 0 ? (
              <div className="text-center py-8">
                <div className="w-12 h-12 bg-stone-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
                  <MessageSquare className="w-6 h-6 text-stone-400" />
                </div>
                <p className="text-sm text-stone-500">No conversations yet</p>
              </div>
            ) : (
              <div className="divide-y divide-stone-100">
                {conversations.map((conv: any) => (
                  <Link
                    key={conv.id}
                    href={`/conversations/${conv.id}`}
                    className="flex items-center gap-3 py-3.5 hover:bg-stone-50 -mx-3 px-3 rounded-xl transition-colors"
                  >
                    <div className="p-2 bg-stone-100 rounded-lg">
                      <MessageSquare className="w-4 h-4 text-stone-500" />
                    </div>
                    <div className="flex-1">
                      <span className="text-sm text-stone-700 capitalize font-medium">
                        {conv.channel.replace('_', ' ')}
                      </span>
                      <span className={`ml-2 rounded-full px-3 py-1 text-xs font-medium ${
                        conv.status === 'active' ? 'bg-emerald-50 text-emerald-700' :
                        conv.status === 'escalated' ? 'bg-red-50 text-red-700' :
                        'bg-stone-100 text-stone-600'
                      }`}>
                        {conv.status}
                      </span>
                    </div>
                    <span className="text-xs text-stone-400">{formatDateTime(conv.started_at)}</span>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
