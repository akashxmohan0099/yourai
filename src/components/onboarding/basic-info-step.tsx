'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { BUSINESS_TYPE_TEMPLATES, type BusinessTypeTemplate } from '@/lib/onboarding/business-type-templates'
import { cn } from '@/lib/utils'
import * as Icons from 'lucide-react'

interface BasicInfoStepProps {
  tenantId: string
  selectedTemplate: BusinessTypeTemplate | null
  onTemplateSelect: (template: BusinessTypeTemplate) => void
  onNext: () => void
}

const AU_STATES = ['NSW', 'VIC', 'QLD', 'SA', 'WA', 'TAS', 'NT', 'ACT']

// Map template icon names to Lucide components
function getIcon(iconName: string) {
  const iconMap: Record<string, any> = {
    Scissors: Icons.Scissors,
    Wrench: Icons.Wrench,
    Zap: Icons.Zap,
    Thermometer: Icons.Thermometer,
    SprayCan: Icons.SprayCan,
    Car: Icons.Car,
    UtensilsCrossed: Icons.UtensilsCrossed,
    Dumbbell: Icons.Dumbbell,
    Stethoscope: Icons.Stethoscope,
    Home: Icons.Home,
    Calculator: Icons.Calculator,
    Scale: Icons.Scale,
    Camera: Icons.Camera,
    PawPrint: Icons.PawPrint,
    TreePine: Icons.TreePine,
    Briefcase: Icons.Briefcase,
  }
  const IconComponent = iconMap[iconName] || Icons.Briefcase
  return IconComponent
}

export function BasicInfoStep({ tenantId, selectedTemplate, onTemplateSelect, onNext }: BasicInfoStepProps) {
  const [form, setForm] = useState({
    business_name: '',
    phone: '',
    email: '',
    website: '',
    address_street: '',
    address_city: '',
    address_state: '',
    address_postcode: '',
  })
  const [saving, setSaving] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from('business_config')
        .select('*')
        .eq('tenant_id', tenantId)
        .single()
      if (data) {
        const addr = data.address || {} as any
        setForm({
          business_name: data.business_name || '',
          phone: data.phone || '',
          email: data.email || '',
          website: data.website || '',
          address_street: addr.street || '',
          address_city: addr.city || '',
          address_state: addr.state || '',
          address_postcode: addr.postcode || addr.zip || '',
        })
      }
    }
    load()
  }, [tenantId, supabase])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedTemplate) return
    setSaving(true)

    await supabase
      .from('business_config')
      .update({
        business_name: form.business_name,
        industry: selectedTemplate.industry,
        phone: form.phone,
        email: form.email,
        website: form.website,
        address: {
          street: form.address_street,
          city: form.address_city,
          state: form.address_state,
          postcode: form.address_postcode,
        },
      })
      .eq('tenant_id', tenantId)

    await supabase
      .from('tenants')
      .update({ name: form.business_name, business_type: selectedTemplate.id })
      .eq('id', tenantId)

    setSaving(false)
    onNext()
  }

  const inputClasses = 'w-full px-3 py-2 border border-[var(--line)] rounded-xl text-sm text-[var(--ink)] placeholder-[var(--ink-faint)] focus:outline-none focus:ring-2 focus:ring-[var(--teal)] focus:border-transparent transition-shadow'

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Business type selector */}
      <div>
        <h2 className="text-lg font-semibold text-[var(--ink)]">What type of business do you run?</h2>
        <p className="text-sm text-[var(--ink-faint)] mt-1 mb-5">This helps us set up the right tools and templates for you.</p>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {BUSINESS_TYPE_TEMPLATES.map((template) => {
            const IconComponent = getIcon(template.icon)
            const isSelected = selectedTemplate?.id === template.id
            return (
              <button
                key={template.id}
                type="button"
                onClick={() => onTemplateSelect(template)}
                className={cn(
                  'flex flex-col items-center gap-2 p-4 rounded-2xl border transition-colors text-center',
                  isSelected
                    ? 'border-[var(--ink)] bg-[var(--surface-muted)]'
                    : 'border-[var(--line)] hover:border-[var(--ink-faint)] hover:bg-[var(--surface-ghost)]'
                )}
              >
                <IconComponent className={cn('w-5 h-5', isSelected ? 'text-[var(--ink)]' : 'text-[var(--ink-faint)]')} />
                <span className={cn('text-sm font-medium', isSelected ? 'text-[var(--ink)]' : 'text-[var(--ink)]')}>
                  {template.label}
                </span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Contact details */}
      {selectedTemplate && (
        <div className="space-y-5">
          <h3 className="text-lg font-semibold text-[var(--ink)]">Business details</h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-[var(--ink)] mb-1.5">Business name *</label>
              <input
                required
                value={form.business_name}
                onChange={(e) => setForm({ ...form, business_name: e.target.value })}
                className={inputClasses}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[var(--ink)] mb-1.5">Phone</label>
              <input
                type="tel"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                placeholder="+61 4XX XXX XXX"
                className={inputClasses}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[var(--ink)] mb-1.5">Email</label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className={inputClasses}
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-[var(--ink)] mb-1.5">Website</label>
              <input
                type="url"
                value={form.website}
                onChange={(e) => setForm({ ...form, website: e.target.value })}
                placeholder="https://"
                className={inputClasses}
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-[var(--ink)] mb-1.5">Street address</label>
              <input
                value={form.address_street}
                onChange={(e) => setForm({ ...form, address_street: e.target.value })}
                className={inputClasses}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[var(--ink)] mb-1.5">City / Suburb</label>
              <input
                value={form.address_city}
                onChange={(e) => setForm({ ...form, address_city: e.target.value })}
                className={inputClasses}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-[var(--ink)] mb-1.5">State</label>
                <select
                  value={form.address_state}
                  onChange={(e) => setForm({ ...form, address_state: e.target.value })}
                  className={inputClasses}
                >
                  <option value="">Select</option>
                  {AU_STATES.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--ink)] mb-1.5">Postcode</label>
                <input
                  value={form.address_postcode}
                  onChange={(e) => setForm({ ...form, address_postcode: e.target.value })}
                  maxLength={4}
                  className={inputClasses}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="flex justify-end pt-2 border-t border-[var(--surface-muted)]">
        <button
          type="submit"
          disabled={saving || !form.business_name || !selectedTemplate}
          className="px-6 py-2 bg-[var(--teal)] text-white text-sm font-medium rounded-xl hover:bg-[var(--teal-strong)] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {saving ? 'Saving...' : 'Continue'}
        </button>
      </div>
    </form>
  )
}
