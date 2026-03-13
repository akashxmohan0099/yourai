import { requireTenant } from '@/lib/auth/guards'
import { createClient } from '@/lib/supabase/server'
import { Calendar, Clock } from 'lucide-react'
import { ScheduleView } from '@/components/dashboard/schedule-view'

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
  const todayAppointments = (appointments || []).filter((a: any) =>
    a.starts_at.startsWith(todayStr) && a.status !== 'cancelled'
  )

  return (
    <div className="min-h-screen bg-[#f5f5f7]">
      <div className="space-y-8 max-w-7xl mx-auto px-4 py-6">
        <div>
          <h1 className="text-2xl font-semibold text-[#1d1d1f] mb-1">Schedule</h1>
          <p className="text-[#86868b] text-base">
            {todayAppointments.length} appointment{todayAppointments.length !== 1 ? 's' : ''} today
          </p>
        </div>

        {/* Today's appointments */}
        <div className="bg-white rounded-2xl border border-[#d2d2d7] shadow-sm">
          <div className="px-6 py-5 border-b border-[#d2d2d7] flex items-center gap-3">
            <div className="p-2 bg-[#f5f5f7] rounded-xl">
              <Clock className="w-5 h-5 text-[#1d1d1f]" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-[#1d1d1f]">Today</h2>
              <p className="text-sm text-[#86868b]">Your appointments for today</p>
            </div>
          </div>
          <div className="divide-y divide-[#f5f5f7]">
            {todayAppointments.length === 0 ? (
              <div className="px-6 py-12 text-center">
                <div className="w-14 h-14 bg-[#f5f5f7] rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Calendar className="w-7 h-7 text-[#86868b]" />
                </div>
                <p className="text-[#424245] font-medium text-base">No appointments today</p>
                <p className="text-[#86868b] text-sm mt-1">Enjoy your free time!</p>
              </div>
            ) : (
              todayAppointments.map((apt: any) => (
                <div key={apt.id} className="px-6 py-4 flex items-center gap-5">
                  <div className="text-center min-w-[70px]">
                    <p className="text-sm font-semibold text-[#1d1d1f]">
                      {new Date(apt.starts_at).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                    <p className="text-xs text-[#86868b] mt-0.5">
                      {new Date(apt.ends_at).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  </div>
                  <div className="w-px h-10 bg-[#d2d2d7]" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-[#1d1d1f] truncate">
                      {apt.title}
                    </p>
                    <p className="text-sm text-[#86868b] mt-0.5">
                      {apt.clients?.name || 'No client'}
                      {apt.services?.name ? ` \u00b7 ${apt.services.name}` : ''}
                    </p>
                  </div>
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-medium ${
                      apt.status === 'confirmed'
                        ? 'bg-emerald-50 text-emerald-700'
                        : apt.status === 'pending'
                        ? 'bg-amber-50 text-amber-700'
                        : 'bg-[#f5f5f7] text-[#424245]'
                    }`}
                  >
                    {apt.status}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Week view */}
        <ScheduleView initialAppointments={appointments || []} />
      </div>
    </div>
  )
}
