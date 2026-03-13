'use client'

import { useEffect, useState, type ElementType } from 'react'
import { createClient } from '@/lib/supabase/client'
import { formatRelativeTime } from '@/lib/utils'
import Link from 'next/link'
import { MessageSquare, Phone, Mail, Smartphone } from 'lucide-react'

interface Conversation {
  id: string
  channel: string
  status: string
  subject?: string
  started_at: string
  updated_at: string
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

const channelColors: Record<string, string> = {
  web_chat: 'bg-[#f5f5f7] text-[#424245]',
  voice: 'bg-emerald-50 text-emerald-600',
  email: 'bg-[#f5f5f7] text-[#424245]',
  sms: 'bg-amber-50 text-amber-600',
}

export function ConversationsList({
  conversations: initialConversations,
  tenantId,
}: ConversationsListProps) {
  const [conversations, setConversations] = useState(initialConversations)
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
          // Refetch on any change
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

  if (conversations.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-[#d2d2d7] shadow-sm p-12 text-center">
        <div className="w-14 h-14 bg-[#f5f5f7] rounded-2xl flex items-center justify-center mx-auto mb-4">
          <MessageSquare className="w-7 h-7 text-[#86868b]" />
        </div>
        <p className="text-[#424245] font-medium text-base">No conversations yet</p>
        <p className="text-sm text-[#86868b] mt-1">
          They&apos;ll appear here once customers start chatting
        </p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-2xl border border-[#d2d2d7] shadow-sm divide-y divide-[#f5f5f7]">
      {conversations.map((conv) => {
        const ChannelIcon = channelIcons[conv.channel] || MessageSquare
        const iconColor = channelColors[conv.channel] || 'bg-[#f5f5f7] text-[#424245]'
        return (
          <Link
            key={conv.id}
            href={`/conversations/${conv.id}`}
            className="flex items-center gap-4 px-6 py-4 hover:bg-[#f5f5f7] transition-colors"
          >
            <div className={`p-2.5 rounded-xl ${iconColor}`}>
              <ChannelIcon className="w-4 h-4" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2.5">
                <p className="text-sm font-semibold text-[#1d1d1f]">
                  {conv.clients?.name || 'Anonymous'}
                </p>
                <span
                  className={`rounded-full px-3 py-1 text-xs font-medium ${
                    conv.status === 'active'
                      ? 'bg-emerald-50 text-emerald-700'
                      : conv.status === 'escalated'
                      ? 'bg-red-50 text-red-700'
                      : 'bg-[#f5f5f7] text-[#424245]'
                  }`}
                >
                  {conv.status}
                </span>
              </div>
              <p className="text-sm text-[#86868b] mt-0.5">
                <span className="capitalize">{conv.channel.replace('_', ' ')}</span>
                {' \u00b7 '}
                {formatRelativeTime(conv.updated_at)}
              </p>
            </div>
          </Link>
        )
      })}
    </div>
  )
}
