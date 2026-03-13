'use client'

import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useState } from 'react'

interface ScheduleViewProps {
  initialAppointments: Array<{
    id: string
    title: string
    status: string
    starts_at: string
  }>
}

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

export function ScheduleView({ initialAppointments }: ScheduleViewProps) {
  const [weekOffset, setWeekOffset] = useState(0)

  const today = new Date()
  const currentWeekStart = new Date(today)
  currentWeekStart.setDate(today.getDate() - today.getDay() + weekOffset * 7)

  const days = Array.from({ length: 7 }, (_, index) => {
    const date = new Date(currentWeekStart)
    date.setDate(currentWeekStart.getDate() + index)
    return date
  })

  const getAppointmentsForDay = (date: Date) => {
    const dateStr = date.toISOString().split('T')[0]
    return initialAppointments.filter(
      (appointment) => appointment.starts_at.startsWith(dateStr) && appointment.status !== 'cancelled'
    )
  }

  const isToday = (date: Date) => {
    const todayStr = today.toISOString().split('T')[0]
    return date.toISOString().split('T')[0] === todayStr
  }

  return (
    <div className="panel rounded-[32px]">
      <div className="flex items-center justify-between gap-4 border-b border-[var(--line)] px-6 py-5">
        <div>
          <p className="kicker">Week map</p>
          <h2 className="mt-2 text-2xl font-semibold text-[var(--ink)]">Weekly schedule</h2>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setWeekOffset(weekOffset - 1)} className="btn-secondary h-11 w-11 rounded-2xl px-0">
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button onClick={() => setWeekOffset(0)} className="btn-secondary">
            This week
          </button>
          <button onClick={() => setWeekOffset(weekOffset + 1)} className="btn-secondary h-11 w-11 rounded-2xl px-0">
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-px bg-[var(--line)] p-px lg:grid-cols-7">
        {days.map((date, index) => {
          const dayAppointments = getAppointmentsForDay(date)
          return (
            <div
              key={index}
              className={`min-h-[220px] px-3 py-4 ${
                isToday(date) ? 'bg-[rgba(255,249,242,0.92)]' : 'bg-white/55'
              }`}
            >
              <div className="rounded-[22px] bg-white/45 px-3 py-3 text-center">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--ink-faint)]">
                  {DAYS[index]}
                </p>
                <p className="mt-1 text-2xl font-semibold text-[var(--ink)]">{date.getDate()}</p>
              </div>
              <div className="mt-3 space-y-2">
                {dayAppointments.map((appointment) => {
                  const statusColor =
                    appointment.status === 'confirmed'
                      ? 'chip chip-teal'
                      : appointment.status === 'pending'
                      ? 'chip chip-accent'
                      : 'chip'
                  return (
                    <div key={appointment.id} className="rounded-[22px] bg-white/55 px-3 py-3">
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--ink-faint)]">
                          {new Date(appointment.starts_at).toLocaleTimeString([], {
                            hour: 'numeric',
                            minute: '2-digit',
                          })}
                        </p>
                        <span className={statusColor}>{appointment.status}</span>
                      </div>
                      <p className="mt-3 text-sm font-semibold text-[var(--ink)]">{appointment.title}</p>
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
