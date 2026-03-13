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
        <h1 className="text-2xl font-semibold text-stone-900 mb-1">Daily Briefings</h1>
        <p className="text-stone-500">Your AI-generated morning updates</p>
      </div>

      {!briefings || briefings.length === 0 ? (
        <div className="bg-white rounded-2xl border border-stone-200 shadow-sm px-6 py-16 text-center">
          <div className="w-12 h-12 rounded-2xl bg-violet-50 flex items-center justify-center mx-auto mb-4">
            <Newspaper className="w-6 h-6 text-violet-400" />
          </div>
          <p className="text-stone-700 font-medium mb-1">No briefings yet</p>
          <p className="text-sm text-stone-500">
            Enable daily briefings in Settings to get AI-generated morning updates
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {briefings.map((briefing: any) => (
            <div
              key={briefing.id}
              className="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden"
            >
              <div className="px-6 py-4 border-b border-stone-100 flex items-center gap-3 bg-stone-50 rounded-t-2xl">
                <div className="p-2 rounded-xl bg-violet-50">
                  <Calendar className="w-4 h-4 text-violet-600" />
                </div>
                <span className="text-sm font-semibold text-stone-900">
                  {new Date(briefing.briefing_date).toLocaleDateString(undefined, {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </span>
                {briefing.delivered_via?.length > 0 && (
                  <span className="ml-auto px-3 py-1 text-xs font-medium rounded-full bg-stone-100 text-stone-500">
                    via {briefing.delivered_via.join(', ')}
                  </span>
                )}
              </div>
              <div className="px-6 py-5">
                <p className="text-sm text-stone-700 whitespace-pre-wrap leading-relaxed">
                  {briefing.content?.text || JSON.stringify(briefing.content)}
                </p>
                {briefing.content?.data && (
                  <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="bg-violet-50 rounded-xl px-4 py-3 text-center">
                      <div className="flex justify-center mb-1">
                        <CalendarDays className="w-4 h-4 text-violet-500" />
                      </div>
                      <p className="text-lg font-semibold text-violet-700">
                        {briefing.content.data.appointments?.length || 0}
                      </p>
                      <p className="text-xs text-violet-500">Appointments</p>
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
                    <div className="bg-violet-50 rounded-xl px-4 py-3 text-center">
                      <div className="flex justify-center mb-1">
                        <UserPlus className="w-4 h-4 text-violet-500" />
                      </div>
                      <p className="text-lg font-semibold text-violet-700">
                        {briefing.content.data.newClients?.length || 0}
                      </p>
                      <p className="text-xs text-violet-500">New Leads</p>
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
