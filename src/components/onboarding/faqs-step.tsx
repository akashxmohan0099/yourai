'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Plus, Trash2 } from 'lucide-react'

interface FaqsStepProps {
  tenantId: string
  onNext: () => void
  onBack: () => void
}

interface FaqForm {
  question: string
  answer: string
}

export function FaqsStep({ tenantId, onNext, onBack }: FaqsStepProps) {
  const [faqs, setFaqs] = useState<FaqForm[]>([{ question: '', answer: '' }])
  const [saving, setSaving] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from('business_config')
        .select('faqs')
        .eq('tenant_id', tenantId)
        .single()

      if (data?.faqs && (data.faqs as FaqForm[]).length > 0) {
        setFaqs(data.faqs as FaqForm[])
      }
    }
    load()
  }, [tenantId, supabase])

  const addFaq = () => {
    setFaqs([...faqs, { question: '', answer: '' }])
  }

  const removeFaq = (index: number) => {
    setFaqs(faqs.filter((_, i) => i !== index))
  }

  const updateFaq = (index: number, field: keyof FaqForm, value: string) => {
    const updated = [...faqs]
    updated[index] = { ...updated[index], [field]: value }
    setFaqs(updated)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    const validFaqs = faqs.filter((f) => f.question.trim() && f.answer.trim())

    await supabase
      .from('business_config')
      .update({ faqs: validFaqs })
      .eq('tenant_id', tenantId)

    setSaving(false)
    onNext()
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Frequently asked questions</h2>
          <p className="text-sm text-gray-500">Add questions your customers commonly ask</p>
        </div>
        <button
          type="button"
          onClick={addFaq}
          className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700"
        >
          <Plus className="w-4 h-4" /> Add FAQ
        </button>
      </div>

      <div className="space-y-4">
        {faqs.map((faq, index) => (
          <div key={index} className="border border-gray-200 rounded-lg p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-500">FAQ {index + 1}</span>
              {faqs.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeFaq(index)}
                  className="text-red-400 hover:text-red-600"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>

            <div>
              <label className="block text-sm text-gray-600 mb-1">Question</label>
              <input
                value={faq.question}
                onChange={(e) => updateFaq(index, 'question', e.target.value)}
                placeholder="e.g., Do you accept walk-ins?"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm text-gray-600 mb-1">Answer</label>
              <textarea
                value={faq.answer}
                onChange={(e) => updateFaq(index, 'answer', e.target.value)}
                rows={2}
                placeholder="Your answer..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
        ))}
      </div>

      <p className="text-xs text-gray-400">You can skip this step and add FAQs later from settings.</p>

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
          {saving ? 'Saving...' : 'Next'}
        </button>
      </div>
    </form>
  )
}
