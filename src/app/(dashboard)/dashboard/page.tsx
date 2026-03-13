import { PageIntro } from '@/components/dashboard/page-intro'
import { requireTenant } from '@/lib/auth/guards'
import { createClient } from '@/lib/supabase/server'
import {
  ArrowRight,
  Calendar,
  CheckCircle,
  Clock,
  MessageSquare,
  UserPlus,
} from 'lucide-react'
import Link from 'next/link'

interface RecentMessage {
  content?: string | null
}

interface RecentConversation {
  id: string
  status: string
  channel?: string | null
  clients?: { name?: string | null } | null
  messages?: RecentMessage[] | null
}

export default async function DashboardPage() {
  const { tenantId, tenant } = await requireTenant()
  const supabase = await createClient()

  const today = new Date()
  const todayStr = today.toISOString().split('T')[0]
  const hour = today.getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'

  const [conversationsResult, clientsResult, recentConversations, todayAppointments, pendingApprovalsResult] =
    await Promise.all([
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
      supabase
        .from('approvals')
        .select('id', { count: 'exact', head: true })
        .eq('tenant_id', tenantId)
        .eq('status', 'pending'),
    ])

  const totalConversations = conversationsResult.count || 0
  const totalClients = clientsResult.count || 0
  const recent = (recentConversations.data || []) as RecentConversation[]
  const todayApptCount = todayAppointments.count || 0
  const pendingApprovals = pendingApprovalsResult.count || 0
  const activeCount = recent.filter((conversation) => conversation.status === 'active').length

  const stats = [
    {
      name: 'Active conversations',
      value: activeCount,
      note: 'Live threads needing attention',
      icon: MessageSquare,
      tone: 'bg-[rgba(208,109,79,0.12)] text-[var(--accent)]',
    },
    {
      name: "Today's appointments",
      value: todayApptCount,
      note: 'Confirmed and pending bookings',
      icon: Calendar,
      tone: 'bg-[rgba(43,114,107,0.12)] text-[var(--teal)]',
    },
    {
      name: 'Pending approvals',
      value: pendingApprovals,
      note: 'Actions waiting on owner input',
      icon: CheckCircle,
      tone: 'bg-amber-50 text-amber-700',
    },
    {
      name: 'Client directory',
      value: totalClients,
      note: 'Known contacts across channels',
      icon: UserPlus,
      tone: 'bg-[rgba(36,28,23,0.08)] text-[var(--ink)]',
    },
  ]

  return (
    <div className="dashboard-stack">
      <PageIntro
        eyebrow={`${tenant.name} workspace`}
        title={`${greeting}. Your operation is staged and visible.`}
        description="Use this view to spot pressure points quickly: live conversations, today's schedule, approvals, and the newest customer activity without jumping across tabs."
        actions={
          <>
            <Link href="/conversations" className="btn-primary">
              Open conversations
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link href="/schedule" className="btn-secondary">
              Review schedule
            </Link>
          </>
        }
        aside={
          <div className="panel-muted w-full rounded-[28px] p-5 lg:max-w-sm">
            <p className="text-xs uppercase tracking-[0.2em] text-[var(--ink-faint)]">
              Current posture
            </p>
            <div className="mt-4 space-y-3">
              <div className="flex items-center justify-between rounded-[22px] bg-white/50 px-4 py-3">
                <span className="text-sm text-[var(--ink-soft)]">Conversation volume</span>
                <span className="chip chip-accent">{totalConversations} total</span>
              </div>
              <div className="flex items-center justify-between rounded-[22px] bg-white/50 px-4 py-3">
                <span className="text-sm text-[var(--ink-soft)]">Approvals waiting</span>
                <span className="chip chip-teal">{pendingApprovals} pending</span>
              </div>
            </div>
          </div>
        }
      />

      <section className="grid gap-4 xl:grid-cols-4">
        {stats.map((stat) => (
          <div key={stat.name} className="panel metric-card stat-glow rounded-[30px]">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm text-[var(--ink-faint)]">{stat.name}</p>
                <p className="mt-3 text-4xl font-semibold text-[var(--ink)]">{stat.value}</p>
              </div>
              <div className={`flex h-12 w-12 items-center justify-center rounded-2xl ${stat.tone}`}>
                <stat.icon className="h-5 w-5" />
              </div>
            </div>
            <p className="mt-5 text-sm leading-7 text-[var(--ink-soft)]">{stat.note}</p>
          </div>
        ))}
      </section>

      <section className="grid gap-4 xl:grid-cols-[minmax(0,1.25fr)_minmax(20rem,0.75fr)]">
        <div className="panel dashboard-table rounded-[32px]">
          <div className="flex items-center justify-between gap-4 border-b border-[var(--line)] px-6 py-5">
            <div>
              <p className="kicker">Activity feed</p>
              <h2 className="mt-2 text-2xl font-semibold text-[var(--ink)]">Recent conversations</h2>
            </div>
            <Link href="/conversations" className="btn-secondary">
              View all
            </Link>
          </div>

          <div>
            {recent.length === 0 ? (
              <div className="dashboard-empty">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-[26px] bg-[rgba(208,109,79,0.12)]">
                  <MessageSquare className="h-7 w-7 text-[var(--accent)]" />
                </div>
                <p className="mt-5 text-lg font-semibold text-[var(--ink)]">No conversations yet</p>
                <p className="mt-2 text-sm leading-7 text-[var(--ink-soft)]">
                  Share the chat link or enable your channels to start capturing customer demand.
                </p>
              </div>
            ) : (
              recent.map((conversation) => {
                const lastMessage = conversation.messages?.[conversation.messages.length - 1]
                return (
                  <Link
                    key={conversation.id}
                    href={`/conversations/${conversation.id}`}
                    className="dashboard-table-row flex items-center gap-4 px-6 py-5"
                  >
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[rgba(255,255,255,0.55)]">
                      <span className="text-sm font-semibold text-[var(--ink)]">
                        {(conversation.clients?.name || 'A').charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-3">
                        <p className="truncate text-sm font-semibold text-[var(--ink)]">
                          {conversation.clients?.name || 'Anonymous'}
                        </p>
                        <span className="chip capitalize">
                          {conversation.channel?.replace('_', ' ') || 'unknown'}
                        </span>
                      </div>
                      <p className="mt-2 truncate text-sm text-[var(--ink-soft)]">
                        {lastMessage?.content || 'No messages recorded yet'}
                      </p>
                    </div>
                    <span
                      className={`chip capitalize ${
                        conversation.status === 'active'
                          ? 'chip-teal'
                          : conversation.status === 'escalated'
                          ? 'chip-accent'
                          : ''
                      }`}
                    >
                      {conversation.status}
                    </span>
                  </Link>
                )
              })
            )}
          </div>
        </div>

        <div className="space-y-4">
          <div className="panel rounded-[32px] px-6 py-6">
            <p className="kicker">Today</p>
            <h2 className="mt-2 text-2xl font-semibold text-[var(--ink)]">Operating note</h2>
            <p className="mt-3 text-sm leading-7 text-[var(--ink-soft)]">
              You have {todayApptCount} appointment{todayApptCount === 1 ? '' : 's'} on the books
              and {pendingApprovals} approval{pendingApprovals === 1 ? '' : 's'} that may need review.
            </p>
          </div>

          <div className="panel rounded-[32px] px-6 py-6">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[rgba(43,114,107,0.12)]">
                <Clock className="h-5 w-5 text-[var(--teal)]" />
              </div>
              <div>
                <p className="text-sm font-semibold text-[var(--ink)]">Next review cycle</p>
                <p className="text-sm text-[var(--ink-faint)]">Keep approvals and scheduling clear before the next rush.</p>
              </div>
            </div>
            <div className="mt-5 space-y-3">
              <Link href="/approvals" className="btn-secondary w-full justify-between">
                Approval queue
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link href="/clients" className="btn-secondary w-full justify-between">
                Client directory
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
