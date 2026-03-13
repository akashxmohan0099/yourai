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
    <div className="flex flex-col h-[calc(100vh-8rem)] bg-stone-50">
      <div className="mb-6 px-4 pt-6 max-w-4xl mx-auto w-full">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-violet-100 rounded-xl">
            <Sparkles className="w-5 h-5 text-violet-600" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-stone-900">AI Assistant</h1>
            <p className="text-stone-500">
              Chat with your AI to manage appointments, clients, and more
            </p>
          </div>
        </div>
      </div>

      <div className="flex-1 max-w-4xl mx-auto w-full px-4 pb-4">
        <div className="bg-white rounded-2xl border border-stone-200 shadow-sm flex flex-col overflow-hidden h-full">
          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-6 space-y-5">
            {messages.length === 0 && (
              <div className="text-center mt-16">
                <div className="w-16 h-16 bg-violet-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Bot className="w-8 h-8 text-violet-500" />
                </div>
                <p className="text-lg font-semibold text-stone-900 mb-1">How can I help you today?</p>
                <p className="text-stone-500 text-sm mb-6">Try asking me something like...</p>
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
                      className="bg-stone-50 hover:bg-violet-50 border border-stone-200 hover:border-violet-200 rounded-xl px-4 py-3 text-stone-700 hover:text-violet-700 transition-colors text-left"
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
                    <div className="w-9 h-9 rounded-full bg-violet-100 flex items-center justify-center flex-shrink-0">
                      <Bot className="w-4 h-4 text-violet-600" />
                    </div>
                  )}
                  <div
                    className={`max-w-[70%] rounded-2xl px-4 py-3 ${
                      isUser
                        ? 'bg-violet-600 text-white'
                        : 'bg-stone-100 text-stone-900'
                    }`}
                  >
                    <p className="text-sm whitespace-pre-wrap leading-relaxed">{text}</p>
                  </div>
                  {isUser && (
                    <div className="w-9 h-9 rounded-full bg-stone-200 flex items-center justify-center flex-shrink-0">
                      <User className="w-4 h-4 text-stone-600" />
                    </div>
                  )}
                </div>
              )
            })}
            {status === 'streaming' && (
              <div className="flex gap-3">
                <div className="w-9 h-9 rounded-full bg-violet-100 flex items-center justify-center flex-shrink-0">
                  <Bot className="w-4 h-4 text-violet-600" />
                </div>
                <div className="bg-stone-100 rounded-2xl px-4 py-3">
                  <div className="flex gap-1.5">
                    <span className="w-2 h-2 bg-stone-400 rounded-full animate-bounce" />
                    <span className="w-2 h-2 bg-stone-400 rounded-full animate-bounce [animation-delay:0.1s]" />
                    <span className="w-2 h-2 bg-stone-400 rounded-full animate-bounce [animation-delay:0.2s]" />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Input */}
          <div className="border-t border-stone-200 p-4">
            <div className="flex gap-3">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
                placeholder="Ask your AI assistant..."
                className="flex-1 px-4 py-2.5 border border-stone-300 rounded-xl focus:ring-2 focus:ring-violet-500 focus:border-transparent text-sm text-stone-900 placeholder:text-stone-400"
              />
              <button
                onClick={handleSend}
                disabled={!input.trim() || status === 'streaming'}
                className="bg-violet-600 hover:bg-violet-700 text-white rounded-xl py-2.5 px-5 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
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
