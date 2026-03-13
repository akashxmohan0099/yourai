'use client'

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

interface SettingsFormProps {
  tenantId: string
  tenantSlug: string
  config: {
    business_name?: string | null
    description?: string | null
    phone?: string | null
    email?: string | null
    website?: string | null
    tone?: string | null
    custom_instructions?: string | null
    briefing_enabled?: boolean | null
    briefing_time?: string | null
    nylas_grant_id?: string | null
    nylas_calendar_id?: string | null
    vapi_assistant_id?: string | null
    vapi_owner_assistant_id?: string | null
    vapi_phone_number_id?: string | null
    voice_enabled?: boolean | null
    twilio_phone_number?: string | null
    owner_notification_phone?: string | null
    sms_enabled?: boolean | null
    conversation_style?: string | null
    example_phrases?: string | null
  } | null
}

export function SettingsForm({ tenantId, tenantSlug, config }: SettingsFormProps) {
  const searchParams = useSearchParams()
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [nylasStatus, setNylasStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null)
  const [form, setForm] = useState({
    business_name: config?.business_name || '',
    description: config?.description || '',
    phone: config?.phone || '',
    email: config?.email || '',
    website: config?.website || '',
    tone: config?.tone || 'friendly',
    custom_instructions: config?.custom_instructions || '',
    conversation_style: config?.conversation_style || '',
    example_phrases: config?.example_phrases || '',
    briefing_enabled: config?.briefing_enabled || false,
    briefing_time: config?.briefing_time || '07:00',
    nylas_grant_id: config?.nylas_grant_id || '',
    nylas_calendar_id: config?.nylas_calendar_id || '',
  })
  const supabase = createClient()

  // Voice (Vapi) state
  const [vapiAssistantId, setVapiAssistantId] = useState(
    config?.vapi_assistant_id || ''
  )
  const [vapiOwnerAssistantId, setVapiOwnerAssistantId] = useState(
    config?.vapi_owner_assistant_id || ''
  )
  const [vapiPhoneNumberId, setVapiPhoneNumberId] = useState(config?.vapi_phone_number_id || '')
  const [vapiVoiceEnabled, setVapiVoiceEnabled] = useState(config?.voice_enabled || false)
  const [vapiSaving, setVapiSaving] = useState(false)
  const [vapiStatus, setVapiStatus] = useState<{
    type: 'success' | 'error'
    message: string
  } | null>(null)
  const [vapiAssistantInfo, setVapiAssistantInfo] = useState<{
    name: string
    model?: string
    voice?: string
  } | null>(null)

  // SMS (Twilio) state
  const [smsPhoneNumber, setSmsPhoneNumber] = useState(config?.twilio_phone_number || '')
  const [smsOwnerPhone, setSmsOwnerPhone] = useState(config?.owner_notification_phone || '')
  const [smsEnabled, setSmsEnabled] = useState(config?.sms_enabled || false)
  const [smsSaving, setSmsSaving] = useState(false)
  const [smsStatus, setSmsStatus] = useState<{
    type: 'success' | 'error'
    message: string
  } | null>(null)

  // Fetch SMS/Twilio status on mount
  useEffect(() => {
    fetch('/api/twilio/setup')
      .then((res) => res.json())
      .then((data) => {
        if (data.twilio_phone_number) setSmsPhoneNumber(data.twilio_phone_number)
        if (data.owner_notification_phone) setSmsOwnerPhone(data.owner_notification_phone)
        if (data.sms_enabled !== undefined) setSmsEnabled(data.sms_enabled)
      })
      .catch(() => {})
  }, [])

  const handleSaveSms = async () => {
    setSmsSaving(true)
    setSmsStatus(null)

    try {
      const res = await fetch('/api/twilio/setup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phoneNumber: smsPhoneNumber || null,
          ownerPhone: smsOwnerPhone || null,
        }),
      })

      const data = await res.json()
      if (!res.ok) {
        setSmsStatus({ type: 'error', message: data.error || 'Failed to save SMS settings' })
      } else {
        setSmsStatus({ type: 'success', message: 'SMS settings saved successfully!' })
        if (data.config) {
          setSmsEnabled(data.config.sms_enabled)
          if (data.config.twilio_phone_number) setSmsPhoneNumber(data.config.twilio_phone_number)
        }
      }
    } catch {
      setSmsStatus({ type: 'error', message: 'Network error saving SMS settings' })
    }

    setSmsSaving(false)
    setTimeout(() => setSmsStatus(null), 4000)
  }

  // Fetch Vapi status on mount
  useEffect(() => {
    fetch('/api/vapi/status')
      .then((res) => res.json())
      .then((data) => {
        if (data.vapi_assistant_id) setVapiAssistantId(data.vapi_assistant_id)
        if (data.vapi_owner_assistant_id) setVapiOwnerAssistantId(data.vapi_owner_assistant_id)
        if (data.vapi_phone_number_id) setVapiPhoneNumberId(data.vapi_phone_number_id)
        if (data.voice_enabled !== undefined) setVapiVoiceEnabled(data.voice_enabled)
        if (data.assistant) setVapiAssistantInfo(data.assistant)
      })
      .catch(() => {})
  }, [])

  const handleSaveVoice = async () => {
    setVapiSaving(true)
    setVapiStatus(null)

    try {
      const res = await fetch('/api/vapi/setup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          assistantId: vapiAssistantId || null,
          ownerAssistantId: vapiOwnerAssistantId || null,
          phoneNumberId: vapiPhoneNumberId || null,
          voiceEnabled: vapiVoiceEnabled,
        }),
      })

      const data = await res.json()
      if (!res.ok) {
        setVapiStatus({ type: 'error', message: data.error || 'Failed to save voice settings' })
      } else {
        setVapiStatus({ type: 'success', message: 'Voice settings saved successfully!' })
        if (data.config) {
          setVapiVoiceEnabled(data.config.voice_enabled)
        }
        // Re-fetch assistant info
        const statusRes = await fetch('/api/vapi/status')
        const statusData = await statusRes.json()
        if (statusData.assistant) setVapiAssistantInfo(statusData.assistant)
      }
    } catch {
      setVapiStatus({ type: 'error', message: 'Network error saving voice settings' })
    }

    setVapiSaving(false)
    setTimeout(() => setVapiStatus(null), 4000)
  }

  // Check for Nylas OAuth callback status messages
  useEffect(() => {
    const success = searchParams.get('success')
    const error = searchParams.get('error')
    if (success) {
      setNylasStatus({ type: 'success', message: success })
      // Reload config to reflect the new grant_id
      supabase
        .from('business_config')
        .select('nylas_grant_id')
        .eq('tenant_id', tenantId)
        .single()
        .then(({ data }) => {
          if (data?.nylas_grant_id) {
            setForm((prev) => ({ ...prev, nylas_grant_id: data.nylas_grant_id }))
          }
        })
    } else if (error) {
      setNylasStatus({ type: 'error', message: error })
    }
  }, [searchParams, tenantId, supabase])

  const handleSave = async () => {
    setSaving(true)
    setSaved(false)

    await supabase
      .from('business_config')
      .update(form)
      .eq('tenant_id', tenantId)

    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  const sectionClass = 'panel rounded-[32px] p-6 sm:p-7 space-y-5'
  const inputClass = 'field-input text-sm'
  const selectClass = 'field-select text-sm'
  const textareaClass = 'field-textarea text-sm'
  const labelClass = 'field-label'
  const noteClass = 'field-note'

  return (
    <div className="space-y-6">
      {/* Business Info */}
      <div className={sectionClass}>
        <div>
          <h2 className="text-lg font-semibold text-[var(--ink)]">Business Information</h2>
          <p className="text-sm text-[var(--ink-faint)] mt-0.5">Basic details about your business</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div>
            <label className={labelClass}>Business Name</label>
            <input
              value={form.business_name}
              onChange={(e) => setForm({ ...form, business_name: e.target.value })}
              className={inputClass}
              placeholder="Your business name"
            />
          </div>
          <div>
            <label className={labelClass}>Phone</label>
            <input
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              className={inputClass}
              placeholder="+1 (555) 000-0000"
            />
          </div>
          <div>
            <label className={labelClass}>Email</label>
            <input
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className={inputClass}
              placeholder="hello@yourbusiness.com"
            />
          </div>
          <div>
            <label className={labelClass}>Website</label>
            <input
              value={form.website}
              onChange={(e) => setForm({ ...form, website: e.target.value })}
              className={inputClass}
              placeholder="https://yourbusiness.com"
            />
          </div>
          <div className="sm:col-span-2">
            <label className={labelClass}>Description</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              rows={3}
              className={textareaClass}
              placeholder="Briefly describe what your business does..."
            />
          </div>
        </div>
      </div>

      {/* AI Training */}
      <div className={sectionClass}>
        <div>
          <h2 className="text-lg font-semibold text-[var(--ink)]">AI Personality &amp; Training</h2>
          <p className="text-sm text-[var(--ink-faint)] mt-0.5">
            Shape how your AI talks to customers — tone, style, and the words it uses
          </p>
        </div>

        {/* Tone selector with descriptions */}
        <div>
          <label className={labelClass}>Tone</label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { value: 'friendly', label: 'Friendly', desc: 'Warm and natural, like a mate', icon: '~' },
              { value: 'professional', label: 'Professional', desc: 'Polished but approachable', icon: '~' },
              { value: 'casual', label: 'Casual', desc: 'Relaxed and laid-back', icon: '~' },
              { value: 'formal', label: 'Formal', desc: 'Respectful and courteous', icon: '~' },
            ].map((t) => (
              <button
                key={t.value}
                type="button"
                onClick={() => setForm({ ...form, tone: t.value })}
                className={`rounded-2xl border p-4 text-left transition-colors ${
                  form.tone === t.value
                    ? 'border-[var(--teal)] bg-[rgba(43,114,107,0.08)]'
                    : 'border-[var(--line)] hover:border-[var(--ink-faint)] bg-white/40'
                }`}
              >
                <p className={`text-sm font-semibold ${form.tone === t.value ? 'text-[var(--teal)]' : 'text-[var(--ink)]'}`}>
                  {t.label}
                </p>
                <p className="text-xs text-[var(--ink-faint)] mt-1">{t.desc}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Conversation style */}
        <div>
          <label className={labelClass}>Conversation Style</label>
          <textarea
            value={form.conversation_style}
            onChange={(e) => setForm({ ...form, conversation_style: e.target.value })}
            rows={3}
            placeholder={"Keep it short and sweet. Don't be too salesy. Be direct — answer the question first, then offer extras. If someone sounds like they're in a rush, match their energy and keep it brief."}
            className={textareaClass}
          />
          <p className={noteClass}>Describe how you want your AI to talk — imagine telling a new receptionist how to handle calls.</p>
        </div>

        {/* Example phrases */}
        <div>
          <label className={labelClass}>Example Phrases</label>
          <textarea
            value={form.example_phrases}
            onChange={(e) => setForm({ ...form, example_phrases: e.target.value })}
            rows={4}
            placeholder={`"Hey, thanks for calling! What can I do for ya?"\n"No worries at all, let me check that for you."\n"Sweet, you're all booked in!"\n"Anything else I can help with before you go?"`}
            className={textareaClass}
          />
          <p className={noteClass}>
            Write phrases the way YOU would say them. Your AI will match this style on calls and chats.
            Put each phrase on its own line.
          </p>
        </div>

        {/* Custom rules / instructions */}
        <div>
          <label className={labelClass}>Custom Rules</label>
          <textarea
            value={form.custom_instructions}
            onChange={(e) => setForm({ ...form, custom_instructions: e.target.value })}
            rows={4}
            placeholder={"Never offer discounts without asking me first.\nAlways suggest our premium package before the basic.\nIf someone asks about weekend availability, mention we're open Saturdays.\nDon't discuss competitor pricing."}
            className={textareaClass}
          />
          <p className={noteClass}>
            Specific rules for your AI to follow. Things it should always do, never do, or watch out for.
          </p>
        </div>
      </div>

      {/* Daily Briefings */}
      <div className={sectionClass}>
        <div>
          <h2 className="text-lg font-semibold text-[var(--ink)]">Daily Briefings</h2>
          <p className="text-sm text-[var(--ink-faint)] mt-0.5">
            Get an AI-generated morning update with your schedule, new conversations, and pending items
          </p>
        </div>

        <div className="flex items-center gap-3">
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={form.briefing_enabled}
              onChange={(e) => setForm({ ...form, briefing_enabled: e.target.checked })}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-[var(--line)] peer-focus:ring-2 peer-focus:ring-[var(--teal)] rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-[var(--line)] after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[var(--teal)]"></div>
          </label>
          <span className="text-sm text-[var(--ink-soft)] font-medium">Enable daily briefings</span>
        </div>

        {form.briefing_enabled && (
          <div>
            <label className={labelClass}>Briefing Time (UTC)</label>
            <input
              type="time"
              value={form.briefing_time}
              onChange={(e) => setForm({ ...form, briefing_time: e.target.value })}
              className={`${inputClass} w-44`}
            />
            <p className={noteClass}>When you want to receive your daily update.</p>
          </div>
        )}
      </div>

      {/* Calendar & Email Sync */}
      <div className={sectionClass}>
        <div>
          <h2 className="text-lg font-semibold text-[var(--ink)]">Calendar & Email Sync (Nylas)</h2>
          <p className="text-sm text-[var(--ink-faint)] mt-0.5">
            Connect your email account to sync calendar and enable email communications
          </p>
        </div>

        {nylasStatus && (
          <div
            className={`px-4 py-3 rounded-xl text-sm ${
              nylasStatus.type === 'success'
                ? 'bg-[rgba(43,114,107,0.12)] text-[var(--teal)] border border-[rgba(43,114,107,0.2)]'
                : 'bg-[rgba(181,79,64,0.12)] text-[var(--error)] border border-[rgba(181,79,64,0.2)]'
            }`}
          >
            {nylasStatus.message}
          </div>
        )}

        <div>
          {form.nylas_grant_id ? (
            <div className="flex items-center gap-3">
              <span className="chip chip-teal">
                <span className="w-2 h-2 rounded-full bg-[var(--teal)]"></span>
                Connected
              </span>
              <a
                href="/api/nylas/auth"
                className="text-sm text-[var(--ink-soft)] hover:text-[var(--ink)] underline font-medium"
              >
                Reconnect Account
              </a>
            </div>
          ) : (
            <a
              href="/api/nylas/auth"
              className="btn-primary"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              Connect Email Account
            </a>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div>
            <label className={labelClass}>Nylas Grant ID</label>
            <input
              value={form.nylas_grant_id}
              onChange={(e) => setForm({ ...form, nylas_grant_id: e.target.value })}
              placeholder="Auto-filled after connecting"
              readOnly={!!form.nylas_grant_id}
              className={`${inputClass} ${
                form.nylas_grant_id ? 'bg-[var(--surface-muted)] text-[var(--ink-faint)]' : ''
              }`}
            />
          </div>
          <div>
            <label className={labelClass}>Calendar ID</label>
            <input
              value={form.nylas_calendar_id}
              onChange={(e) => setForm({ ...form, nylas_calendar_id: e.target.value })}
              placeholder="Calendar ID to sync with"
              className={inputClass}
            />
          </div>
        </div>
      </div>

      {/* Voice (Vapi) */}
      <div className={sectionClass}>
        <div>
          <h2 className="text-lg font-semibold text-[var(--ink)]">Voice (Vapi)</h2>
          <p className="text-sm text-[var(--ink-faint)] mt-0.5">
            Configure AI-powered voice calls for your business using Vapi
          </p>
        </div>

        {vapiStatus && (
          <div
            className={`px-4 py-3 rounded-xl text-sm ${
              vapiStatus.type === 'success'
                ? 'bg-[rgba(43,114,107,0.12)] text-[var(--teal)] border border-[rgba(43,114,107,0.2)]'
                : 'bg-[rgba(181,79,64,0.12)] text-[var(--error)] border border-[rgba(181,79,64,0.2)]'
            }`}
          >
            {vapiStatus.message}
          </div>
        )}

        {/* Status indicator */}
        <div className="flex items-center gap-3">
          {vapiAssistantId && vapiPhoneNumberId && vapiVoiceEnabled ? (
            <span className="chip chip-teal">
              <span className="w-2 h-2 rounded-full bg-[var(--teal)]"></span>
              Connected
            </span>
          ) : vapiAssistantId ? (
            <span className="chip chip-accent">
              <span className="w-2 h-2 rounded-full bg-amber-500"></span>
              Partially Configured
            </span>
          ) : (
            <span className="chip">
              <span className="w-2 h-2 rounded-full bg-[var(--ink-faint)]"></span>
              Not Configured
            </span>
          )}
          {vapiAssistantInfo && (
            <span className="text-sm text-[var(--ink-faint)]">
              Assistant: {vapiAssistantInfo.name}
              {vapiAssistantInfo.voice ? ` | Voice: ${vapiAssistantInfo.voice}` : ''}
            </span>
          )}
        </div>

        {/* Voice enabled toggle */}
        <div className="flex items-center gap-3">
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={vapiVoiceEnabled}
              onChange={(e) => setVapiVoiceEnabled(e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-[var(--line)] peer-focus:ring-2 peer-focus:ring-[var(--teal)] rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-[var(--line)] after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[var(--teal)]"></div>
          </label>
          <span className="text-sm text-[var(--ink-soft)] font-medium">Enable voice calls</span>
        </div>

        {/* Web voice widget info */}
        {vapiVoiceEnabled && vapiAssistantId && (
          <div className="panel-muted rounded-[24px] px-4 py-3">
            <div className="flex items-start gap-2">
              <svg className="w-4 h-4 text-[var(--ink-soft)] mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <p className="text-sm font-medium text-[var(--ink)]">Web Voice Widget</p>
                <p className="text-xs text-[var(--ink-soft)] mt-0.5">
                  When enabled, a voice call button will appear on your public chat page alongside
                  the text chat. Customers can call your AI assistant directly from the browser --
                  no phone number needed.
                </p>
                <code className="mt-2 inline-flex rounded-full bg-white/55 px-3 py-1 text-xs text-[var(--ink-soft)]">
                  {typeof window !== 'undefined' ? window.location.origin : ''}/chat/{tenantSlug}
                </code>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div>
            <label className={labelClass}>Vapi Assistant ID (Customer)</label>
            <input
              value={vapiAssistantId}
              onChange={(e) => setVapiAssistantId(e.target.value)}
              placeholder="Vapi Assistant ID"
              className={`${inputClass} font-mono`}
            />
            <p className={noteClass}>Handles incoming customer calls.</p>
          </div>
          <div>
            <label className={labelClass}>Owner Assistant ID</label>
            <input
              value={vapiOwnerAssistantId}
              onChange={(e) => setVapiOwnerAssistantId(e.target.value)}
              placeholder="Vapi Owner Assistant ID"
              className={`${inputClass} font-mono`}
            />
            <p className={noteClass}>Handles owner and manager calls with full tool access.</p>
          </div>
          <div>
            <label className={labelClass}>Phone Number ID</label>
            <input
              value={vapiPhoneNumberId}
              onChange={(e) => setVapiPhoneNumberId(e.target.value)}
              placeholder="Vapi Phone Number ID"
              className={`${inputClass} font-mono`}
            />
            <p className={noteClass}>Assign a purchased phone number from your Vapi account.</p>
          </div>
        </div>

        <button
          onClick={handleSaveVoice}
          disabled={vapiSaving}
          className="btn-primary"
        >
          {vapiSaving ? 'Saving...' : 'Save Voice Settings'}
        </button>
      </div>

      {/* SMS (Twilio) */}
      <div className={sectionClass}>
        <div>
          <h2 className="text-lg font-semibold text-[var(--ink)]">SMS (Twilio)</h2>
          <p className="text-sm text-[var(--ink-faint)] mt-0.5">
            Enable AI-powered SMS messaging for your business via Twilio
          </p>
        </div>

        {smsStatus && (
          <div
            className={`px-4 py-3 rounded-xl text-sm ${
              smsStatus.type === 'success'
                ? 'bg-[rgba(43,114,107,0.12)] text-[var(--teal)] border border-[rgba(43,114,107,0.2)]'
                : 'bg-[rgba(181,79,64,0.12)] text-[var(--error)] border border-[rgba(181,79,64,0.2)]'
            }`}
          >
            {smsStatus.message}
          </div>
        )}

        {/* Status indicator */}
        <div className="flex items-center gap-3">
          {smsPhoneNumber && smsEnabled ? (
            <span className="chip chip-teal">
              <span className="w-2 h-2 rounded-full bg-[var(--teal)]"></span>
              Active
            </span>
          ) : smsPhoneNumber ? (
            <span className="chip chip-accent">
              <span className="w-2 h-2 rounded-full bg-amber-500"></span>
              Phone Configured (SMS disabled)
            </span>
          ) : (
            <span className="chip">
              <span className="w-2 h-2 rounded-full bg-[var(--ink-faint)]"></span>
              Not Configured
            </span>
          )}
          {smsPhoneNumber && (
            <span className="text-sm text-[var(--ink-faint)] font-mono">{smsPhoneNumber}</span>
          )}
        </div>

        {/* SMS enabled toggle */}
        <div className="flex items-center gap-3">
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={smsEnabled}
              onChange={(e) => setSmsEnabled(e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-[var(--line)] peer-focus:ring-2 peer-focus:ring-[var(--teal)] rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-[var(--line)] after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[var(--teal)]"></div>
          </label>
          <span className="text-sm text-[var(--ink-soft)] font-medium">Enable SMS messaging</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div>
            <label className={labelClass}>Twilio Phone Number</label>
            <input
              value={smsPhoneNumber}
              onChange={(e) => setSmsPhoneNumber(e.target.value)}
              placeholder="+1234567890"
              className={`${inputClass} font-mono`}
            />
            <p className={noteClass}>Your Twilio phone number in E.164 format.</p>
          </div>
          <div>
            <label className={labelClass}>Owner Notification Phone</label>
            <input
              value={smsOwnerPhone}
              onChange={(e) => setSmsOwnerPhone(e.target.value)}
              placeholder="+1234567890"
              className={`${inputClass} font-mono`}
            />
            <p className={noteClass}>Receives approval requests and alerts via SMS.</p>
          </div>
        </div>

        <button
          onClick={handleSaveSms}
          disabled={smsSaving}
          className="btn-primary"
        >
          {smsSaving ? 'Saving...' : 'Save SMS Settings'}
        </button>
      </div>

      {/* Chat Widget Info */}
      <div className={sectionClass}>
        <div>
          <h2 className="text-lg font-semibold text-[var(--ink)]">Chat Widget</h2>
          <p className="text-sm text-[var(--ink-faint)] mt-0.5">
            Share this link with your customers to chat with your AI assistant
          </p>
        </div>
        <div className="flex items-center gap-2">
          <code className="flex-1 rounded-[22px] border border-[var(--line)] bg-white/55 px-4 py-3 text-sm text-[var(--ink-soft)]">
            {typeof window !== 'undefined' ? window.location.origin : ''}/chat/{tenantSlug}
          </code>
        </div>
      </div>

      {/* Save button */}
      <div className="flex items-center gap-3 pt-2">
        <button
          onClick={handleSave}
          disabled={saving}
          className="btn-primary"
        >
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
        {saved && <span className="text-sm text-[var(--teal)] font-medium">Saved successfully!</span>}
      </div>
    </div>
  )
}
