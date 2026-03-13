'use client'

import { DefaultChatTransport } from 'ai'
import { useChat } from '@ai-sdk/react'
import { Bot, Send, Sparkles, User } from 'lucide-react'
import { useState } from 'react'

const transport = new DefaultChatTransport({
  api: '/api/owner-chat',
})

const suggestions = [
  "What's my schedule today?",
  'Book Mrs. Chen for Thursday 2pm',
  'Search for client John',
  "Cancel tomorrow's 10am appointment",
]

interface ChatPart {
  type: string
  text?: string
}

export default function OwnerChatPage() {
  const { messages, sendMessage, status } = useChat({ transport })
  const [input, setInput] = useState('')

  const handleSend = () => {
    if (!input.trim() || status === 'streaming') return
    sendMessage({ text: input })
    setInput('')
  }

  return (
    <div className="dashboard-stack">
      <section className="panel rounded-[32px] px-6 py-6">
        <p className="kicker">Owner assistant</p>
        <div className="mt-3 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="text-4xl font-semibold text-[var(--ink)]">Ask the workspace directly.</h1>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-[var(--ink-soft)]">
              Use the owner assistant for operational questions and actions that require the full internal toolset.
            </p>
          </div>
          <span className="chip chip-teal capitalize">{status === 'streaming' ? 'Responding' : 'Ready'}</span>
        </div>
      </section>

      <div className="panel flex min-h-[70vh] flex-col overflow-hidden rounded-[32px]">
        <div className="border-b border-[var(--line)] px-6 py-5">
          <p className="text-xs uppercase tracking-[0.18em] text-[var(--ink-faint)]">Conversation</p>
        </div>

        <div className="flex-1 space-y-5 overflow-y-auto px-6 py-6">
          {messages.length === 0 ? (
            <div className="mx-auto mt-8 max-w-2xl text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-[26px] bg-[rgba(43,114,107,0.12)]">
                <Sparkles className="h-7 w-7 text-[var(--teal)]" />
              </div>
              <h2 className="mt-5 text-2xl font-semibold text-[var(--ink)]">What do you need reviewed?</h2>
              <p className="mt-3 text-sm leading-7 text-[var(--ink-soft)]">
                Ask about schedules, clients, approvals, quotes, or next steps for the day.
              </p>
              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                {suggestions.map((suggestion) => (
                  <button
                    key={suggestion}
                    onClick={() => setInput(suggestion)}
                    className="rounded-[24px] border border-[var(--line)] bg-white/45 px-4 py-4 text-left text-sm text-[var(--ink-soft)] hover:bg-white/70"
                  >
                    &quot;{suggestion}&quot;
                  </button>
                ))}
              </div>
            </div>
          ) : null}

          {messages.map((message) => {
            const isUser = message.role === 'user'
            const text =
              message.parts
                ?.filter((part: ChatPart) => part.type === 'text')
                .map((part: ChatPart) => part.text || '')
                .join('') || ''

            return (
              <div key={message.id} className={`flex gap-3 ${isUser ? 'justify-end' : ''}`}>
                {!isUser ? (
                  <div className="mt-1 flex h-10 w-10 items-center justify-center rounded-2xl bg-[rgba(43,114,107,0.12)]">
                    <Bot className="h-4 w-4 text-[var(--teal)]" />
                  </div>
                ) : null}
                <div
                  className={`max-w-[78%] rounded-[26px] px-4 py-4 ${
                    isUser
                      ? 'bg-[linear-gradient(135deg,var(--accent),var(--teal))] text-white'
                      : 'panel-muted'
                  }`}
                >
                  <p className={`text-xs font-semibold uppercase tracking-[0.16em] ${isUser ? 'text-white/78' : 'text-[var(--ink-faint)]'}`}>
                    {isUser ? 'You' : 'Assistant'}
                  </p>
                  <p className={`mt-3 whitespace-pre-wrap text-sm leading-7 ${isUser ? 'text-white' : 'text-[var(--ink-soft)]'}`}>
                    {text}
                  </p>
                </div>
                {isUser ? (
                  <div className="mt-1 flex h-10 w-10 items-center justify-center rounded-2xl bg-[rgba(208,109,79,0.12)]">
                    <User className="h-4 w-4 text-[var(--accent)]" />
                  </div>
                ) : null}
              </div>
            )
          })}

          {status === 'streaming' ? (
            <div className="flex gap-3">
              <div className="mt-1 flex h-10 w-10 items-center justify-center rounded-2xl bg-[rgba(43,114,107,0.12)]">
                <Bot className="h-4 w-4 text-[var(--teal)]" />
              </div>
              <div className="panel-muted rounded-[26px] px-4 py-4">
                <div className="flex gap-1.5">
                  <span className="h-2 w-2 animate-bounce rounded-full bg-[var(--ink-faint)]" />
                  <span className="h-2 w-2 animate-bounce rounded-full bg-[var(--ink-faint)] [animation-delay:0.1s]" />
                  <span className="h-2 w-2 animate-bounce rounded-full bg-[var(--ink-faint)] [animation-delay:0.2s]" />
                </div>
              </div>
            </div>
          ) : null}
        </div>

        <div className="border-t border-[var(--line)] px-6 py-5">
          <div className="flex gap-3">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
              placeholder="Ask your AI assistant..."
              className="field-input flex-1 text-sm"
            />
            <button
              onClick={handleSend}
              disabled={!input.trim() || status === 'streaming'}
              className="btn-primary h-12 w-12 rounded-2xl px-0"
            >
              <Send className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
