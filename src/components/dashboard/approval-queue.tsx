'use client'

import { createClient } from '@/lib/supabase/client'
import { formatRelativeTime } from '@/lib/utils'
import {
  AlertTriangle,
  CheckCircle,
  Clock,
  ShieldCheck,
  XCircle,
} from 'lucide-react'
import { useEffect, useState, type ElementType } from 'react'

interface Approval {
  id: string
  action_type: string
  action_details: Record<string, unknown>
  context_summary: string
  status: string
  decided_via: string | null
  expires_at: string
  created_at: string
  clients?: { name?: string; phone?: string }
  conversations?: { channel?: string }
}

interface ApprovalQueueProps {
  approvals: Approval[]
  tenantId: string
}

export function ApprovalQueue({ approvals: initialApprovals, tenantId }: ApprovalQueueProps) {
  const [approvals, setApprovals] = useState(initialApprovals)
  const [processing, setProcessing] = useState<string | null>(null)
  const supabase = createClient()

  useEffect(() => {
    const channel = supabase
      .channel('approvals-realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'approvals',
          filter: `tenant_id=eq.${tenantId}`,
        },
        async () => {
          const { data } = await supabase
            .from('approvals')
            .select('*, clients(name, phone), conversations(channel)')
            .eq('tenant_id', tenantId)
            .order('created_at', { ascending: false })
            .limit(50)
          if (data) setApprovals(data)
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [tenantId, supabase])

  const handleDecision = async (approvalId: string, decision: 'approved' | 'denied') => {
    setProcessing(approvalId)

    const res = await fetch(`/api/approvals/${approvalId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ decision }),
    })

    if (res.ok) {
      setApprovals(
        approvals.map((approval) =>
          approval.id === approvalId
            ? { ...approval, status: decision, decided_via: 'dashboard' }
            : approval
        )
      )
    }
    setProcessing(null)
  }

  const statusConfig: Record<string, { icon: ElementType; tone: string }> = {
    pending: { icon: Clock, tone: 'chip chip-accent' },
    approved: { icon: CheckCircle, tone: 'chip chip-teal' },
    denied: { icon: XCircle, tone: 'chip chip-accent' },
    expired: { icon: AlertTriangle, tone: 'chip' },
  }

  const pending = approvals.filter((approval) => approval.status === 'pending')
  const resolved = approvals.filter((approval) => approval.status !== 'pending')

  return (
    <div className="dashboard-stack">
      {pending.length > 0 ? (
        <div className="dashboard-stack">
          {pending.map((approval) => {
            const isExpired = new Date(approval.expires_at) < new Date()

            return (
              <div
                key={approval.id}
                className="panel rounded-[32px] border-[rgba(208,109,79,0.22)] px-5 py-5 sm:px-6"
              >
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="space-y-4">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="chip chip-accent capitalize">
                        {approval.action_type.replace(/_/g, ' ')}
                      </span>
                      {approval.clients?.name ? (
                        <span className="chip">{approval.clients.name}</span>
                      ) : null}
                      {approval.conversations?.channel ? (
                        <span className="chip capitalize">
                          via {approval.conversations.channel.replace('_', ' ')}
                        </span>
                      ) : null}
                    </div>
                    <p className="text-sm leading-8 text-[var(--ink-soft)]">{approval.context_summary}</p>
                    <div className="flex flex-wrap items-center gap-3 text-xs uppercase tracking-[0.14em] text-[var(--ink-faint)]">
                      <span>{formatRelativeTime(approval.created_at)}</span>
                      {isExpired ? <span className="text-[var(--error)]">Expired</span> : null}
                    </div>
                  </div>

                  {!isExpired ? (
                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        onClick={() => handleDecision(approval.id, 'approved')}
                        disabled={processing === approval.id}
                        className="btn-primary"
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => handleDecision(approval.id, 'denied')}
                        disabled={processing === approval.id}
                        className="btn-secondary"
                      >
                        Deny
                      </button>
                    </div>
                  ) : null}
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        <div className="panel rounded-[32px]">
          <div className="dashboard-empty">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-[26px] bg-[rgba(43,114,107,0.12)]">
              <ShieldCheck className="h-7 w-7 text-[var(--teal)]" />
            </div>
            <p className="mt-5 text-lg font-semibold text-[var(--ink)]">All caught up</p>
            <p className="mt-2 text-sm leading-7 text-[var(--ink-soft)]">
              No pending approvals right now.
            </p>
          </div>
        </div>
      )}

      {resolved.length > 0 ? (
        <div className="panel dashboard-table rounded-[32px]">
          <div className="border-b border-[var(--line)] px-6 py-5">
            <p className="kicker">History</p>
            <h2 className="mt-2 text-2xl font-semibold text-[var(--ink)]">Resolved decisions</h2>
          </div>
          {resolved.map((approval) => {
            const config = statusConfig[approval.status]
            const StatusIcon = config.icon

            return (
              <div key={approval.id} className="dashboard-table-row flex flex-col gap-4 px-6 py-5 sm:flex-row sm:items-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/50">
                  <StatusIcon className="h-5 w-5 text-[var(--ink-soft)]" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold capitalize text-[var(--ink)]">
                    {approval.action_type.replace(/_/g, ' ')}
                  </p>
                  <p className="mt-2 text-sm text-[var(--ink-soft)]">{approval.context_summary}</p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className={config.tone}>{approval.status}</span>
                  {approval.decided_via ? <span className="chip">via {approval.decided_via}</span> : null}
                </div>
              </div>
            )
          })}
        </div>
      ) : null}
    </div>
  )
}
