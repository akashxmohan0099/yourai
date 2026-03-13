'use client'

import { useEffect, useState, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { formatDateTime } from '@/lib/utils'
import { ArrowLeft, Bot, User, MessageSquare, Phone, Mail, Smartphone, Clock } from 'lucide-react'
import Link from 'next/link'

interface Message {
  id: string
  role: string
  content: string
  created_at: string
  metadata?: Record<string, unknown>
}

interface ConversationDetailProps {
  conversation: any
  initialMessages: Message[]
  tenantId: string
}

const channelIcons: Record<string, React.ElementType> = {
  web_chat: MessageSquare,
  voice: Phone,
  email: Mail,
  sms: Smartphone,
}

export function ConversationDetail({
  conversation,
  initialMessages,
  tenantId,
}: ConversationDetailProps) {
  const [messages, setMessages] = useState(initialMessages)
  const bottomRef = useRef<HTMLDivElement>(null)
  const supabase = createClient()

  useEffect(() => {
    const channel = supabase
      .channel(`messages-${conversation.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversation.id}`,
        },
        (payload) => {
          setMessages((prev) => [...prev, payload.new as Message])
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [conversation.id, supabase])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const ChannelIcon = channelIcons[conversation.channel] || MessageSquare

  return (
    <div className="min-h-screen bg-stone-50">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Link
            href="/conversations"
            className="p-2.5 hover:bg-stone-200 bg-white border border-stone-200 rounded-xl transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-stone-600" />
          </Link>
          <div className="flex-1">
            <h1 className="text-2xl font-semibold text-stone-900">
              {conversation.clients?.name || 'Anonymous'}
            </h1>
            <div className="flex items-center gap-3 mt-1">
              <span className="flex items-center gap-1.5 text-sm text-stone-500 capitalize">
                <ChannelIcon className="w-4 h-4" />
                {conversation.channel.replace('_', ' ')}
              </span>
              <span
                className={`rounded-full px-3 py-1 text-xs font-medium ${
                  conversation.status === 'active'
                    ? 'bg-emerald-50 text-emerald-700'
                    : conversation.status === 'escalated'
                    ? 'bg-red-50 text-red-700'
                    : 'bg-stone-100 text-stone-600'
                }`}
              >
                {conversation.status}
              </span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Messages */}
          <div className="lg:col-span-3 bg-white rounded-2xl border border-stone-200 shadow-sm p-6 space-y-5 max-h-[600px] overflow-y-auto">
            {messages.length === 0 && (
              <div className="text-center py-12">
                <div className="w-14 h-14 bg-stone-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <MessageSquare className="w-7 h-7 text-stone-400" />
                </div>
                <p className="text-stone-700 font-medium">No messages yet</p>
              </div>
            )}
            {messages.map((msg) => {
              const isCustomer = msg.role === 'user'
              return (
                <div
                  key={msg.id}
                  className={`flex gap-3 ${isCustomer ? '' : ''}`}
                >
                  <div
                    className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 ${
                      isCustomer ? 'bg-violet-100' : 'bg-stone-100'
                    }`}
                  >
                    {isCustomer ? (
                      <User className="w-4 h-4 text-violet-600" />
                    ) : (
                      <Bot className="w-4 h-4 text-stone-600" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-stone-900">
                        {isCustomer ? 'Customer' : 'AI Assistant'}
                      </span>
                      <span className="text-xs text-stone-400">
                        {formatDateTime(msg.created_at)}
                      </span>
                    </div>
                    <p className="text-sm text-stone-700 mt-1 whitespace-pre-wrap leading-relaxed">
                      {msg.content}
                    </p>
                  </div>
                </div>
              )
            })}
            <div ref={bottomRef} />
          </div>

          {/* Sidebar metadata */}
          <div className="space-y-4">
            <div className="bg-white rounded-2xl border border-stone-200 shadow-sm p-5">
              <h3 className="text-sm font-semibold text-stone-900 mb-3">Details</h3>
              <div className="space-y-3">
                <div>
                  <p className="text-xs font-medium text-stone-500 uppercase tracking-wide">Client</p>
                  <p className="text-sm text-stone-900 mt-0.5">{conversation.clients?.name || 'Anonymous'}</p>
                </div>
                {conversation.clients?.email && (
                  <div>
                    <p className="text-xs font-medium text-stone-500 uppercase tracking-wide">Email</p>
                    <p className="text-sm text-stone-700 mt-0.5">{conversation.clients.email}</p>
                  </div>
                )}
                {conversation.clients?.phone && (
                  <div>
                    <p className="text-xs font-medium text-stone-500 uppercase tracking-wide">Phone</p>
                    <p className="text-sm text-stone-700 mt-0.5">{conversation.clients.phone}</p>
                  </div>
                )}
                <div>
                  <p className="text-xs font-medium text-stone-500 uppercase tracking-wide">Channel</p>
                  <p className="text-sm text-stone-700 mt-0.5 capitalize">{conversation.channel?.replace('_', ' ')}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-stone-500 uppercase tracking-wide">Started</p>
                  <p className="text-sm text-stone-700 mt-0.5">{formatDateTime(conversation.started_at)}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-stone-500 uppercase tracking-wide">Messages</p>
                  <p className="text-sm text-stone-700 mt-0.5">{messages.length}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
