import { requireTenant } from '@/lib/auth/guards'
import { createClient } from '@/lib/supabase/server'
import { MessageSquare, Users, Clock, BarChart3 } from 'lucide-react'

export default async function DashboardPage() {
  const { tenantId, tenant } = await requireTenant()
  const supabase = await createClient()

  // Fetch stats
  const [conversationsResult, clientsResult, recentConversations] = await Promise.all([
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
  ])

  const totalConversations = conversationsResult.count || 0
  const totalClients = clientsResult.count || 0
  const recent = recentConversations.data || []

  const stats = [
    { name: 'Total Conversations', value: totalConversations, icon: MessageSquare, color: 'text-blue-600 bg-blue-100' },
    { name: 'Total Clients', value: totalClients, icon: Users, color: 'text-green-600 bg-green-100' },
    { name: 'Active Now', value: recent.filter((c: any) => c.status === 'active').length, icon: Clock, color: 'text-orange-600 bg-orange-100' },
    { name: 'Chat Link', value: `/chat/${tenant.slug}`, icon: BarChart3, color: 'text-purple-600 bg-purple-100', isLink: true },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-500">Welcome back, here's what's happening</p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <div key={stat.name} className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${stat.color}`}>
                <stat.icon className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm text-gray-500">{stat.name}</p>
                {stat.isLink ? (
                  <p className="text-xs text-blue-600 font-mono mt-0.5">{stat.value as string}</p>
                ) : (
                  <p className="text-xl font-semibold text-gray-900">{stat.value as number}</p>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Recent conversations */}
      <div className="bg-white rounded-xl border border-gray-200">
        <div className="px-5 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Recent Conversations</h2>
        </div>
        <div className="divide-y divide-gray-100">
          {recent.length === 0 ? (
            <div className="px-5 py-8 text-center text-gray-500">
              <MessageSquare className="w-8 h-8 mx-auto mb-2 text-gray-300" />
              <p>No conversations yet. Share your chat link to get started!</p>
            </div>
          ) : (
            recent.map((conv: any) => {
              const lastMessage = conv.messages?.[conv.messages.length - 1]
              return (
                <a
                  key={conv.id}
                  href={`/conversations/${conv.id}`}
                  className="flex items-center gap-4 px-5 py-3 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {conv.clients?.name || 'Anonymous'}
                    </p>
                    <p className="text-xs text-gray-500 truncate">
                      {lastMessage?.content || 'No messages'}
                    </p>
                  </div>
                  <div className="text-right">
                    <span
                      className={`inline-block px-2 py-0.5 text-xs rounded-full ${
                        conv.status === 'active'
                          ? 'bg-green-100 text-green-700'
                          : conv.status === 'escalated'
                          ? 'bg-red-100 text-red-700'
                          : 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      {conv.status}
                    </span>
                    <p className="text-xs text-gray-400 mt-1">
                      {conv.channel}
                    </p>
                  </div>
                </a>
              )
            })
          )}
        </div>
      </div>
    </div>
  )
}
