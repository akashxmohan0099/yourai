'use client'

import { useChat } from '@ai-sdk/react'
import { DefaultChatTransport } from 'ai'
import { useState } from 'react'
import { Send, Bot, User, Sparkles } from 'lucide-react'

const transport = new DefaultChatTransport({
  api: '/api/owner-chat',
})

export default function OwnerChatPage() {
  const { messages, sendMessage, status } = useChat({ transport })
  const [input, setInput] = useState('')

  const handleSend = () => {
    if (!input.trim() || status === 'streaming') return
    sendMessage({ text: input })
    setInput('')
  }

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] bg-[#f5f5f7]">
      <div className="mb-6 px-4 pt-6 max-w-4xl mx-auto w-full">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-[#f5f5f7] rounded-xl">
            <Sparkles className="w-5 h-5 text-[#1d1d1f]" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-[#1d1d1f]">AI Assistant</h1>
            <p className="text-[#86868b]">
              Chat with your AI to manage appointments, clients, and more
            </p>
          </div>
        </div>
      </div>

      <div className="flex-1 max-w-4xl mx-auto w-full px-4 pb-4">
        <div className="bg-white rounded-2xl border border-[#d2d2d7] shadow-sm flex flex-col overflow-hidden h-full">
          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-6 space-y-5">
            {messages.length === 0 && (
              <div className="text-center mt-16">
                <div className="w-16 h-16 bg-[#f5f5f7] rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Bot className="w-8 h-8 text-[#86868b]" />
                </div>
                <p className="text-lg font-semibold text-[#1d1d1f] mb-1">How can I help you today?</p>
                <p className="text-[#86868b] text-sm mb-6">Try asking me something like...</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-md mx-auto text-sm">
                  {[
                    "What's my schedule today?",
                    "Book Mrs. Chen for Thursday 2pm",
                    "Search for client John",
                    "Cancel tomorrow's 10am appointment",
                  ].map((suggestion) => (
                    <button
                      key={suggestion}
                      onClick={() => {
                        setInput(suggestion)
                      }}
                      className="bg-[#f5f5f7] hover:bg-[#d2d2d7] border border-[#d2d2d7] hover:border-[#86868b] rounded-xl px-4 py-3 text-[#424245] hover:text-[#1d1d1f] transition-colors text-left"
                    >
                      &quot;{suggestion}&quot;
                    </button>
                  ))}
                </div>
              </div>
            )}
            {messages.map((message) => {
              const isUser = message.role === 'user'
              const text = message.parts
                ?.filter((p: any) => p.type === 'text')
                .map((p: any) => p.text)
                .join('') || ''
              return (
                <div
                  key={message.id}
                  className={`flex gap-3 ${isUser ? 'justify-end' : ''}`}
                >
                  {!isUser && (
                    <div className="w-9 h-9 rounded-full bg-[#f5f5f7] flex items-center justify-center flex-shrink-0">
                      <Bot className="w-4 h-4 text-[#1d1d1f]" />
                    </div>
                  )}
                  <div
                    className={`max-w-[70%] rounded-2xl px-4 py-3 ${
                      isUser
                        ? 'bg-[#1d1d1f] text-white'
                        : 'bg-[#f5f5f7] text-[#1d1d1f]'
                    }`}
                  >
                    <p className="text-sm whitespace-pre-wrap leading-relaxed">{text}</p>
                  </div>
                  {isUser && (
                    <div className="w-9 h-9 rounded-full bg-[#d2d2d7] flex items-center justify-center flex-shrink-0">
                      <User className="w-4 h-4 text-[#424245]" />
                    </div>
                  )}
                </div>
              )
            })}
            {status === 'streaming' && (
              <div className="flex gap-3">
                <div className="w-9 h-9 rounded-full bg-[#f5f5f7] flex items-center justify-center flex-shrink-0">
                  <Bot className="w-4 h-4 text-[#1d1d1f]" />
                </div>
                <div className="bg-[#f5f5f7] rounded-2xl px-4 py-3">
                  <div className="flex gap-1.5">
                    <span className="w-2 h-2 bg-[#86868b] rounded-full animate-bounce" />
                    <span className="w-2 h-2 bg-[#86868b] rounded-full animate-bounce [animation-delay:0.1s]" />
                    <span className="w-2 h-2 bg-[#86868b] rounded-full animate-bounce [animation-delay:0.2s]" />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Input */}
          <div className="border-t border-[#d2d2d7] p-4">
            <div className="flex gap-3">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
                placeholder="Ask your AI assistant..."
                className="flex-1 px-4 py-2.5 border border-[#d2d2d7] rounded-xl focus:ring-2 focus:ring-[#0066CC] focus:border-transparent text-sm text-[#1d1d1f] placeholder:text-[#86868b]"
              />
              <button
                onClick={handleSend}
                disabled={!input.trim() || status === 'streaming'}
                className="bg-[#1d1d1f] hover:bg-black text-white rounded-xl py-2.5 px-5 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
