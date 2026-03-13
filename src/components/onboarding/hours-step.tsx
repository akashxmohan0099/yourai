'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

interface HoursStepProps {
  tenantId: string
  onNext: () => void
  onBack: () => void
}

const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']

interface DayHours {
  isOpen: boolean
  open: string
  close: string
}

export function HoursStep({ tenantId, onNext, onBack }: HoursStepProps) {
  const [hours, setHours] = useState<Record<string, DayHours>>(
    Object.fromEntries(
      DAYS.map((day) => [
        day,
        {
          isOpen: day !== 'sunday',
          open: '09:00',
          close: '17:00',
        },
      ])
    )
  )
  const [timezone, setTimezone] = useState('America/New_York')
  const [saving, setSaving] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from('business_config')
        .select('hours, timezone')
        .eq('tenant_id', tenantId)
        .single()

      if (data?.hours && Object.keys(data.hours as object).length > 0) {
        const h = data.hours as Record<string, { open: string; close: string } | null>
        const loaded: Record<string, DayHours> = {}
        for (const day of DAYS) {
          if (h[day]) {
            loaded[day] = { isOpen: true, open: h[day]!.open, close: h[day]!.close }
          } else {
            loaded[day] = { isOpen: false, open: '09:00', close: '17:00' }
          }
        }
        setHours(loaded)
      }
      if (data?.timezone) setTimezone(data.timezone)
    }
    load()
  }, [tenantId, supabase])

  const updateDay = (day: string, field: keyof DayHours, value: string | boolean) => {
    setHours({ ...hours, [day]: { ...hours[day], [field]: value } })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    const hoursData: Record<string, { open: string; close: string } | null> = {}
    for (const day of DAYS) {
      hoursData[day] = hours[day].isOpen
        ? { open: hours[day].open, close: hours[day].close }
        : null
    }

    await supabase
      .from('business_config')
      .update({ hours: hoursData, timezone })
      .eq('tenant_id', tenantId)

    setSaving(false)
    onNext()
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <h2 className="text-lg font-semibold text-gray-900">Business hours</h2>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Timezone</label>
        <select
          value={timezone}
          onChange={(e) => setTimezone(e.target.value)}
          className="w-full sm:w-64 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="America/New_York">Eastern Time</option>
          <option value="America/Chicago">Central Time</option>
          <option value="America/Denver">Mountain Time</option>
          <option value="America/Los_Angeles">Pacific Time</option>
          <option value="America/Anchorage">Alaska Time</option>
          <option value="Pacific/Honolulu">Hawaii Time</option>
        </select>
      </div>

      <div className="space-y-2">
        {DAYS.map((day) => (
          <div key={day} className="flex items-center gap-3 py-2">
            <label className="flex items-center gap-2 w-28">
              <input
                type="checkbox"
                checked={hours[day].isOpen}
                onChange={(e) => updateDay(day, 'isOpen', e.target.checked)}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm font-medium text-gray-700 capitalize">{day}</span>
            </label>

            {hours[day].isOpen ? (
              <div className="flex items-center gap-2">
                <input
                  type="time"
                  value={hours[day].open}
                  onChange={(e) => updateDay(day, 'open', e.target.value)}
                  className="px-2 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <span className="text-gray-500 text-sm">to</span>
                <input
                  type="time"
                  value={hours[day].close}
                  onChange={(e) => updateDay(day, 'close', e.target.value)}
                  className="px-2 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            ) : (
              <span className="text-sm text-gray-400">Closed</span>
            )}
          </div>
        ))}
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
          {saving ? 'Saving...' : 'Next'}
        </button>
      </div>
    </form>
  )
}
