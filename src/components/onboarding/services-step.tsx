'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Plus, Trash2 } from 'lucide-react'

interface ServicesStepProps {
  tenantId: string
  onNext: () => void
  onBack: () => void
}

interface ServiceForm {
  id?: string
  name: string
  description: string
  category: string
  price: string
  priceType: string
  duration: string
}

const emptyService: ServiceForm = {
  name: '',
  description: '',
  category: '',
  price: '',
  priceType: 'fixed',
  duration: '',
}

export function ServicesStep({ tenantId, onNext, onBack }: ServicesStepProps) {
  const [services, setServices] = useState<ServiceForm[]>([{ ...emptyService }])
  const [saving, setSaving] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from('services')
        .select('*')
        .eq('tenant_id', tenantId)
        .order('sort_order')

      if (data && data.length > 0) {
        setServices(
          data.map((s: any) => ({
            id: s.id,
            name: s.name,
            description: s.description || '',
            category: s.category || '',
            price: s.price_cents ? (s.price_cents / 100).toString() : '',
            priceType: s.price_type || 'fixed',
            duration: s.duration_minutes?.toString() || '',
          }))
        )
      }
    }
    load()
  }, [tenantId, supabase])

  const addService = () => {
    setServices([...services, { ...emptyService }])
  }

  const removeService = (index: number) => {
    setServices(services.filter((_, i) => i !== index))
  }

  const updateService = (index: number, field: keyof ServiceForm, value: string) => {
    const updated = [...services]
    updated[index] = { ...updated[index], [field]: value }
    setServices(updated)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    // Delete existing services
    await supabase.from('services').delete().eq('tenant_id', tenantId)

    // Insert new services
    const validServices = services.filter((s) => s.name.trim())
    if (validServices.length > 0) {
      await supabase.from('services').insert(
        validServices.map((s, i) => ({
          tenant_id: tenantId,
          name: s.name,
          description: s.description || null,
          category: s.category || null,
          price_cents: s.price ? Math.round(parseFloat(s.price) * 100) : null,
          price_type: s.priceType,
          duration_minutes: s.duration ? parseInt(s.duration) : null,
          sort_order: i,
        }))
      )
    }

    setSaving(false)
    onNext()
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-stone-900">Your services</h2>
        <button
          type="button"
          onClick={addService}
          className="flex items-center gap-1 text-sm text-violet-600 hover:text-violet-700"
        >
          <Plus className="w-4 h-4" /> Add service
        </button>
      </div>

      <div className="space-y-4">
        {services.map((service, index) => (
          <div key={index} className="border border-stone-200 rounded-lg p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-stone-500">Service {index + 1}</span>
              {services.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeService(index)}
                  className="text-red-400 hover:text-red-600"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-sm text-stone-600 mb-1">Name *</label>
                <input
                  value={service.name}
                  onChange={(e) => updateService(index, 'name', e.target.value)}
                  placeholder="e.g., Haircut"
                  className="w-full px-3 py-2 border border-stone-300 rounded-lg text-sm focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm text-stone-600 mb-1">Category</label>
                <input
                  value={service.category}
                  onChange={(e) => updateService(index, 'category', e.target.value)}
                  placeholder="e.g., Cuts"
                  className="w-full px-3 py-2 border border-stone-300 rounded-lg text-sm focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm text-stone-600 mb-1">Price ($)</label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={service.price}
                    onChange={(e) => updateService(index, 'price', e.target.value)}
                    placeholder="0.00"
                    className="flex-1 px-3 py-2 border border-stone-300 rounded-lg text-sm focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                  />
                  <select
                    value={service.priceType}
                    onChange={(e) => updateService(index, 'priceType', e.target.value)}
                    className="px-2 py-2 border border-stone-300 rounded-lg text-sm focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                  >
                    <option value="fixed">Fixed</option>
                    <option value="hourly">Hourly</option>
                    <option value="starting_at">Starting at</option>
                    <option value="quote">Quote</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm text-stone-600 mb-1">Duration (minutes)</label>
                <input
                  type="number"
                  min="0"
                  value={service.duration}
                  onChange={(e) => updateService(index, 'duration', e.target.value)}
                  placeholder="30"
                  className="w-full px-3 py-2 border border-stone-300 rounded-lg text-sm focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-sm text-stone-600 mb-1">Description</label>
                <input
                  value={service.description}
                  onChange={(e) => updateService(index, 'description', e.target.value)}
                  placeholder="Brief description of this service"
                  className="w-full px-3 py-2 border border-stone-300 rounded-lg text-sm focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="flex justify-between pt-4">
        <button
          type="button"
          onClick={onBack}
          className="px-6 py-2 border border-stone-300 text-stone-700 rounded-lg hover:bg-stone-50 transition-colors"
        >
          Back
        </button>
        <button
          type="submit"
          disabled={saving}
          className="px-6 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700 disabled:opacity-50 transition-colors"
        >
          {saving ? 'Saving...' : 'Next'}
        </button>
      </div>
    </form>
  )
}
