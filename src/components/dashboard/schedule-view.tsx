'use client'

import { useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'

interface ScheduleViewProps {
  initialAppointments: any[]
}

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

export function ScheduleView({ initialAppointments }: ScheduleViewProps) {
  const [weekOffset, setWeekOffset] = useState(0)

  const today = new Date()
  const currentWeekStart = new Date(today)
  currentWeekStart.setDate(today.getDate() - today.getDay() + weekOffset * 7)

  const days = Array.from({ length: 7 }, (_, i) => {
    const date = new Date(currentWeekStart)
    date.setDate(currentWeekStart.getDate() + i)
    return date
  })

  const getAppointmentsForDay = (date: Date) => {
    const dateStr = date.toISOString().split('T')[0]
    return initialAppointments.filter(
      (a: any) => a.starts_at.startsWith(dateStr) && a.status !== 'cancelled'
    )
  }

  const isToday = (date: Date) => {
    const todayStr = today.toISOString().split('T')[0]
    return date.toISOString().split('T')[0] === todayStr
  }

  return (
    <div className="bg-white rounded-2xl border border-[#d2d2d7] shadow-sm">
      <div className="px-6 py-5 border-b border-[#d2d2d7] flex items-center justify-between">
        <h2 className="text-lg font-semibold text-[#1d1d1f]">This Week</h2>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setWeekOffset(weekOffset - 1)}
            className="p-2 hover:bg-[#f5f5f7] rounded-xl transition-colors"
          >
            <ChevronLeft className="w-5 h-5 text-[#424245]" />
          </button>
          <button
            onClick={() => setWeekOffset(0)}
            className="px-4 py-1.5 text-sm font-medium text-[#1d1d1f] hover:bg-[#f5f5f7] rounded-xl transition-colors"
          >
            Today
          </button>
          <button
            onClick={() => setWeekOffset(weekOffset + 1)}
            className="p-2 hover:bg-[#f5f5f7] rounded-xl transition-colors"
          >
            <ChevronRight className="w-5 h-5 text-[#424245]" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 divide-x divide-[#f5f5f7]">
        {days.map((date, i) => {
          const dayAppts = getAppointmentsForDay(date)
          return (
            <div key={i} className="min-h-[160px]">
              <div
                className={`px-2 py-3 text-center border-b border-[#f5f5f7] ${
                  isToday(date) ? 'bg-[#f5f5f7]' : ''
                }`}
              >
                <p className="text-xs font-medium text-[#86868b] uppercase tracking-wide">{DAYS[i]}</p>
                <p
                  className={`text-base font-semibold mt-0.5 ${
                    isToday(date) ? 'text-[#1d1d1f]' : 'text-[#1d1d1f]'
                  }`}
                >
                  {date.getDate()}
                </p>
              </div>
              <div className="p-1.5 space-y-1.5">
                {dayAppts.map((apt: any) => {
                  const statusColor =
                    apt.status === 'confirmed'
                      ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                      : apt.status === 'pending'
                      ? 'bg-amber-50 border-amber-200 text-amber-800'
                      : 'bg-[#f5f5f7] border-[#d2d2d7] text-[#424245]'
                  return (
                    <div
                      key={apt.id}
                      className={`px-2 py-1.5 rounded-lg text-xs border ${statusColor}`}
                    >
                      <p className="font-semibold truncate">
                        {new Date(apt.starts_at).toLocaleTimeString([], {
                          hour: 'numeric',
                          minute: '2-digit',
                        })}
                      </p>
                      <p className="truncate opacity-80">{apt.title}</p>
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
