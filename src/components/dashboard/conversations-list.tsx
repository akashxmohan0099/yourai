'use client'

import { useEffect, useState } from 'react'
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

const channelIcons: Record<string, React.ElementType> = {
  web_chat: MessageSquare,
  voice: Phone,
  email: Mail,
  sms: Smartphone,
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
      <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
        <MessageSquare className="w-10 h-10 mx-auto mb-3 text-gray-300" />
        <p className="text-gray-500">No conversations yet</p>
        <p className="text-sm text-gray-400 mt-1">
          They'll appear here once customers start chatting
        </p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100">
      {conversations.map((conv) => {
        const ChannelIcon = channelIcons[conv.channel] || MessageSquare
        return (
          <Link
            key={conv.id}
            href={`/conversations/${conv.id}`}
            className="flex items-center gap-4 px-5 py-4 hover:bg-gray-50 transition-colors"
          >
            <div className="p-2 rounded-lg bg-gray-100">
              <ChannelIcon className="w-4 h-4 text-gray-600" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="text-sm font-medium text-gray-900">
                  {conv.clients?.name || 'Anonymous'}
                </p>
                <span
                  className={`px-2 py-0.5 text-xs rounded-full ${
                    conv.status === 'active'
                      ? 'bg-green-100 text-green-700'
                      : conv.status === 'escalated'
                      ? 'bg-red-100 text-red-700'
                      : 'bg-gray-100 text-gray-600'
                  }`}
                >
                  {conv.status}
                </span>
              </div>
              <p className="text-xs text-gray-500 mt-0.5">
                {conv.channel.replace('_', ' ')} • {formatRelativeTime(conv.updated_at)}
              </p>
            </div>
          </Link>
        )
      })}
    </div>
  )
}
