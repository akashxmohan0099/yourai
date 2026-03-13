'use client'

import { createClient } from '@/lib/supabase/client'
import { formatDateTime } from '@/lib/utils'
import {
  ArrowLeft,
  Bot,
  Clock,
  FileText,
  Mail,
  MessageSquare,
  Phone,
  PhoneCall,
  Smartphone,
  User,
} from 'lucide-react'
import Link from 'next/link'
import { useEffect, useRef, useState, type ElementType } from 'react'

interface Message {
  id: string
  role: string
  content: string
  created_at: string
  metadata?: Record<string, unknown>
}

interface ConversationRecord {
  id: string
  channel: string
  status: string
  started_at: string
  ended_at?: string | null
  metadata?: Record<string, unknown> | null
  clients?: {
    name?: string | null
    email?: string | null
    phone?: string | null
  } | null
}

interface ConversationDetailProps {
  conversation: ConversationRecord
  initialMessages: Message[]
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
  sms: 'Text Message',
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

function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  if (mins === 0) return `${secs}s`
  return `${mins}m ${secs}s`
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
          setMessages((previous) => [...previous, payload.new as Message])
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [conversation.id, supabase, tenantId])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const ChannelIcon = channelIcons[conversation.channel] || MessageSquare
  const channelLabel = channelLabels[conversation.channel] || conversation.channel
  const badgeStyle = channelBadgeStyles[conversation.channel] || 'chip'
  const metadata = conversation.metadata || {}
  const isVoice = conversation.channel === 'voice'
  const callSummary = metadata.summary as string | undefined
  const callTranscript = metadata.transcript as string | undefined
  const recordingUrl = metadata.recordingUrl as string | undefined
  const durationSeconds = metadata.durationSeconds as number | undefined
  const endedReason = metadata.endedReason as string | undefined
  const callerNumber = metadata.callerNumber as string | undefined

  return (
    <div className="dashboard-stack">
      <section className="panel rounded-[32px] px-5 py-5 sm:px-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex items-start gap-4">
            <Link href="/conversations" className="btn-secondary h-11 w-11 rounded-2xl px-0">
              <ArrowLeft className="h-4 w-4" />
            </Link>
            <div className="space-y-3">
              <p className="kicker">Conversation record</p>
              <div>
                <h1 className="text-3xl font-semibold text-[var(--ink)]">
                  {conversation.clients?.name || 'Anonymous'}
                </h1>
                <p className="mt-2 text-sm leading-7 text-[var(--ink-soft)]">
                  Detailed timeline, metadata, and channel context for this customer thread.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <span className={badgeStyle}>
                  <ChannelIcon className="h-3.5 w-3.5" />
                  {channelLabel}
                </span>
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
                {isVoice && durationSeconds ? (
                  <span className="chip">
                    <Clock className="h-3.5 w-3.5" />
                    {formatDuration(durationSeconds)}
                  </span>
                ) : null}
              </div>
            </div>
          </div>

          <div className="panel-muted rounded-[26px] px-4 py-4 lg:max-w-sm">
            <p className="text-xs uppercase tracking-[0.2em] text-[var(--ink-faint)]">Started</p>
            <p className="mt-2 text-sm font-semibold text-[var(--ink)]">
              {formatDateTime(conversation.started_at)}
            </p>
            <p className="mt-2 text-sm leading-7 text-[var(--ink-soft)]">
              {messages.length} message{messages.length === 1 ? '' : 's'} captured so far.
            </p>
          </div>
        </div>
      </section>

      {isVoice && callSummary ? (
        <div className="panel rounded-[30px] px-5 py-5 sm:px-6">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[rgba(43,114,107,0.12)]">
              <FileText className="h-5 w-5 text-[var(--teal)]" />
            </div>
            <div>
              <p className="kicker">Call summary</p>
              <p className="mt-3 text-sm leading-8 text-[var(--ink-soft)]">{callSummary}</p>
            </div>
          </div>
        </div>
      ) : null}

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.35fr)_minmax(20rem,0.7fr)]">
        <div className="dashboard-stack">
          <div className="panel rounded-[32px] px-5 py-5 sm:px-6">
            <div className="flex items-center justify-between gap-4 border-b border-[var(--line)] pb-4">
              <div>
                <p className="kicker">Timeline</p>
                <h2 className="mt-2 text-2xl font-semibold text-[var(--ink)]">Messages</h2>
              </div>
              <span className="chip">{messages.length} captured</span>
            </div>

            <div className="mt-5 max-h-[42rem] space-y-4 overflow-y-auto pr-1">
              {messages.length === 0 && !callTranscript ? (
                <div className="dashboard-empty rounded-[28px] bg-white/40">
                  <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-[26px] bg-[rgba(208,109,79,0.12)]">
                    <MessageSquare className="h-7 w-7 text-[var(--accent)]" />
                  </div>
                  <p className="mt-5 text-lg font-semibold text-[var(--ink)]">No messages yet</p>
                </div>
              ) : null}

              {messages.map((message) => {
                const isCustomer = message.role === 'user'
                const msgChannel = (message.metadata?.channel as string) || conversation.channel
                const isVoiceMessage = msgChannel === 'voice'

                return (
                  <div
                    key={message.id}
                    className={`flex gap-3 ${isCustomer ? 'justify-end' : 'justify-start'}`}
                  >
                    {!isCustomer ? (
                      <div className="mt-1 flex h-10 w-10 items-center justify-center rounded-2xl bg-[rgba(43,114,107,0.12)]">
                        <Bot className="h-4 w-4 text-[var(--teal)]" />
                      </div>
                    ) : null}
                    <div
                      className={`max-w-[80%] rounded-[26px] px-4 py-4 ${
                        isCustomer
                          ? 'bg-[linear-gradient(135deg,var(--accent),var(--teal))] text-white'
                          : 'panel-muted'
                      }`}
                    >
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className={`text-xs font-semibold uppercase tracking-[0.12em] ${
                            isCustomer ? 'text-white/78' : 'text-[var(--ink-faint)]'
                          }`}
                        >
                          {isCustomer ? 'Customer' : 'AI Assistant'}
                        </span>
                        <span
                          className={`text-xs ${
                            isCustomer ? 'text-white/62' : 'text-[var(--ink-faint)]'
                          }`}
                        >
                          {formatDateTime(message.created_at)}
                        </span>
                        {isVoiceMessage ? (
                          <span
                            className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${
                              isCustomer
                                ? 'bg-white/12 text-white'
                                : 'bg-[rgba(208,109,79,0.12)] text-[var(--accent)]'
                            }`}
                          >
                            voice
                          </span>
                        ) : null}
                      </div>
                      <p
                        className={`mt-3 whitespace-pre-wrap text-sm leading-7 ${
                          isCustomer ? 'text-white' : 'text-[var(--ink-soft)]'
                        }`}
                      >
                        {message.content}
                      </p>
                    </div>
                    {isCustomer ? (
                      <div className="mt-1 flex h-10 w-10 items-center justify-center rounded-2xl bg-[rgba(208,109,79,0.12)]">
                        <User className="h-4 w-4 text-[var(--accent)]" />
                      </div>
                    ) : null}
                  </div>
                )
              })}
              <div ref={bottomRef} />
            </div>
          </div>

          {isVoice && callTranscript ? (
            <div className="panel rounded-[32px] px-5 py-5 sm:px-6">
              <div className="flex items-center gap-3 border-b border-[var(--line)] pb-4">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[rgba(208,109,79,0.12)]">
                  <PhoneCall className="h-5 w-5 text-[var(--accent)]" />
                </div>
                <div>
                  <p className="kicker">Call transcript</p>
                  <h3 className="mt-2 text-2xl font-semibold text-[var(--ink)]">Full voice record</h3>
                </div>
              </div>
              <div className="mt-5 max-h-[26rem] space-y-3 overflow-y-auto pr-1">
                {callTranscript.split('\n').map((line, index) => {
                  const isAI = line.startsWith('AI:')
                  const speaker = isAI ? 'AI' : 'Customer'
                  const text = line.replace(/^(Customer|AI):\s*/, '')
                  if (!text.trim()) return null

                  return (
                    <div key={index} className="flex gap-3 rounded-[24px] bg-white/40 px-4 py-4">
                      <div
                        className={`flex h-9 w-9 items-center justify-center rounded-2xl ${
                          isAI
                            ? 'bg-[rgba(43,114,107,0.12)] text-[var(--teal)]'
                            : 'bg-[rgba(208,109,79,0.12)] text-[var(--accent)]'
                        }`}
                      >
                        {isAI ? <Bot className="h-4 w-4" /> : <User className="h-4 w-4" />}
                      </div>
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--ink-faint)]">
                          {speaker}
                        </p>
                        <p className="mt-2 text-sm leading-7 text-[var(--ink-soft)]">{text}</p>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          ) : null}
        </div>

        <div className="dashboard-stack">
          <div className="panel rounded-[32px] px-5 py-5 sm:px-6">
            <p className="kicker">Metadata</p>
            <h3 className="mt-2 text-2xl font-semibold text-[var(--ink)]">Details</h3>
            <div className="mt-5 space-y-4">
              <div className="rounded-[24px] bg-white/40 px-4 py-4">
                <p className="text-xs uppercase tracking-[0.18em] text-[var(--ink-faint)]">Client</p>
                <p className="mt-2 text-sm font-semibold text-[var(--ink)]">
                  {conversation.clients?.name || 'Anonymous'}
                </p>
              </div>
              {conversation.clients?.email ? (
                <div className="rounded-[24px] bg-white/40 px-4 py-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-[var(--ink-faint)]">Email</p>
                  <p className="mt-2 text-sm text-[var(--ink-soft)]">{conversation.clients.email}</p>
                </div>
              ) : null}
              {conversation.clients?.phone || callerNumber ? (
                <div className="rounded-[24px] bg-white/40 px-4 py-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-[var(--ink-faint)]">Phone</p>
                  <p className="mt-2 text-sm text-[var(--ink-soft)]">
                    {conversation.clients?.phone || callerNumber}
                  </p>
                </div>
              ) : null}
              <div className="rounded-[24px] bg-white/40 px-4 py-4">
                <p className="text-xs uppercase tracking-[0.18em] text-[var(--ink-faint)]">Started</p>
                <p className="mt-2 text-sm text-[var(--ink-soft)]">{formatDateTime(conversation.started_at)}</p>
              </div>
              {conversation.ended_at ? (
                <div className="rounded-[24px] bg-white/40 px-4 py-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-[var(--ink-faint)]">Ended</p>
                  <p className="mt-2 text-sm text-[var(--ink-soft)]">{formatDateTime(conversation.ended_at)}</p>
                </div>
              ) : null}
            </div>
          </div>

          {isVoice ? (
            <div className="panel rounded-[32px] px-5 py-5 sm:px-6">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[rgba(43,114,107,0.12)]">
                  <Phone className="h-5 w-5 text-[var(--teal)]" />
                </div>
                <div>
                  <p className="kicker">Voice session</p>
                  <h3 className="mt-2 text-2xl font-semibold text-[var(--ink)]">Call details</h3>
                </div>
              </div>
              <div className="mt-5 space-y-4">
                {durationSeconds ? (
                  <div className="rounded-[24px] bg-white/40 px-4 py-4">
                    <p className="text-xs uppercase tracking-[0.18em] text-[var(--ink-faint)]">Duration</p>
                    <p className="mt-2 text-sm text-[var(--ink-soft)]">{formatDuration(durationSeconds)}</p>
                  </div>
                ) : null}
                {endedReason ? (
                  <div className="rounded-[24px] bg-white/40 px-4 py-4">
                    <p className="text-xs uppercase tracking-[0.18em] text-[var(--ink-faint)]">Ended reason</p>
                    <p className="mt-2 text-sm capitalize text-[var(--ink-soft)]">
                      {endedReason.replace(/[-_]/g, ' ')}
                    </p>
                  </div>
                ) : null}
                {recordingUrl ? (
                  <div className="rounded-[24px] bg-white/40 px-4 py-4">
                    <p className="text-xs uppercase tracking-[0.18em] text-[var(--ink-faint)]">Recording</p>
                    <audio controls className="mt-3 w-full" src={recordingUrl}>
                      <a href={recordingUrl} target="_blank" rel="noopener noreferrer">
                        Listen to recording
                      </a>
                    </audio>
                  </div>
                ) : null}
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  )
}
