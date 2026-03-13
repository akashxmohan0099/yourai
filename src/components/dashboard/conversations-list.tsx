'use client'

import { createClient } from '@/lib/supabase/client'
import { formatRelativeTime } from '@/lib/utils'
import {
  FileText,
  Mail,
  MessageSquare,
  Phone,
  Smartphone,
} from 'lucide-react'
import Link from 'next/link'
import { useEffect, useState, type ElementType } from 'react'

interface Conversation {
  id: string
  channel: string
  status: string
  subject?: string
  metadata?: Record<string, unknown>
  started_at: string
  updated_at: string
  ended_at?: string
  clients?: { name?: string; email?: string; phone?: string }
}

interface ConversationsListProps {
  conversations: Conversation[]
  tenantId: string
}

const channelIcons: Record<string, ElementType> = {
  web_chat: MessageSquare,
  voice: Phone,
  email: Mail,
  sms: Smartphone,
}

const channelLabels: Record<string, string> = {
  web_chat: 'Web Chat',
  voice: 'Phone Call',
  sms: 'Text',
  email: 'Email',
  whatsapp: 'WhatsApp',
}

const channelBadgeStyles: Record<string, string> = {
  web_chat: 'chip chip-teal',
  voice: 'chip chip-accent',
  sms: 'chip',
  email: 'chip',
  whatsapp: 'chip chip-teal',
}

const channelIconColors: Record<string, string> = {
  web_chat: 'bg-[rgba(43,114,107,0.12)] text-[var(--teal)]',
  voice: 'bg-[rgba(208,109,79,0.12)] text-[var(--accent)]',
  email: 'bg-[rgba(36,28,23,0.08)] text-[var(--ink)]',
  sms: 'bg-[rgba(201,146,64,0.12)] text-[var(--gold)]',
}

const filterTabs = [
  { key: 'all', label: 'All', icon: MessageSquare },
  { key: 'voice', label: 'Phone', icon: Phone },
  { key: 'sms', label: 'Text', icon: Smartphone },
  { key: 'web_chat', label: 'Web Chat', icon: MessageSquare },
  { key: 'email', label: 'Email', icon: Mail },
]

export function ConversationsList({
  conversations: initialConversations,
  tenantId,
}: ConversationsListProps) {
  const [conversations, setConversations] = useState(initialConversations)
  const [activeFilter, setActiveFilter] = useState('all')
  const supabase = createClient()

  useEffect(() => {
    const channel = supabase
      .channel('conversations-realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'conversations',
          filter: `tenant_id=eq.${tenantId}`,
        },
        async () => {
          const { data } = await supabase
            .from('conversations')
            .select('*, clients(name, email, phone)')
            .eq('tenant_id', tenantId)
            .order('updated_at', { ascending: false })
            .limit(50)
          if (data) setConversations(data)
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [tenantId, supabase])

  const filtered =
    activeFilter === 'all'
      ? conversations
      : conversations.filter((conversation) => conversation.channel === activeFilter)

  const channelCounts = conversations.reduce<Record<string, number>>((acc, conversation) => {
    acc[conversation.channel] = (acc[conversation.channel] || 0) + 1
    return acc
  }, {})

  if (conversations.length === 0) {
    return (
      <div className="panel rounded-[32px]">
        <div className="dashboard-empty">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-[26px] bg-[rgba(208,109,79,0.12)]">
            <MessageSquare className="h-7 w-7 text-[var(--accent)]" />
          </div>
          <p className="mt-5 text-lg font-semibold text-[var(--ink)]">No conversations yet</p>
          <p className="mt-2 text-sm leading-7 text-[var(--ink-soft)]">
            They&apos;ll appear here once customers start chatting, calling, emailing, or texting.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="dashboard-stack">
      <div className="flex flex-wrap items-center gap-2">
        {filterTabs.map((tab) => {
          const count = tab.key === 'all' ? conversations.length : (channelCounts[tab.key] || 0)
          const isActive = activeFilter === tab.key
          const Icon = tab.icon
          if (tab.key !== 'all' && count === 0) return null
          return (
            <button
              key={tab.key}
              onClick={() => setActiveFilter(tab.key)}
              className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium ${
                isActive ? 'btn-primary' : 'btn-secondary'
              }`}
            >
              <Icon className="h-4 w-4" />
              {tab.label}
              <span className={`${isActive ? 'text-white/75' : 'text-[var(--ink-faint)]'}`}>{count}</span>
            </button>
          )
        })}
      </div>

      <div className="panel dashboard-table rounded-[32px]">
        {filtered.length === 0 ? (
          <div className="dashboard-empty">
            <p className="text-sm text-[var(--ink-soft)]">No conversations in this channel.</p>
          </div>
        ) : (
          filtered.map((conversation) => {
            const ChannelIcon = channelIcons[conversation.channel] || MessageSquare
            const iconColor = channelIconColors[conversation.channel] || 'bg-white/50 text-[var(--ink)]'
            const badgeStyle = channelBadgeStyles[conversation.channel] || 'chip'
            const label = channelLabels[conversation.channel] || conversation.channel
            const metadata = conversation.metadata || {}
            const hasSummary = conversation.channel === 'voice' && !!metadata.summary
            const duration = metadata.durationSeconds as number | undefined

            return (
              <Link
                key={conversation.id}
                href={`/conversations/${conversation.id}`}
                className="dashboard-table-row flex items-center gap-4 px-5 py-5 sm:px-6"
              >
                <div className={`flex h-12 w-12 items-center justify-center rounded-2xl ${iconColor}`}>
                  <ChannelIcon className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-semibold text-[var(--ink)]">
                      {conversation.clients?.name || 'Anonymous'}
                    </p>
                    <span className={badgeStyle}>{label}</span>
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
                  </div>
                  <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-[var(--ink-faint)]">
                    <span>{formatRelativeTime(conversation.updated_at)}</span>
                    {conversation.channel === 'voice' && duration ? (
                      <span>
                        {Math.floor(duration / 60)}:{String(duration % 60).padStart(2, '0')} call
                      </span>
                    ) : null}
                    {hasSummary ? (
                      <span className="inline-flex items-center gap-1">
                        <FileText className="h-3 w-3" />
                        Summary
                      </span>
                    ) : null}
                  </div>
                </div>
              </Link>
            )
          })
        )}
      </div>
    </div>
  )
}
