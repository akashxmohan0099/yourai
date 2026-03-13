'use client'

import { useState, useRef, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Send, Loader2, ArrowRight, Clock, HelpCircle, MessageCircle, Briefcase } from 'lucide-react'
import type { BusinessTypeTemplate } from '@/lib/onboarding/business-type-templates'

interface TellAiStepProps {
  tenantId: string
  template: BusinessTypeTemplate | null
  onNext: () => void
  onBack: () => void
}

interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}

interface ExtractedData {
  services: Array<{ name: string; price: string; duration: string; category: string }>
  hours: Record<string, { open: string; close: string } | null>
  faqs: Array<{ question: string; answer: string }>
  tone: string
  customInstructions: string
  description: string
}

export function TellAiStep({ tenantId, template, onNext, onBack }: TellAiStepProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const [saving, setSaving] = useState(false)
  const [extracted, setExtracted] = useState<ExtractedData>({
    services: [],
    hours: {},
    faqs: [],
    tone: template?.suggestedTone || 'friendly',
    customInstructions: '',
    description: '',
  })
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const supabase = createClient()

  // Load template defaults
  useEffect(() => {
    if (template) {
      setExtracted((prev) => ({
        ...prev,
        services: template.services.map((s) => ({
          name: s.name,
          price: s.priceCents ? `$${(s.priceCents / 100).toFixed(0)}` : 'Quote',
          duration: s.durationMinutes ? `${s.durationMinutes} min` : '',
          category: s.category,
        })),
        hours: template.defaultHours,
        faqs: template.faqs,
        tone: template.suggestedTone,
      }))

      // Initial AI message
      setMessages([{
        role: 'assistant',
        content: `G'day! I've loaded the standard ${template.label} template with ${template.services.length} services, business hours, and common FAQs.\n\nNow tell me about YOUR specific business — what makes you different? For example:\n\n• What services do you actually offer? (I can add, remove, or adjust the template ones)\n• What are your real prices?\n• What hours do you work?\n• Any rules I should know? (like "never offer discounts" or "always ask for their name")\n• Anything special about your business?\n\nJust chat naturally — I'll pick up the details as we go.`
      }])
    } else {
      setMessages([{
        role: 'assistant',
        content: `G'day! I'm going to be your business's AI assistant. Tell me about your business so I can help your customers.\n\nWhat do you do? What services do you offer and roughly what do you charge? What hours do you work?\n\nJust chat naturally — I'll pick up the details as we go.`
      }])
    }
  }, [template])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const sendMessage = async () => {
    if (!input.trim() || sending) return

    const userMessage = input.trim()
    setInput('')
    setMessages((prev) => [...prev, { role: 'user', content: userMessage }])
    setSending(true)

    try {
      const res = await fetch('/api/onboarding/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenantId,
          messages: [...messages, { role: 'user', content: userMessage }],
          currentExtracted: extracted,
          templateId: template?.id,
        }),
      })

      if (res.ok) {
        const data = await res.json()
        setMessages((prev) => [...prev, { role: 'assistant', content: data.reply }])
        if (data.extracted) {
          setExtracted((prev) => ({ ...prev, ...data.extracted }))
        }
      }
    } catch (error) {
      console.error('Chat error:', error)
      setMessages((prev) => [...prev, { role: 'assistant', content: 'Sorry, I had a hiccup. Could you say that again?' }])
    }

    setSending(false)
  }

  const handleSaveAndContinue = async () => {
    setSaving(true)

    // Save services
    await supabase.from('services').delete().eq('tenant_id', tenantId)
    if (extracted.services.length > 0) {
      await supabase.from('services').insert(
        extracted.services.map((s, i) => ({
          tenant_id: tenantId,
          name: s.name,
          category: s.category || null,
          price_cents: parsePrice(s.price),
          price_type: s.price.toLowerCase().includes('quote') ? 'quote'
            : s.price.toLowerCase().includes('from') || s.price.toLowerCase().includes('+') ? 'starting_at'
            : s.price.toLowerCase().includes('/hr') || s.price.toLowerCase().includes('hour') ? 'hourly'
            : 'fixed',
          duration_minutes: parseDuration(s.duration),
          sort_order: i,
          is_active: true,
        }))
      )
    }

    // Save hours, FAQs, tone, description, custom instructions
    await supabase
      .from('business_config')
      .update({
        hours: extracted.hours,
        faqs: extracted.faqs,
        tone: extracted.tone,
        custom_instructions: extracted.customInstructions || null,
        description: extracted.description || null,
        timezone: 'Australia/Sydney',
      })
      .eq('tenant_id', tenantId)

    setSaving(false)
    onNext()
  }

  const serviceCount = extracted.services.length
  const hoursCount = Object.keys(extracted.hours).length
  const faqCount = extracted.faqs.length

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-[#1d1d1f]">Teach AI about your business</h2>
        <p className="text-sm text-[#86868b] mt-1">Chat naturally. The AI extracts services, prices, hours, and more as you go.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        {/* Chat area */}
        <div className="lg:col-span-3 flex flex-col border border-[#d2d2d7] rounded-2xl overflow-hidden" style={{ height: '440px' }}>
          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-[#f5f5f7]/50">
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] px-4 py-2.5 text-sm whitespace-pre-wrap leading-relaxed ${
                  msg.role === 'user'
                    ? 'bg-[#1d1d1f] text-white rounded-2xl rounded-br-sm'
                    : 'bg-white border border-[#d2d2d7] text-[#1d1d1f] rounded-2xl rounded-bl-sm'
                }`}>
                  {msg.content}
                </div>
              </div>
            ))}
            {sending && (
              <div className="flex justify-start">
                <div className="bg-white border border-[#d2d2d7] px-4 py-2.5 rounded-2xl rounded-bl-sm">
                  <Loader2 className="w-4 h-4 animate-spin text-[#86868b]" />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="border-t border-[#d2d2d7] p-3 bg-white">
            <div className="flex gap-2">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && sendMessage()}
                placeholder="Tell me about your business..."
                className="flex-1 px-3 py-2 border border-[#d2d2d7] rounded-xl text-sm text-[#1d1d1f] placeholder-[#86868b] focus:outline-none focus:ring-2 focus:ring-[#0066CC] focus:border-transparent"
                disabled={sending}
              />
              <button
                onClick={sendMessage}
                disabled={sending || !input.trim()}
                className="px-3 py-2 bg-[#1d1d1f] text-white rounded-xl hover:bg-black disabled:opacity-40 transition-colors"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Extracted data panel */}
        <div className="lg:col-span-2 border border-[#d2d2d7] rounded-2xl overflow-hidden" style={{ maxHeight: '440px' }}>
          <div className="px-4 py-3 border-b border-[#d2d2d7] bg-[#f5f5f7]">
            <h3 className="text-sm font-semibold text-[#1d1d1f]">Extracted data</h3>
            <p className="text-xs text-[#86868b] mt-0.5">Updated as you chat</p>
          </div>

          <div className="p-4 space-y-5 overflow-y-auto" style={{ maxHeight: '370px' }}>
            {/* Services */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Briefcase className="w-3.5 h-3.5 text-[#86868b]" />
                <h4 className="text-xs font-semibold text-[#86868b] uppercase tracking-wide">Services ({serviceCount})</h4>
              </div>
              {serviceCount > 0 ? (
                <div className="space-y-1.5">
                  {extracted.services.slice(0, 8).map((s, i) => (
                    <div key={i} className="flex justify-between text-sm">
                      <span className="text-[#1d1d1f] truncate">{s.name}</span>
                      <span className="text-[#86868b] ml-2 flex-shrink-0 tabular-nums">{s.price}</span>
                    </div>
                  ))}
                  {serviceCount > 8 && (
                    <p className="text-xs text-[#86868b]">+{serviceCount - 8} more</p>
                  )}
                </div>
              ) : (
                <p className="text-xs text-[#86868b] italic">No services yet</p>
              )}
            </div>

            {/* Hours */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Clock className="w-3.5 h-3.5 text-[#86868b]" />
                <h4 className="text-xs font-semibold text-[#86868b] uppercase tracking-wide">Hours</h4>
              </div>
              {hoursCount > 0 ? (
                <div className="space-y-1">
                  {Object.entries(extracted.hours).slice(0, 7).map(([day, h]) => (
                    <div key={day} className="flex justify-between text-sm">
                      <span className="text-[#1d1d1f] capitalize">{day.slice(0, 3)}</span>
                      <span className="text-[#86868b] tabular-nums">{h ? `${h.open} - ${h.close}` : 'Closed'}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-[#86868b] italic">No hours set</p>
              )}
            </div>

            {/* FAQs */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <HelpCircle className="w-3.5 h-3.5 text-[#86868b]" />
                <h4 className="text-xs font-semibold text-[#86868b] uppercase tracking-wide">FAQs ({faqCount})</h4>
              </div>
              {faqCount > 0 ? (
                <div className="space-y-1">
                  {extracted.faqs.slice(0, 4).map((f, i) => (
                    <p key={i} className="text-sm text-[#86868b] truncate">{f.question}</p>
                  ))}
                  {faqCount > 4 && <p className="text-xs text-[#86868b]">+{faqCount - 4} more</p>}
                </div>
              ) : (
                <p className="text-xs text-[#86868b] italic">No FAQs yet</p>
              )}
            </div>

            {/* Tone */}
            {extracted.tone && (
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <MessageCircle className="w-3.5 h-3.5 text-[#86868b]" />
                  <h4 className="text-xs font-semibold text-[#86868b] uppercase tracking-wide">Tone</h4>
                </div>
                <span className="text-sm text-[#1d1d1f] capitalize">{extracted.tone}</span>
              </div>
            )}

            {/* Special rules */}
            {extracted.customInstructions && (
              <div>
                <h4 className="text-xs font-semibold text-[#86868b] uppercase tracking-wide mb-1">Special rules</h4>
                <p className="text-sm text-[#86868b] leading-relaxed">
                  {extracted.customInstructions.slice(0, 120)}{extracted.customInstructions.length > 120 ? '...' : ''}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="flex justify-between pt-2 border-t border-[#f5f5f7]">
        <button
          type="button"
          onClick={onBack}
          className="px-5 py-2 text-sm font-medium text-[#1d1d1f] hover:text-black hover:bg-[#f5f5f7] rounded-xl transition-colors"
        >
          Back
        </button>
        <button
          onClick={handleSaveAndContinue}
          disabled={saving}
          className="px-6 py-2 bg-[#1d1d1f] text-white text-sm font-medium rounded-xl hover:bg-black disabled:opacity-50 transition-colors inline-flex items-center gap-2"
        >
          {saving ? 'Saving...' : 'Review'}
          {!saving && <ArrowRight className="w-4 h-4" />}
        </button>
      </div>
    </div>
  )
}

function parsePrice(priceStr: string): number | null {
  const match = priceStr.replace(/[^0-9.]/g, '')
  const num = parseFloat(match)
  return isNaN(num) ? null : Math.round(num * 100)
}

function parseDuration(durStr: string): number | null {
  const match = durStr.replace(/[^0-9]/g, '')
  const num = parseInt(match)
  return isNaN(num) ? null : num
}
