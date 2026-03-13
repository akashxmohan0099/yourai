'use client'

import { useChat } from '@ai-sdk/react'
import { useState, useRef, useEffect } from 'react'
import { Send, X, MessageCircle } from 'lucide-react'
import { ChatMessage } from './chat-message'
import { cn } from '@/lib/utils'
import { DefaultChatTransport } from 'ai'

interface ChatWidgetProps {
  tenantSlug: string
  businessName: string
  embedded?: boolean
}

export function ChatWidget({ tenantSlug, businessName, embedded = false }: ChatWidgetProps) {
  const [isOpen, setIsOpen] = useState(embedded)
  const [input, setInput] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const { messages, sendMessage, status } = useChat({
    transport: new DefaultChatTransport({
      api: '/api/chat',
      body: { tenantSlug },
    }),
  })

  const isLoading = status === 'submitted' || status === 'streaming'

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || isLoading) return
    sendMessage({ text: input })
    setInput('')
  }

  if (!embedded && !isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 w-14 h-14 bg-[#1d1d1f] text-white rounded-full shadow-lg hover:bg-black transition-all hover:scale-105 flex items-center justify-center z-50"
        aria-label="Open chat"
      >
        <MessageCircle className="w-6 h-6" />
      </button>
    )
  }

  const containerClass = embedded
    ? 'flex flex-col h-screen'
    : 'fixed bottom-6 right-6 w-96 h-[600px] bg-white rounded-2xl shadow-2xl flex flex-col z-50 border border-[#d2d2d7]'

  return (
    <div className={containerClass}>
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 bg-[#1d1d1f] text-white rounded-t-2xl">
        <div>
          <h3 className="font-semibold text-sm">{businessName}</h3>
          <p className="text-xs text-[#86868b]">AI Assistant</p>
        </div>
        {!embedded && (
          <button
            onClick={() => setIsOpen(false)}
            className="p-1.5 hover:bg-black rounded-xl transition-colors"
            aria-label="Close chat"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-[#f5f5f7]">
        {messages.length === 0 && (
          <div className="text-center text-[#86868b] mt-8">
            <div className="w-10 h-10 rounded-full bg-[#f5f5f7] border border-[#d2d2d7] flex items-center justify-center mx-auto mb-3">
              <MessageCircle className="w-5 h-5 text-[#424245]" />
            </div>
            <p className="text-sm font-medium text-[#1d1d1f]">Hi there! How can I help you today?</p>
            <p className="text-xs text-[#86868b] mt-1">Send a message to get started</p>
          </div>
        )}
        {messages.map((message) => (
          <ChatMessage key={message.id} message={message} />
        ))}
        {isLoading && messages[messages.length - 1]?.role !== 'assistant' && (
          <div className="flex items-center gap-2 text-[#86868b]">
            <div className="flex gap-1">
              <span className="w-2 h-2 bg-[#86868b] rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
              <span className="w-2 h-2 bg-[#86868b] rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
              <span className="w-2 h-2 bg-[#86868b] rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSubmit} className="p-3 border-t border-[#d2d2d7] bg-white rounded-b-2xl">
        <div className="flex gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type a message..."
            className="flex-1 px-4 py-2.5 border border-[#d2d2d7] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#0066CC] focus:border-transparent transition-shadow"
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={isLoading || !input.trim()}
            className="px-3 py-2.5 bg-[#1d1d1f] text-white rounded-xl hover:bg-black disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            aria-label="Send message"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </form>
    </div>
  )
}
