import { requireTenant } from '@/lib/auth/guards'
import { createClient } from '@/lib/supabase/server'
import { Newspaper, Calendar, CalendarDays, MessageCircle, Bell, UserPlus } from 'lucide-react'

export default async function BriefingsPage() {
  const { tenantId } = await requireTenant()
  const supabase = await createClient()

  const { data: briefings } = await supabase
    .from('briefings')
    .select('*')
    .eq('tenant_id', tenantId)
    .order('briefing_date', { ascending: false })
    .limit(30)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-[#1d1d1f] mb-1">Daily Briefings</h1>
        <p className="text-[#86868b]">Your AI-generated morning updates</p>
      </div>

      {!briefings || briefings.length === 0 ? (
        <div className="bg-white rounded-2xl border border-[#d2d2d7] shadow-sm px-6 py-16 text-center">
          <div className="w-12 h-12 rounded-2xl bg-[#f5f5f7] flex items-center justify-center mx-auto mb-4">
            <Newspaper className="w-6 h-6 text-[#86868b]" />
          </div>
          <p className="text-[#424245] font-medium mb-1">No briefings yet</p>
          <p className="text-sm text-[#86868b]">
            Enable daily briefings in Settings to get AI-generated morning updates
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {briefings.map((briefing: any) => (
            <div
              key={briefing.id}
              className="bg-white rounded-2xl border border-[#d2d2d7] shadow-sm overflow-hidden"
            >
              <div className="px-6 py-4 border-b border-[#f5f5f7] flex items-center gap-3 bg-[#f5f5f7] rounded-t-2xl">
                <div className="p-2 rounded-xl bg-white">
                  <Calendar className="w-4 h-4 text-[#1d1d1f]" />
                </div>
                <span className="text-sm font-semibold text-[#1d1d1f]">
                  {new Date(briefing.briefing_date).toLocaleDateString(undefined, {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </span>
                {briefing.delivered_via?.length > 0 && (
                  <span className="ml-auto px-3 py-1 text-xs font-medium rounded-full bg-[#f5f5f7] text-[#86868b]">
                    via {briefing.delivered_via.join(', ')}
                  </span>
                )}
              </div>
              <div className="px-6 py-5">
                <p className="text-sm text-[#424245] whitespace-pre-wrap leading-relaxed">
                  {briefing.content?.text || JSON.stringify(briefing.content)}
                </p>
                {briefing.content?.data && (
                  <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="bg-[#f5f5f7] rounded-xl px-4 py-3 text-center">
                      <div className="flex justify-center mb-1">
                        <CalendarDays className="w-4 h-4 text-[#86868b]" />
                      </div>
                      <p className="text-lg font-semibold text-[#1d1d1f]">
                        {briefing.content.data.appointments?.length || 0}
                      </p>
                      <p className="text-xs text-[#86868b]">Appointments</p>
                    </div>
                    <div className="bg-emerald-50 rounded-xl px-4 py-3 text-center">
                      <div className="flex justify-center mb-1">
                        <MessageCircle className="w-4 h-4 text-emerald-500" />
                      </div>
                      <p className="text-lg font-semibold text-emerald-700">
                        {briefing.content.data.overnightConversations?.length || 0}
                      </p>
                      <p className="text-xs text-emerald-500">Conversations</p>
                    </div>
                    <div className="bg-amber-50 rounded-xl px-4 py-3 text-center">
                      <div className="flex justify-center mb-1">
                        <Bell className="w-4 h-4 text-amber-500" />
                      </div>
                      <p className="text-lg font-semibold text-amber-700">
                        {briefing.content.data.pendingApprovals?.length || 0}
                      </p>
                      <p className="text-xs text-amber-500">Approvals</p>
                    </div>
                    <div className="bg-[#f5f5f7] rounded-xl px-4 py-3 text-center">
                      <div className="flex justify-center mb-1">
                        <UserPlus className="w-4 h-4 text-[#86868b]" />
                      </div>
                      <p className="text-lg font-semibold text-[#1d1d1f]">
                        {briefing.content.data.newClients?.length || 0}
                      </p>
                      <p className="text-xs text-[#86868b]">New Leads</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
