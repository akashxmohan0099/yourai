import { PageIntro } from '@/components/dashboard/page-intro'
import { requireTenant } from '@/lib/auth/guards'
import { createClient } from '@/lib/supabase/server'
import type { ElementType } from 'react'
import {
  FileCheck,
  MessageCircle,
  Sparkles,
  Target,
  Trophy,
  UserPlus,
  XCircle,
} from 'lucide-react'

interface LeadRow {
  id: string
  status: string
  score?: number | null
  source_channel?: string | null
  created_at: string
  clients?: {
    name?: string | null
    email?: string | null
    phone?: string | null
  } | null
}

export default async function LeadsPage() {
  const { tenantId } = await requireTenant()
  const supabase = await createClient()

  const { data: leads } = await supabase
    .from('leads')
    .select('*, clients(name, email, phone)')
    .eq('tenant_id', tenantId)
    .order('created_at', { ascending: false })
    .limit(50)

  const statusColors: Record<string, string> = {
    new: 'chip chip-accent',
    contacted: 'chip',
    qualified: 'chip chip-teal',
    proposal: 'chip',
    won: 'chip chip-teal',
    lost: 'chip chip-accent',
  }

  const statusIcons: Record<string, ElementType> = {
    new: Sparkles,
    contacted: MessageCircle,
    qualified: UserPlus,
    proposal: FileCheck,
    won: Trophy,
    lost: XCircle,
  }

  const statuses = ['new', 'contacted', 'qualified', 'proposal', 'won', 'lost']
  const leadRows = (leads || []) as LeadRow[]

  return (
    <div className="dashboard-stack">
      <PageIntro
        eyebrow="Lead pipeline"
        title="See who is warming up and who is ready to close."
        description="Lead status, score, and source now live in the same visual language as the rest of the workspace."
        aside={
          <div className="panel-muted w-full rounded-[28px] p-5 lg:max-w-sm">
            <p className="text-sm font-semibold text-[var(--ink)]">{leadRows.length} tracked leads</p>
            <p className="mt-2 text-xs text-[var(--ink-faint)]">
              Automatically captured from conversations and customer activity.
            </p>
          </div>
        }
      />

      <div className="grid gap-4 sm:grid-cols-3 xl:grid-cols-6">
        {statuses.map((status) => {
          const count = leadRows.filter((lead) => lead.status === status).length
          const Icon = statusIcons[status] || Target
          return (
            <div key={status} className="panel rounded-[28px] px-4 py-5 text-center">
              <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-2xl bg-white/55">
                <Icon className="h-4 w-4 text-[var(--accent)]" />
              </div>
              <p className="mt-4 text-3xl font-semibold text-[var(--ink)]">{count}</p>
              <p className="mt-1 text-xs uppercase tracking-[0.16em] text-[var(--ink-faint)]">{status}</p>
            </div>
          )
        })}
      </div>

      <div className="panel dashboard-table rounded-[32px]">
        {leadRows.length === 0 ? (
          <div className="dashboard-empty">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-[26px] bg-[rgba(208,109,79,0.12)]">
              <Target className="h-7 w-7 text-[var(--accent)]" />
            </div>
            <p className="mt-5 text-lg font-semibold text-[var(--ink)]">No leads yet</p>
            <p className="mt-2 text-sm leading-7 text-[var(--ink-soft)]">
              Leads are automatically captured from qualifying conversations.
            </p>
          </div>
        ) : (
          leadRows.map((lead) => (
            <div key={lead.id} className="dashboard-table-row grid gap-3 px-6 py-5 lg:grid-cols-6 lg:items-center">
              <div>
                <p className="text-sm font-semibold text-[var(--ink)]">{lead.clients?.name || 'Unknown'}</p>
                <p className="mt-1 text-xs text-[var(--ink-faint)]">{lead.clients?.email || lead.clients?.phone || '--'}</p>
              </div>
              <p className="text-sm text-[var(--ink-soft)] capitalize">
                {lead.source_channel?.replace('_', ' ') || '--'}
              </p>
              <div>
                <span className={statusColors[lead.status] || 'chip'}>{lead.status}</span>
              </div>
              <div>
                <span className="chip">{lead.score || 0} score</span>
              </div>
              <p className="text-sm text-[var(--ink-soft)]">
                {new Date(lead.created_at).toLocaleDateString()}
              </p>
              <p className="text-sm text-[var(--ink-faint)]">Captured for follow-up</p>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
