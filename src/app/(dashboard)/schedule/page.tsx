import { PageIntro } from '@/components/dashboard/page-intro'
import { ScheduleView } from '@/components/dashboard/schedule-view'
import { requireTenant } from '@/lib/auth/guards'
import { createClient } from '@/lib/supabase/server'
import { Calendar, Clock } from 'lucide-react'

interface AppointmentRow {
  id: string
  title: string
  status: string
  starts_at: string
  ends_at: string
  clients?: { name?: string | null } | null
  services?: { name?: string | null } | null
}

export default async function SchedulePage() {
  const { tenantId } = await requireTenant()
  const supabase = await createClient()

  const today = new Date()
  const weekStart = new Date(today)
  weekStart.setDate(today.getDate() - today.getDay())
  const weekEnd = new Date(weekStart)
  weekEnd.setDate(weekEnd.getDate() + 7)

  const { data: appointments } = await supabase
    .from('appointments')
    .select('*, clients(name, email, phone), services(name, duration_minutes, price_cents)')
    .eq('tenant_id', tenantId)
    .gte('starts_at', weekStart.toISOString())
    .lte('starts_at', weekEnd.toISOString())
    .order('starts_at')

  const todayStr = today.toISOString().split('T')[0]
  const appointmentRows = (appointments || []) as AppointmentRow[]
  const todayAppointments = appointmentRows.filter(
    (appointment) => appointment.starts_at.startsWith(todayStr) && appointment.status !== 'cancelled'
  )

  return (
    <div className="dashboard-stack">
      <PageIntro
        eyebrow="Schedule board"
        title="Bookings at a glance, decisions without friction."
        description="Review today's appointments and scan the rest of the week without losing the surrounding operational context."
        aside={
          <div className="panel-muted w-full rounded-[28px] p-5 lg:max-w-sm">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[rgba(43,114,107,0.12)]">
                <Calendar className="h-5 w-5 text-[var(--teal)]" />
              </div>
              <div>
                <p className="text-sm font-semibold text-[var(--ink)]">
                  {todayAppointments.length} appointment{todayAppointments.length === 1 ? '' : 's'} today
                </p>
                <p className="text-xs text-[var(--ink-faint)]">Week view below updates from your live bookings.</p>
              </div>
            </div>
          </div>
        }
      />

      <section className="panel dashboard-table rounded-[32px]">
        <div className="flex items-center gap-3 border-b border-[var(--line)] px-6 py-5">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[rgba(43,114,107,0.12)]">
            <Clock className="h-5 w-5 text-[var(--teal)]" />
          </div>
          <div>
            <p className="kicker">Today</p>
            <h2 className="mt-2 text-2xl font-semibold text-[var(--ink)]">Upcoming appointments</h2>
          </div>
        </div>

        <div>
          {todayAppointments.length === 0 ? (
            <div className="dashboard-empty">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-[26px] bg-[rgba(43,114,107,0.12)]">
                <Calendar className="h-7 w-7 text-[var(--teal)]" />
              </div>
              <p className="mt-5 text-lg font-semibold text-[var(--ink)]">No appointments today</p>
              <p className="mt-2 text-sm leading-7 text-[var(--ink-soft)]">
                The board is clear for now. Use the week view to look ahead.
              </p>
            </div>
          ) : (
            todayAppointments.map((appointment) => (
              <div key={appointment.id} className="dashboard-table-row flex flex-col gap-4 px-6 py-5 sm:flex-row sm:items-center">
                <div className="min-w-[84px] rounded-[22px] bg-white/45 px-4 py-3 text-center">
                  <p className="text-sm font-semibold text-[var(--ink)]">
                    {new Date(appointment.starts_at).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                  <p className="mt-1 text-xs text-[var(--ink-faint)]">
                    {new Date(appointment.ends_at).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-[var(--ink)]">{appointment.title}</p>
                  <p className="mt-2 text-sm text-[var(--ink-soft)]">
                    {appointment.clients?.name || 'No client'}
                    {appointment.services?.name ? ` • ${appointment.services.name}` : ''}
                  </p>
                </div>
                <span
                  className={`chip capitalize ${
                    appointment.status === 'confirmed'
                      ? 'chip-teal'
                      : appointment.status === 'pending'
                      ? 'chip chip-accent'
                      : 'chip'
                  }`}
                >
                  {appointment.status}
                </span>
              </div>
            ))
          )}
        </div>
      </section>

      <ScheduleView initialAppointments={appointments || []} />
    </div>
  )
}
