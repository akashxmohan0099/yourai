import { requireTenant } from '@/lib/auth/guards'
import { createClient } from '@/lib/supabase/server'
import { MessageSquare, Users, Clock, Calendar, CheckCircle, UserPlus } from 'lucide-react'

export default async function DashboardPage() {
  const { tenantId, tenant } = await requireTenant()
  const supabase = await createClient()

  const today = new Date()
  const todayStr = today.toISOString().split('T')[0]
  const hour = today.getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'

  // Fetch stats
  const [conversationsResult, clientsResult, recentConversations, todayAppointments] = await Promise.all([
    supabase
      .from('conversations')
      .select('id', { count: 'exact', head: true })
      .eq('tenant_id', tenantId),
    supabase
      .from('clients')
      .select('id', { count: 'exact', head: true })
      .eq('tenant_id', tenantId),
    supabase
      .from('conversations')
      .select('*, clients(name), messages(content, role, created_at)')
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: false })
      .limit(5),
    supabase
      .from('appointments')
      .select('id', { count: 'exact', head: true })
      .eq('tenant_id', tenantId)
      .neq('status', 'cancelled')
      .gte('starts_at', `${todayStr}T00:00:00`)
      .lte('starts_at', `${todayStr}T23:59:59`),
  ])

  const totalConversations = conversationsResult.count || 0
  const totalClients = clientsResult.count || 0
  const recent = recentConversations.data || []
  const todayApptCount = todayAppointments.count || 0
  const activeCount = recent.filter((c: any) => c.status === 'active').length

  const stats = [
    {
      name: 'Active Conversations',
      value: activeCount,
      icon: MessageSquare,
      iconColor: 'text-[#1d1d1f]',
      bgColor: 'bg-[#f5f5f7]',
      borderColor: 'border-l-[#1d1d1f]',
    },
    {
      name: "Today's Appointments",
      value: todayApptCount,
      icon: Calendar,
      iconColor: 'text-[#424245]',
      bgColor: 'bg-[#f5f5f7]',
      borderColor: 'border-l-[#424245]',
    },
    {
      name: 'Pending Approvals',
      value: 0,
      icon: CheckCircle,
      iconColor: 'text-[#86868b]',
      bgColor: 'bg-[#f5f5f7]',
      borderColor: 'border-l-[#86868b]',
    },
    {
      name: 'New Leads',
      value: totalClients,
      icon: UserPlus,
      iconColor: 'text-[#424245]',
      bgColor: 'bg-[#f5f5f7]',
      borderColor: 'border-l-[#424245]',
    },
  ]

  return (
    <div className="min-h-screen bg-[#f5f5f7]">
      <div className="space-y-8 max-w-7xl mx-auto px-4 py-6">
        {/* Greeting */}
        <div>
          <h1 className="text-2xl font-semibold text-[#1d1d1f] mb-1">
            {greeting} 👋
          </h1>
          <p className="text-[#86868b] text-base">
            Here&apos;s what&apos;s happening with your business today
          </p>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {stats.map((stat) => (
            <div
              key={stat.name}
              className={`bg-white rounded-2xl border border-[#d2d2d7] shadow-sm p-6 border-l-4 ${stat.borderColor}`}
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-[#86868b] mb-2">{stat.name}</p>
                  <p className="text-3xl font-semibold text-[#1d1d1f]">{stat.value}</p>
                </div>
                <div className={`p-3 rounded-xl ${stat.bgColor}`}>
                  <stat.icon className={`w-5 h-5 ${stat.iconColor}`} />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Recent conversations */}
        <div className="bg-white rounded-2xl border border-[#d2d2d7] shadow-sm">
          <div className="px-6 py-5 border-b border-[#d2d2d7]">
            <h2 className="text-lg font-semibold text-[#1d1d1f]">Recent Conversations</h2>
            <p className="text-sm text-[#86868b] mt-0.5">Your latest customer interactions</p>
          </div>
          <div className="divide-y divide-[#f5f5f7]">
            {recent.length === 0 ? (
              <div className="px-6 py-12 text-center">
                <div className="w-14 h-14 bg-[#f5f5f7] rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <MessageSquare className="w-7 h-7 text-[#86868b]" />
                </div>
                <p className="text-[#424245] font-medium text-base">No conversations yet</p>
                <p className="text-[#86868b] text-sm mt-1">Share your chat link to get started!</p>
              </div>
            ) : (
              recent.map((conv: any) => {
                const lastMessage = conv.messages?.[conv.messages.length - 1]
                return (
                  <a
                    key={conv.id}
                    href={`/conversations/${conv.id}`}
                    className="flex items-center gap-4 px-6 py-4 hover:bg-[#f5f5f7] transition-colors"
                  >
                    <div className="w-10 h-10 bg-[#f5f5f7] rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-[#1d1d1f] font-semibold text-sm">
                        {(conv.clients?.name || 'A').charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-[#1d1d1f] truncate">
                        {conv.clients?.name || 'Anonymous'}
                      </p>
                      <p className="text-sm text-[#86868b] truncate mt-0.5">
                        {lastMessage?.content || 'No messages'}
                      </p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <span
                        className={`inline-block rounded-full px-3 py-1 text-xs font-medium ${
                          conv.status === 'active'
                            ? 'bg-emerald-50 text-emerald-700'
                            : conv.status === 'escalated'
                            ? 'bg-red-50 text-red-700'
                            : 'bg-[#f5f5f7] text-[#424245]'
                        }`}
                      >
                        {conv.status}
                      </span>
                      <p className="text-xs text-[#86868b] mt-1.5 capitalize">
                        {conv.channel?.replace('_', ' ')}
                      </p>
                    </div>
                  </a>
                )
              })
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
