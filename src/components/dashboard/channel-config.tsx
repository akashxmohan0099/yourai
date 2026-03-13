'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Phone, MessageSquare, Globe, CheckCircle } from 'lucide-react'

interface ChannelConfigProps {
  tenantId: string
  config: Record<string, any>
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

    await supabase
      .from('business_config')
      .update(form)
      .eq('tenant_id', tenantId)

    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  const inputClass = 'w-full px-4 py-2.5 border border-[#d2d2d7] rounded-xl text-sm text-[#1d1d1f] focus:ring-2 focus:ring-[#0066CC] focus:border-transparent transition-shadow'
  const labelClass = 'block text-sm font-medium text-[#424245] mb-1.5'

  return (
    <div className="space-y-6">
      {/* Web Chat - always enabled */}
      <div className="bg-white rounded-2xl border border-[#d2d2d7] shadow-sm p-6">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-[#f5f5f7] rounded-xl">
            <Globe className="w-5 h-5 text-[#424245]" />
          </div>
          <div className="flex-1">
            <h2 className="font-semibold text-[#1d1d1f]">Web Chat</h2>
            <p className="text-sm text-[#86868b]">Always enabled for your customers</p>
          </div>
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium bg-emerald-100 text-emerald-700">
            <CheckCircle className="w-4 h-4" />
            Active
          </span>
        </div>
      </div>

      {/* Voice */}
      <div className="bg-white rounded-2xl border border-[#d2d2d7] shadow-sm p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2.5 bg-[#f5f5f7] rounded-xl">
            <Phone className="w-5 h-5 text-[#424245]" />
          </div>
          <div className="flex-1">
            <h2 className="font-semibold text-[#1d1d1f]">Voice (Vapi)</h2>
            <p className="text-sm text-[#86868b]">AI answers phone calls for your business</p>
          </div>
          <label className="flex items-center gap-2.5 cursor-pointer">
            <div className="relative inline-flex items-center">
              <input
                type="checkbox"
                checked={form.voice_enabled}
                onChange={(e) => setForm({ ...form, voice_enabled: e.target.checked })}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-[#d2d2d7] peer-focus:ring-2 peer-focus:ring-[#0066CC] rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-[#d2d2d7] after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#1d1d1f]"></div>
            </div>
            <span className="text-sm text-[#424245] font-medium">Enabled</span>
          </label>
        </div>
        {form.voice_enabled && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mt-4 pt-4 border-t border-[#f5f5f7]">
            <div>
              <label className={labelClass}>Vapi Assistant ID</label>
              <input
                value={form.vapi_assistant_id}
                onChange={(e) => setForm({ ...form, vapi_assistant_id: e.target.value })}
                placeholder="asst_..."
                className={`${inputClass} font-mono`}
              />
            </div>
            <div>
              <label className={labelClass}>Vapi Phone Number ID</label>
              <input
                value={form.vapi_phone_number_id}
                onChange={(e) => setForm({ ...form, vapi_phone_number_id: e.target.value })}
                placeholder="phn_..."
                className={`${inputClass} font-mono`}
              />
            </div>
          </div>
        )}
      </div>

      {/* SMS */}
      <div className="bg-white rounded-2xl border border-[#d2d2d7] shadow-sm p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2.5 bg-emerald-50 rounded-xl">
            <MessageSquare className="w-5 h-5 text-emerald-600" />
          </div>
          <div className="flex-1">
            <h2 className="font-semibold text-[#1d1d1f]">SMS (Twilio)</h2>
            <p className="text-sm text-[#86868b]">AI responds to text messages</p>
          </div>
          <label className="flex items-center gap-2.5 cursor-pointer">
            <div className="relative inline-flex items-center">
              <input
                type="checkbox"
                checked={form.sms_enabled}
                onChange={(e) => setForm({ ...form, sms_enabled: e.target.checked })}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-[#d2d2d7] peer-focus:ring-2 peer-focus:ring-[#0066CC] rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-[#d2d2d7] after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#1d1d1f]"></div>
            </div>
            <span className="text-sm text-[#424245] font-medium">Enabled</span>
          </label>
        </div>
        {form.sms_enabled && (
          <div className="mt-4 pt-4 border-t border-[#f5f5f7]">
            <div>
              <label className={labelClass}>Twilio Phone Number</label>
              <input
                value={form.twilio_phone_number}
                onChange={(e) => setForm({ ...form, twilio_phone_number: e.target.value })}
                placeholder="+1..."
                className={`${inputClass} sm:w-72 font-mono`}
              />
              <p className="mt-1.5 text-xs text-[#86868b]">Your Twilio phone number in E.164 format</p>
            </div>
          </div>
        )}
      </div>

      {/* Notifications */}
      <div className="bg-white rounded-2xl border border-[#d2d2d7] shadow-sm p-6 space-y-5">
        <div>
          <h2 className="font-semibold text-[#1d1d1f]">Owner Notifications</h2>
          <p className="text-sm text-[#86868b] mt-0.5">How you receive approval requests and alerts</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div>
            <label className={labelClass}>Your Phone (for approval SMS)</label>
            <input
              value={form.owner_notification_phone}
              onChange={(e) => setForm({ ...form, owner_notification_phone: e.target.value })}
              placeholder="+1..."
              className={`${inputClass} font-mono`}
            />
            <p className="mt-1.5 text-xs text-[#86868b]">We will text you when approvals are needed</p>
          </div>
          <div>
            <label className={labelClass}>Approval Timeout (minutes)</label>
            <input
              type="number"
              min="5"
              max="1440"
              value={form.approval_timeout_minutes}
              onChange={(e) => setForm({ ...form, approval_timeout_minutes: parseInt(e.target.value) || 30 })}
              className={inputClass}
            />
            <p className="mt-1.5 text-xs text-[#86868b]">How long before pending approvals expire</p>
          </div>
        </div>
      </div>

      {/* Save */}
      <div className="flex items-center gap-3 pt-2">
        <button
          onClick={handleSave}
          disabled={saving}
          className="bg-[#1d1d1f] hover:bg-black text-white rounded-xl py-2.5 px-6 font-medium disabled:opacity-50 transition-colors"
        >
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
        {saved && <span className="text-sm text-emerald-600 font-medium">Saved!</span>}
      </div>
    </div>
  )
}
