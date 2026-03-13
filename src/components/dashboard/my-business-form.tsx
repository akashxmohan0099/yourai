'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import {
  Building2,
  Clock,
  HelpCircle,
  MapPin,
  MessageCircle,
  Pencil,
  Phone,
  Plus,
  Save,
  Trash2,
  Briefcase,
} from 'lucide-react'

interface Service {
  id: string
  name: string
  category: string | null
  price_cents: number | null
  price_type: string
  duration_minutes: number | null
  is_active: boolean
  sort_order: number
}

interface MyBusinessFormProps {
  tenantId: string
  config: any
  services: Service[]
}

const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
const DAY_LABELS: Record<string, string> = {
  monday: 'Mon',
  tuesday: 'Tue',
  wednesday: 'Wed',
  thursday: 'Thu',
  friday: 'Fri',
  saturday: 'Sat',
  sunday: 'Sun',
}

const sectionClass = 'panel rounded-[30px] px-5 py-6 sm:px-6'
const labelClass = 'text-sm font-semibold text-[var(--ink)]'
const inputClass =
  'w-full px-3 py-2 border border-[var(--line)] rounded-xl text-sm text-[var(--ink)] placeholder-[var(--ink-faint)] focus:outline-none focus:ring-2 focus:ring-[var(--teal)] focus:border-transparent bg-white/60'

export function MyBusinessForm({ tenantId, config, services: initialServices }: MyBusinessFormProps) {
  const supabase = createClient()

  // Business info
  const [businessName, setBusinessName] = useState(config?.business_name || '')
  const [industry, setIndustry] = useState(config?.industry || '')
  const [description, setDescription] = useState(config?.description || '')
  const [phone, setPhone] = useState(config?.phone || '')
  const [email, setEmail] = useState(config?.email || '')
  const [website, setWebsite] = useState(config?.website || '')

  // Address
  const [address, setAddress] = useState(
    config?.address || { street: '', city: '', state: '', postcode: '' }
  )
  const [timezone, setTimezone] = useState(config?.timezone || 'Australia/Sydney')

  // Hours
  const [hours, setHours] = useState<Record<string, { open: string; close: string } | null>>(
    config?.hours || {}
  )

  // FAQs
  const [faqs, setFaqs] = useState<Array<{ question: string; answer: string }>>(
    config?.faqs || []
  )

  // Tone
  const [tone, setTone] = useState(config?.tone || 'friendly')
  const [customInstructions, setCustomInstructions] = useState(config?.custom_instructions || '')

  // Services
  const [services, setServices] = useState<Service[]>(initialServices)
  const [editingServiceId, setEditingServiceId] = useState<string | null>(null)

  // UI state
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [addingFaq, setAddingFaq] = useState(false)
  const [newFaq, setNewFaq] = useState({ question: '', answer: '' })
  const [addingService, setAddingService] = useState(false)
  const [newService, setNewService] = useState({
    name: '',
    category: '',
    price: '',
    price_type: 'fixed',
    duration: '',
  })

  const handleSave = async () => {
    setSaving(true)
    setSaved(false)

    await supabase
      .from('business_config')
      .update({
        business_name: businessName,
        industry,
        description,
        phone,
        email,
        website,
        address,
        timezone,
        hours,
        faqs,
        tone,
        custom_instructions: customInstructions || null,
        updated_at: new Date().toISOString(),
      })
      .eq('tenant_id', tenantId)

    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  const toggleDay = (day: string) => {
    setHours((prev) => ({
      ...prev,
      [day]: prev[day] ? null : { open: '09:00', close: '17:00' },
    }))
  }

  const updateHour = (day: string, field: 'open' | 'close', value: string) => {
    setHours((prev) => ({
      ...prev,
      [day]: prev[day] ? { ...prev[day]!, [field]: value } : { open: '09:00', close: '17:00', [field]: value },
    }))
  }

  const addFaq = () => {
    if (!newFaq.question.trim() || !newFaq.answer.trim()) return
    setFaqs((prev) => [...prev, { question: newFaq.question.trim(), answer: newFaq.answer.trim() }])
    setNewFaq({ question: '', answer: '' })
    setAddingFaq(false)
  }

  const removeFaq = (index: number) => {
    setFaqs((prev) => prev.filter((_, i) => i !== index))
  }

  const addService = async () => {
    if (!newService.name.trim()) return

    const priceCents = newService.price
      ? Math.round(parseFloat(newService.price.replace(/[^0-9.]/g, '')) * 100)
      : null

    const { data } = await supabase
      .from('services')
      .insert({
        tenant_id: tenantId,
        name: newService.name.trim(),
        category: newService.category.trim() || null,
        price_cents: isNaN(priceCents!) ? null : priceCents,
        price_type: newService.price_type,
        duration_minutes: newService.duration ? parseInt(newService.duration) : null,
        is_active: true,
        sort_order: services.length,
      })
      .select()
      .single()

    if (data) {
      setServices((prev) => [...prev, data])
    }

    setNewService({ name: '', category: '', price: '', price_type: 'fixed', duration: '' })
    setAddingService(false)
  }

  const removeService = async (id: string) => {
    await supabase.from('services').delete().eq('id', id).eq('tenant_id', tenantId)
    setServices((prev) => prev.filter((s) => s.id !== id))
  }

  const toggleServiceActive = async (id: string, active: boolean) => {
    await supabase.from('services').update({ is_active: active }).eq('id', id).eq('tenant_id', tenantId)
    setServices((prev) => prev.map((s) => (s.id === id ? { ...s, is_active: active } : s)))
  }

  return (
    <div className="space-y-5">
      {/* Business Identity */}
      <section className={sectionClass}>
        <div className="flex items-center gap-2 mb-5">
          <Building2 className="w-4 h-4 text-[var(--teal)]" />
          <h2 className="text-base font-semibold text-[var(--ink)]">Business identity</h2>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className={labelClass}>Business name</label>
            <input
              value={businessName}
              onChange={(e) => setBusinessName(e.target.value)}
              className={inputClass}
              placeholder="Your Business Name"
            />
          </div>
          <div>
            <label className={labelClass}>Industry</label>
            <input
              value={industry}
              onChange={(e) => setIndustry(e.target.value)}
              className={inputClass}
              placeholder="e.g. Hair Salon, Plumber, Dentist"
            />
          </div>
          <div className="sm:col-span-2">
            <label className={labelClass}>Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              className={inputClass}
              placeholder="What makes your business special?"
            />
          </div>
        </div>
      </section>

      {/* Contact & Location */}
      <section className={sectionClass}>
        <div className="flex items-center gap-2 mb-5">
          <MapPin className="w-4 h-4 text-[var(--accent)]" />
          <h2 className="text-base font-semibold text-[var(--ink)]">Contact & location</h2>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className={labelClass}>Phone</label>
            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className={inputClass}
              placeholder="+61 400 000 000"
            />
          </div>
          <div>
            <label className={labelClass}>Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={inputClass}
              placeholder="hello@yourbusiness.com.au"
            />
          </div>
          <div className="sm:col-span-2">
            <label className={labelClass}>Website</label>
            <input
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
              className={inputClass}
              placeholder="https://yourbusiness.com.au"
            />
          </div>
          <div className="sm:col-span-2">
            <label className={labelClass}>Street address</label>
            <input
              value={address.street || ''}
              onChange={(e) => setAddress({ ...address, street: e.target.value })}
              className={inputClass}
              placeholder="123 Main St"
            />
          </div>
          <div>
            <label className={labelClass}>City / Suburb</label>
            <input
              value={address.city || ''}
              onChange={(e) => setAddress({ ...address, city: e.target.value })}
              className={inputClass}
              placeholder="Sydney"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>State</label>
              <select
                value={address.state || ''}
                onChange={(e) => setAddress({ ...address, state: e.target.value })}
                className={inputClass}
              >
                <option value="">--</option>
                {['NSW', 'VIC', 'QLD', 'WA', 'SA', 'TAS', 'ACT', 'NT'].map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelClass}>Postcode</label>
              <input
                value={address.postcode || ''}
                onChange={(e) => setAddress({ ...address, postcode: e.target.value })}
                className={inputClass}
                placeholder="2000"
              />
            </div>
          </div>
          <div>
            <label className={labelClass}>Timezone</label>
            <select
              value={timezone}
              onChange={(e) => setTimezone(e.target.value)}
              className={inputClass}
            >
              <option value="Australia/Sydney">Sydney (AEST/AEDT)</option>
              <option value="Australia/Melbourne">Melbourne (AEST/AEDT)</option>
              <option value="Australia/Brisbane">Brisbane (AEST)</option>
              <option value="Australia/Perth">Perth (AWST)</option>
              <option value="Australia/Adelaide">Adelaide (ACST/ACDT)</option>
              <option value="Australia/Hobart">Hobart (AEST/AEDT)</option>
              <option value="Australia/Darwin">Darwin (ACST)</option>
            </select>
          </div>
        </div>
      </section>

      {/* Hours */}
      <section className={sectionClass}>
        <div className="flex items-center gap-2 mb-5">
          <Clock className="w-4 h-4 text-[var(--teal)]" />
          <h2 className="text-base font-semibold text-[var(--ink)]">Business hours</h2>
        </div>
        <div className="space-y-2">
          {DAYS.map((day) => {
            const h = hours[day]
            const isOpen = !!h
            return (
              <div key={day} className="flex items-center gap-3 rounded-xl border border-[var(--line)] bg-white/40 px-4 py-2.5">
                <button
                  type="button"
                  onClick={() => toggleDay(day)}
                  className={`w-5 h-5 rounded border flex items-center justify-center flex-shrink-0 transition-colors ${
                    isOpen ? 'border-[var(--teal)] bg-[var(--teal)]' : 'border-[var(--line)]'
                  }`}
                >
                  {isOpen && (
                    <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </button>
                <span className="w-10 text-sm font-medium text-[var(--ink)]">{DAY_LABELS[day]}</span>
                {isOpen ? (
                  <div className="flex items-center gap-2 text-sm">
                    <input
                      type="time"
                      value={h?.open || '09:00'}
                      onChange={(e) => updateHour(day, 'open', e.target.value)}
                      className="px-2 py-1 border border-[var(--line)] rounded-lg text-sm text-[var(--ink)] bg-white/60 focus:outline-none focus:ring-1 focus:ring-[var(--teal)]"
                    />
                    <span className="text-[var(--ink-faint)]">to</span>
                    <input
                      type="time"
                      value={h?.close || '17:00'}
                      onChange={(e) => updateHour(day, 'close', e.target.value)}
                      className="px-2 py-1 border border-[var(--line)] rounded-lg text-sm text-[var(--ink)] bg-white/60 focus:outline-none focus:ring-1 focus:ring-[var(--teal)]"
                    />
                  </div>
                ) : (
                  <span className="text-sm text-[var(--ink-faint)]">Closed</span>
                )}
              </div>
            )
          })}
        </div>
      </section>

      {/* Services */}
      <section className={sectionClass}>
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <Briefcase className="w-4 h-4 text-[var(--accent)]" />
            <h2 className="text-base font-semibold text-[var(--ink)]">
              Services <span className="font-normal text-[var(--ink-faint)]">({services.length})</span>
            </h2>
          </div>
          {!addingService && (
            <button
              onClick={() => setAddingService(true)}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-[var(--teal)] hover:text-[var(--teal-strong)] transition-colors"
            >
              <Plus className="w-3.5 h-3.5" /> Add service
            </button>
          )}
        </div>

        {addingService && (
          <div className="mb-4 rounded-xl border border-[var(--line)] bg-white/40 p-4 space-y-3">
            <div className="grid gap-3 sm:grid-cols-2">
              <input
                value={newService.name}
                onChange={(e) => setNewService({ ...newService, name: e.target.value })}
                className={inputClass}
                placeholder="Service name"
              />
              <input
                value={newService.category}
                onChange={(e) => setNewService({ ...newService, category: e.target.value })}
                className={inputClass}
                placeholder="Category (optional)"
              />
              <div className="flex gap-2">
                <input
                  value={newService.price}
                  onChange={(e) => setNewService({ ...newService, price: e.target.value })}
                  className={inputClass}
                  placeholder="Price (AUD)"
                />
                <select
                  value={newService.price_type}
                  onChange={(e) => setNewService({ ...newService, price_type: e.target.value })}
                  className={inputClass + ' max-w-[130px]'}
                >
                  <option value="fixed">Fixed</option>
                  <option value="hourly">Hourly</option>
                  <option value="starting_at">From</option>
                  <option value="quote">Quote</option>
                </select>
              </div>
              <input
                value={newService.duration}
                onChange={(e) => setNewService({ ...newService, duration: e.target.value })}
                className={inputClass}
                placeholder="Duration (minutes)"
              />
            </div>
            <div className="flex gap-2">
              <button onClick={addService} className="px-4 py-1.5 bg-[var(--teal)] text-white text-sm font-medium rounded-lg hover:bg-[var(--teal-strong)] transition-colors">
                Add
              </button>
              <button onClick={() => setAddingService(false)} className="px-4 py-1.5 text-sm text-[var(--ink-soft)] hover:text-[var(--ink)] transition-colors">
                Cancel
              </button>
            </div>
          </div>
        )}

        <div className="space-y-1.5">
          {services.map((s) => (
            <div
              key={s.id}
              className={`flex items-center justify-between rounded-xl border border-[var(--line)] bg-white/40 px-4 py-2.5 ${
                !s.is_active ? 'opacity-50' : ''
              }`}
            >
              <div className="min-w-0">
                <p className="text-sm font-medium text-[var(--ink)] truncate">{s.name}</p>
                {s.category && <p className="text-xs text-[var(--ink-faint)]">{s.category}</p>}
              </div>
              <div className="flex items-center gap-3 flex-shrink-0">
                <span className="text-sm text-[var(--ink-soft)] tabular-nums">
                  {s.price_cents != null ? `$${(s.price_cents / 100).toFixed(0)}` : 'Quote'}
                  {s.price_type === 'starting_at' && '+'}
                  {s.price_type === 'hourly' && '/hr'}
                </span>
                {s.duration_minutes && (
                  <span className="text-xs text-[var(--ink-faint)]">{s.duration_minutes}m</span>
                )}
                <button
                  onClick={() => toggleServiceActive(s.id, !s.is_active)}
                  className="text-xs text-[var(--ink-faint)] hover:text-[var(--ink-soft)] transition-colors"
                >
                  {s.is_active ? 'Disable' : 'Enable'}
                </button>
                <button
                  onClick={() => removeService(s.id)}
                  className="text-[var(--ink-faint)] hover:text-[var(--error)] transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
          {services.length === 0 && !addingService && (
            <p className="text-sm text-[var(--ink-faint)] italic py-4 text-center">No services yet. Add your first service above.</p>
          )}
        </div>
      </section>

      {/* FAQs */}
      <section className={sectionClass}>
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <HelpCircle className="w-4 h-4 text-[var(--teal)]" />
            <h2 className="text-base font-semibold text-[var(--ink)]">
              FAQs <span className="font-normal text-[var(--ink-faint)]">({faqs.length})</span>
            </h2>
          </div>
          {!addingFaq && (
            <button
              onClick={() => setAddingFaq(true)}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-[var(--teal)] hover:text-[var(--teal-strong)] transition-colors"
            >
              <Plus className="w-3.5 h-3.5" /> Add FAQ
            </button>
          )}
        </div>

        {addingFaq && (
          <div className="mb-4 rounded-xl border border-[var(--line)] bg-white/40 p-4 space-y-3">
            <input
              value={newFaq.question}
              onChange={(e) => setNewFaq({ ...newFaq, question: e.target.value })}
              className={inputClass}
              placeholder="Question"
            />
            <textarea
              value={newFaq.answer}
              onChange={(e) => setNewFaq({ ...newFaq, answer: e.target.value })}
              className={inputClass}
              rows={2}
              placeholder="Answer"
            />
            <div className="flex gap-2">
              <button onClick={addFaq} className="px-4 py-1.5 bg-[var(--teal)] text-white text-sm font-medium rounded-lg hover:bg-[var(--teal-strong)] transition-colors">
                Add
              </button>
              <button onClick={() => { setAddingFaq(false); setNewFaq({ question: '', answer: '' }) }} className="px-4 py-1.5 text-sm text-[var(--ink-soft)] hover:text-[var(--ink)] transition-colors">
                Cancel
              </button>
            </div>
          </div>
        )}

        <div className="space-y-2">
          {faqs.map((f, i) => (
            <div key={i} className="flex items-start justify-between gap-3 rounded-xl border border-[var(--line)] bg-white/40 px-4 py-3">
              <div className="min-w-0">
                <p className="text-sm font-medium text-[var(--ink)]">{f.question}</p>
                <p className="text-sm text-[var(--ink-faint)] mt-0.5">{f.answer}</p>
              </div>
              <button
                onClick={() => removeFaq(i)}
                className="text-[var(--ink-faint)] hover:text-[var(--error)] flex-shrink-0 mt-0.5 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
          {faqs.length === 0 && !addingFaq && (
            <p className="text-sm text-[var(--ink-faint)] italic py-4 text-center">No FAQs yet. Add common questions your customers ask.</p>
          )}
        </div>
      </section>

      {/* AI Personality */}
      <section className={sectionClass}>
        <div className="flex items-center gap-2 mb-5">
          <MessageCircle className="w-4 h-4 text-[var(--accent)]" />
          <h2 className="text-base font-semibold text-[var(--ink)]">AI personality</h2>
        </div>
        <div className="space-y-4">
          <div>
            <label className={labelClass}>Tone</label>
            <div className="flex flex-wrap gap-2 mt-1.5">
              {['professional', 'friendly', 'casual', 'formal'].map((t) => (
                <button
                  key={t}
                  onClick={() => setTone(t)}
                  className={`px-4 py-2 rounded-xl text-sm font-medium border transition-colors ${
                    tone === t
                      ? 'border-[var(--teal)] bg-[rgba(43,114,107,0.08)] text-[var(--teal)]'
                      : 'border-[var(--line)] bg-white/40 text-[var(--ink-soft)] hover:border-[var(--ink-faint)]'
                  }`}
                >
                  <span className="capitalize">{t}</span>
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className={labelClass}>Custom rules / instructions</label>
            <textarea
              value={customInstructions}
              onChange={(e) => setCustomInstructions(e.target.value)}
              rows={3}
              className={inputClass}
              placeholder='e.g. "Never offer discounts", "Always ask for their name first", "Mention we have free parking"'
            />
            <p className="mt-1.5 text-xs text-[var(--ink-faint)]">
              These rules are enforced by the AI in every conversation.
            </p>
          </div>
        </div>
      </section>

      {/* Save */}
      <div className="flex items-center justify-end gap-3 pt-2">
        {saved && (
          <span className="text-sm font-medium text-[var(--success)]">Saved</span>
        )}
        <button
          onClick={handleSave}
          disabled={saving}
          className="inline-flex items-center gap-2 px-6 py-2.5 bg-[var(--teal)] text-white text-sm font-semibold rounded-xl hover:bg-[var(--teal-strong)] disabled:opacity-50 transition-colors"
        >
          <Save className="w-4 h-4" />
          {saving ? 'Saving...' : 'Save changes'}
        </button>
      </div>
    </div>
  )
}
