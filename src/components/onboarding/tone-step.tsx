'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

interface ToneStepProps {
  tenantId: string
  onComplete: () => void
  onBack: () => void
}

const TONES = [
  {
    value: 'professional',
    label: 'Professional',
    description: 'Polished and business-like. Great for law firms, medical practices, consulting.',
    example: '"Good morning. How may I assist you with our services today?"',
  },
  {
    value: 'friendly',
    label: 'Friendly',
    description: 'Warm and approachable. Perfect for salons, fitness studios, local shops.',
    example: '"Hey there! What can I help you with today?"',
  },
  {
    value: 'casual',
    label: 'Casual',
    description: 'Relaxed and informal. Ideal for cafes, creative studios, young brands.',
    example: '"Hey! What\'s up? Looking to book something?"',
  },
  {
    value: 'formal',
    label: 'Formal',
    description: 'Dignified and respectful. Suited for luxury services, fine dining, premium brands.',
    example: '"Good day. It would be our pleasure to assist you. How may we be of service?"',
  },
]

export function ToneStep({ tenantId, onComplete, onBack }: ToneStepProps) {
  const [tone, setTone] = useState('friendly')
  const [customInstructions, setCustomInstructions] = useState('')
  const [saving, setSaving] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from('business_config')
        .select('tone, custom_instructions')
        .eq('tenant_id', tenantId)
        .single()

      if (data) {
        setTone(data.tone || 'friendly')
        setCustomInstructions(data.custom_instructions || '')
      }
    }
    load()
  }, [tenantId, supabase])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    await supabase
      .from('business_config')
      .update({ tone, custom_instructions: customInstructions || null })
      .eq('tenant_id', tenantId)

    setSaving(false)
    onComplete()
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-gray-900">Choose your AI's personality</h2>
        <p className="text-sm text-gray-500">This sets the tone for how your AI talks to customers</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {TONES.map((t) => (
          <button
            key={t.value}
            type="button"
            onClick={() => setTone(t.value)}
            className={`text-left p-4 rounded-lg border-2 transition-colors ${
              tone === t.value
                ? 'border-blue-600 bg-blue-50'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <div className="font-medium text-gray-900">{t.label}</div>
            <div className="text-xs text-gray-500 mt-1">{t.description}</div>
            <div className="text-xs text-gray-400 mt-2 italic">{t.example}</div>
          </button>
        ))}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Custom instructions (optional)
        </label>
        <textarea
          value={customInstructions}
          onChange={(e) => setCustomInstructions(e.target.value)}
          rows={3}
          placeholder="Any special instructions for your AI? e.g., 'Always mention our loyalty program' or 'Never discuss competitor pricing'"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      <div className="flex justify-between pt-4">
        <button
          type="button"
          onClick={onBack}
          className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
        >
          Back
        </button>
        <button
          type="submit"
          disabled={saving}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
        >
          {saving ? 'Finishing setup...' : 'Complete Setup'}
        </button>
      </div>
    </form>
  )
}
