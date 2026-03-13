import { PageIntro } from '@/components/dashboard/page-intro'
import { requireTenant } from '@/lib/auth/guards'
import { createClient } from '@/lib/supabase/server'
import {
  Bell,
  Calendar,
  CalendarDays,
  MessageCircle,
  Newspaper,
  UserPlus,
} from 'lucide-react'

interface BriefingRow {
  id: string
  briefing_date: string
  delivered_via?: string[] | null
  content?: {
    text?: string
    data?: {
      appointments?: unknown[]
      overnightConversations?: unknown[]
      pendingApprovals?: unknown[]
      newClients?: unknown[]
    }
  } | null
}

export default async function BriefingsPage() {
  const { tenantId } = await requireTenant()
  const supabase = await createClient()

  const { data: briefings } = await supabase
    .from('briefings')
    .select('*')
    .eq('tenant_id', tenantId)
    .order('briefing_date', { ascending: false })
    .limit(30)

  const briefingRows = (briefings || []) as BriefingRow[]

  return (
    <div className="dashboard-stack">
      <PageIntro
        eyebrow="Morning briefings"
        title="A calmer start to the day."
        description="Daily summaries collect appointments, overnight conversations, approvals, and new clients into one clear operator note."
        aside={
          <div className="panel-muted w-full rounded-[28px] p-5 lg:max-w-sm">
            <p className="text-sm font-semibold text-[var(--ink)]">{briefingRows.length} briefings archived</p>
            <p className="mt-2 text-xs text-[var(--ink-faint)]">Most recent first, ready for quick scan.</p>
          </div>
        }
      />

      {briefingRows.length === 0 ? (
        <div className="panel rounded-[32px]">
          <div className="dashboard-empty">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-[26px] bg-[rgba(43,114,107,0.12)]">
              <Newspaper className="h-7 w-7 text-[var(--teal)]" />
            </div>
            <p className="mt-5 text-lg font-semibold text-[var(--ink)]">No briefings yet</p>
            <p className="mt-2 text-sm leading-7 text-[var(--ink-soft)]">
              Enable daily briefings in Settings to receive AI-generated updates.
            </p>
          </div>
        </div>
      ) : (
        <div className="dashboard-stack">
          {briefingRows.map((briefing) => {
            const deliveredVia = briefing.delivered_via || []

            return (
            <div key={briefing.id} className="panel rounded-[32px] px-6 py-6">
              <div className="flex flex-col gap-3 border-b border-[var(--line)] pb-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/55">
                    <Calendar className="h-4 w-4 text-[var(--accent)]" />
                  </div>
                  <span className="text-sm font-semibold text-[var(--ink)]">
                    {new Date(briefing.briefing_date).toLocaleDateString(undefined, {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </span>
                </div>
                {deliveredVia.length > 0 ? (
                  <span className="chip">via {deliveredVia.join(', ')}</span>
                ) : null}
              </div>
              <p className="mt-5 whitespace-pre-wrap text-sm leading-8 text-[var(--ink-soft)]">
                {briefing.content?.text || JSON.stringify(briefing.content)}
              </p>
              {briefing.content?.data ? (
                <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                  {[
                    {
                      label: 'Appointments',
                      value: briefing.content.data.appointments?.length || 0,
                      icon: CalendarDays,
                    },
                    {
                      label: 'Conversations',
                      value: briefing.content.data.overnightConversations?.length || 0,
                      icon: MessageCircle,
                    },
                    {
                      label: 'Approvals',
                      value: briefing.content.data.pendingApprovals?.length || 0,
                      icon: Bell,
                    },
                    {
                      label: 'New leads',
                      value: briefing.content.data.newClients?.length || 0,
                      icon: UserPlus,
                    },
                  ].map((item) => (
                    <div key={item.label} className="rounded-[24px] bg-white/45 px-4 py-4 text-center">
                      <item.icon className="mx-auto h-4 w-4 text-[var(--ink-faint)]" />
                      <p className="mt-3 text-2xl font-semibold text-[var(--ink)]">{item.value}</p>
                      <p className="mt-1 text-xs uppercase tracking-[0.14em] text-[var(--ink-faint)]">{item.label}</p>
                    </div>
                  ))}
                </div>
              ) : null}
            </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
