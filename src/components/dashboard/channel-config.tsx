'use client'

import { createClient } from '@/lib/supabase/client'
import { CheckCircle, Globe, MessageSquare, Phone } from 'lucide-react'
import { useState } from 'react'

interface ChannelConfigProps {
  tenantId: string
  config: {
    voice_enabled?: boolean | null
    sms_enabled?: boolean | null
    vapi_assistant_id?: string | null
    vapi_phone_number_id?: string | null
    twilio_phone_number?: string | null
    owner_notification_phone?: string | null
    approval_timeout_minutes?: number | null
  }
}

export function ChannelConfig({ tenantId, config }: ChannelConfigProps) {
  const [form, setForm] = useState({
    voice_enabled: config.voice_enabled || false,
    sms_enabled: config.sms_enabled || false,
    vapi_assistant_id: config.vapi_assistant_id || '',
    vapi_phone_number_id: config.vapi_phone_number_id || '',
    twilio_phone_number: config.twilio_phone_number || '',
    owner_notification_phone: config.owner_notification_phone || '',
    approval_timeout_minutes: config.approval_timeout_minutes || 30,
  })
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const handleSave = async () => {
    setSaving(true)
    setSaved(false)
    const supabase = createClient()

    await supabase.from('business_config').update(form).eq('tenant_id', tenantId)

    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  return (
    <div className="dashboard-stack">
      <div className="panel rounded-[32px] px-6 py-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[rgba(43,114,107,0.12)]">
            <Globe className="h-5 w-5 text-[var(--teal)]" />
          </div>
          <div className="flex-1">
            <h2 className="text-xl font-semibold text-[var(--ink)]">Web chat</h2>
            <p className="mt-1 text-sm text-[var(--ink-soft)]">
              Always enabled as the baseline customer entry point.
            </p>
          </div>
          <span className="chip chip-teal">
            <CheckCircle className="h-4 w-4" />
            Active
          </span>
        </div>
      </div>

      <div className="panel rounded-[32px] px-6 py-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[rgba(208,109,79,0.12)]">
              <Phone className="h-5 w-5 text-[var(--accent)]" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-[var(--ink)]">Voice</h2>
              <p className="mt-1 text-sm text-[var(--ink-soft)]">
                Browser voice and phone calls routed through Vapi.
              </p>
            </div>
          </div>
          <label className="flex items-center gap-3">
            <input
              type="checkbox"
              checked={form.voice_enabled}
              onChange={(e) => setForm({ ...form, voice_enabled: e.target.checked })}
              className="sr-only"
            />
            <span className="toggle-shell" data-checked={form.voice_enabled} />
            <span className="text-sm font-medium text-[var(--ink-soft)]">Enabled</span>
          </label>
        </div>

        {form.voice_enabled ? (
          <div className="mt-5 grid gap-5 border-t border-[var(--line)] pt-5 sm:grid-cols-2">
            <div>
              <label className="field-label">Vapi Assistant ID</label>
              <input
                value={form.vapi_assistant_id}
                onChange={(e) => setForm({ ...form, vapi_assistant_id: e.target.value })}
                placeholder="asst_..."
                className="field-input font-mono text-sm"
              />
            </div>
            <div>
              <label className="field-label">Vapi Phone Number ID</label>
              <input
                value={form.vapi_phone_number_id}
                onChange={(e) => setForm({ ...form, vapi_phone_number_id: e.target.value })}
                placeholder="phn_..."
                className="field-input font-mono text-sm"
              />
            </div>
          </div>
        ) : null}
      </div>

      <div className="panel rounded-[32px] px-6 py-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[rgba(43,114,107,0.12)]">
              <MessageSquare className="h-5 w-5 text-[var(--teal)]" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-[var(--ink)]">SMS</h2>
              <p className="mt-1 text-sm text-[var(--ink-soft)]">
                Text messaging and owner notification routing through Twilio.
              </p>
            </div>
          </div>
          <label className="flex items-center gap-3">
            <input
              type="checkbox"
              checked={form.sms_enabled}
              onChange={(e) => setForm({ ...form, sms_enabled: e.target.checked })}
              className="sr-only"
            />
            <span className="toggle-shell" data-checked={form.sms_enabled} />
            <span className="text-sm font-medium text-[var(--ink-soft)]">Enabled</span>
          </label>
        </div>

        <div className="mt-5 grid gap-5 border-t border-[var(--line)] pt-5 sm:grid-cols-2">
          <div>
            <label className="field-label">Twilio phone number</label>
            <input
              value={form.twilio_phone_number}
              onChange={(e) => setForm({ ...form, twilio_phone_number: e.target.value })}
              placeholder="+1..."
              className="field-input font-mono text-sm"
            />
            <p className="field-note">Use E.164 format.</p>
          </div>
          <div>
            <label className="field-label">Owner notification phone</label>
            <input
              value={form.owner_notification_phone}
              onChange={(e) => setForm({ ...form, owner_notification_phone: e.target.value })}
              placeholder="+1..."
              className="field-input font-mono text-sm"
            />
            <p className="field-note">Receives approval and escalation messages.</p>
          </div>
        </div>
      </div>

      <div className="panel rounded-[32px] px-6 py-6">
        <div>
          <h2 className="text-xl font-semibold text-[var(--ink)]">Approval routing</h2>
          <p className="mt-1 text-sm text-[var(--ink-soft)]">
            Define how long sensitive actions can wait before they expire.
          </p>
        </div>
        <div className="mt-5 grid gap-5 border-t border-[var(--line)] pt-5 sm:max-w-xs">
          <div>
            <label className="field-label">Approval timeout (minutes)</label>
            <input
              type="number"
              min="5"
              max="1440"
              value={form.approval_timeout_minutes}
              onChange={(e) =>
                setForm({ ...form, approval_timeout_minutes: parseInt(e.target.value) || 30 })
              }
              className="field-input text-sm"
            />
            <p className="field-note">Pending approvals auto-expire after this window.</p>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button onClick={handleSave} disabled={saving} className="btn-primary">
          {saving ? 'Saving...' : 'Save Channel Settings'}
        </button>
        {saved ? <span className="text-sm font-medium text-[var(--success)]">Saved</span> : null}
      </div>
    </div>
  )
}
