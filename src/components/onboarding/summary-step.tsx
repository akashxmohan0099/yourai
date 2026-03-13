'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Pencil, Rocket } from 'lucide-react'
import type { BusinessTypeTemplate, FeatureKey } from '@/lib/onboarding/business-type-templates'
import { ALL_FEATURES } from '@/lib/onboarding/business-type-templates'

interface SummaryStepProps {
  tenantId: string
  template: BusinessTypeTemplate | null
  features: FeatureKey[]
  onComplete: () => Promise<void>
  onBack: () => void
  onEditStep: (step: number) => void
}

export function SummaryStep({ tenantId, template, features, onComplete, onBack, onEditStep }: SummaryStepProps) {
  const [config, setConfig] = useState<any>(null)
  const [services, setServices] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [launching, setLaunching] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    async function load() {
      const [configResult, servicesResult] = await Promise.all([
        supabase.from('business_config').select('*').eq('tenant_id', tenantId).single(),
        supabase.from('services').select('*').eq('tenant_id', tenantId).order('sort_order'),
      ])
      setConfig(configResult.data)
      setServices(servicesResult.data || [])
      setLoading(false)
    }
    load()
  }, [tenantId, supabase])

  const handleLaunch = async () => {
    setLaunching(true)
    try {
      await onComplete()
    } catch {
      setLaunching(false)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-5 w-5 border-2 border-[var(--line)] border-t-[var(--ink)]" />
      </div>
    )
  }

  const enabledFeatures = ALL_FEATURES.filter((f) => features.includes(f.key))
  const hours = config?.hours || {}
  const faqs = config?.faqs || []

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-lg font-semibold text-[var(--ink)]">Review your setup</h2>
        <p className="text-sm text-[var(--ink-faint)] mt-1">Check everything looks right before launching your AI assistant.</p>
      </div>

      {/* Business Info */}
      <section className="border border-[var(--line)] rounded-2xl p-5">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-[var(--ink)]">Business</h3>
          <button
            onClick={() => onEditStep(1)}
            className="text-xs text-[var(--ink-faint)] hover:text-[var(--ink)] flex items-center gap-1 transition-colors"
          >
            <Pencil className="w-3 h-3" /> Edit
          </button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2 text-sm">
          <div className="flex gap-2">
            <span className="text-[var(--ink-faint)] w-14 flex-shrink-0">Name</span>
            <span className="text-[var(--ink)]">{config?.business_name}</span>
          </div>
          <div className="flex gap-2">
            <span className="text-[var(--ink-faint)] w-14 flex-shrink-0">Type</span>
            <span className="text-[var(--ink)]">{template?.label || 'Custom'}</span>
          </div>
          {config?.phone && (
            <div className="flex gap-2">
              <span className="text-[var(--ink-faint)] w-14 flex-shrink-0">Phone</span>
              <span className="text-[var(--ink)]">{config.phone}</span>
            </div>
          )}
          {config?.email && (
            <div className="flex gap-2">
              <span className="text-[var(--ink-faint)] w-14 flex-shrink-0">Email</span>
              <span className="text-[var(--ink)]">{config.email}</span>
            </div>
          )}
        </div>
      </section>

      {/* Features */}
      <section className="border border-[var(--line)] rounded-2xl p-5">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-[var(--ink)]">Features <span className="font-normal text-[var(--ink-faint)]">({enabledFeatures.length})</span></h3>
          <button
            onClick={() => onEditStep(2)}
            className="text-xs text-[var(--ink-faint)] hover:text-[var(--ink)] flex items-center gap-1 transition-colors"
          >
            <Pencil className="w-3 h-3" /> Edit
          </button>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {enabledFeatures.map((f) => (
            <span
              key={f.key}
              className="px-2.5 py-1 bg-[var(--surface-muted)] text-[var(--ink-soft)] rounded text-xs font-medium"
            >
              {f.label}
            </span>
          ))}
        </div>
      </section>

      {/* Services */}
      <section className="border border-[var(--line)] rounded-2xl p-5">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-[var(--ink)]">Services <span className="font-normal text-[var(--ink-faint)]">({services.length})</span></h3>
          <button
            onClick={() => onEditStep(3)}
            className="text-xs text-[var(--ink-faint)] hover:text-[var(--ink)] flex items-center gap-1 transition-colors"
          >
            <Pencil className="w-3 h-3" /> Edit
          </button>
        </div>
        <div className="space-y-1.5">
          {services.slice(0, 10).map((s: any) => (
            <div key={s.id} className="flex justify-between text-sm">
              <span className="text-[var(--ink-soft)]">{s.name}</span>
              <span className="text-[var(--ink-faint)] tabular-nums">
                {s.price_cents ? `$${(s.price_cents / 100).toFixed(0)}` : 'Quote'}
                {s.price_type === 'starting_at' && '+'}
                {s.price_type === 'hourly' && '/hr'}
              </span>
            </div>
          ))}
          {services.length > 10 && (
            <p className="text-xs text-[var(--ink-faint)] pt-1">+{services.length - 10} more services</p>
          )}
        </div>
      </section>

      {/* Hours */}
      <section className="border border-[var(--line)] rounded-2xl p-5">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-[var(--ink)]">Hours</h3>
          <button
            onClick={() => onEditStep(3)}
            className="text-xs text-[var(--ink-faint)] hover:text-[var(--ink)] flex items-center gap-1 transition-colors"
          >
            <Pencil className="w-3 h-3" /> Edit
          </button>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-4 gap-y-1.5 text-sm">
          {['monday','tuesday','wednesday','thursday','friday','saturday','sunday'].map((day) => {
            const h = hours[day]
            return (
              <div key={day} className="flex gap-2">
                <span className="text-[var(--ink-faint)] capitalize w-8">{day.slice(0,3)}</span>
                <span className="text-[var(--ink-soft)] tabular-nums">{h ? `${h.open}-${h.close}` : 'Closed'}</span>
              </div>
            )
          })}
        </div>
      </section>

      {/* FAQs */}
      {faqs.length > 0 && (
        <section className="border border-[var(--line)] rounded-2xl p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-[var(--ink)]">FAQs <span className="font-normal text-[var(--ink-faint)]">({faqs.length})</span></h3>
            <button
              onClick={() => onEditStep(3)}
              className="text-xs text-[var(--ink-faint)] hover:text-[var(--ink)] flex items-center gap-1 transition-colors"
            >
              <Pencil className="w-3 h-3" /> Edit
            </button>
          </div>
          <div className="space-y-3">
            {faqs.slice(0, 5).map((f: any, i: number) => (
              <div key={i}>
                <p className="text-sm font-medium text-[var(--ink-soft)]">{f.question}</p>
                <p className="text-sm text-[var(--ink-faint)] mt-0.5">{f.answer}</p>
              </div>
            ))}
            {faqs.length > 5 && (
              <p className="text-xs text-[var(--ink-faint)]">+{faqs.length - 5} more FAQs</p>
            )}
          </div>
        </section>
      )}

      {/* Tone / AI Personality */}
      <section className="border border-[var(--line)] rounded-2xl p-5">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-semibold text-[var(--ink)]">AI Personality</h3>
          <button
            onClick={() => onEditStep(3)}
            className="text-xs text-[var(--ink-faint)] hover:text-[var(--ink)] flex items-center gap-1 transition-colors"
          >
            <Pencil className="w-3 h-3" /> Edit
          </button>
        </div>
        <p className="text-sm text-[var(--ink-soft)] capitalize">{config?.tone || 'Friendly'}</p>
        {config?.custom_instructions && (
          <p className="text-sm text-[var(--ink-faint)] mt-1">Rules: {config.custom_instructions.slice(0, 150)}</p>
        )}
      </section>

      {/* Actions */}
      <div className="flex justify-between pt-4 border-t border-[var(--line)]">
        <button
          type="button"
          onClick={onBack}
          className="px-5 py-2 text-sm font-medium text-[var(--ink-soft)] hover:text-[var(--ink)] hover:bg-[var(--surface-ghost)] rounded-xl transition-colors"
        >
          Back
        </button>
        <button
          onClick={handleLaunch}
          disabled={launching}
          className="px-6 py-2 bg-[var(--teal)] text-white text-sm font-medium rounded-xl hover:bg-[var(--teal-strong)] disabled:opacity-50 transition-colors inline-flex items-center gap-2"
        >
          <Rocket className="w-4 h-4" />
          {launching ? 'Launching...' : 'Launch your AI'}
        </button>
      </div>
    </div>
  )
}
