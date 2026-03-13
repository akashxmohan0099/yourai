'use client'

import { useEffect, useState, type ElementType } from 'react'
import { createClient } from '@/lib/supabase/client'
import { formatRelativeTime } from '@/lib/utils'
import { CheckCircle, XCircle, Clock, AlertTriangle, ShieldCheck } from 'lucide-react'

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

    return () => { supabase.removeChannel(channel) }
  }, [tenantId, supabase])

  const handleDecision = async (approvalId: string, decision: 'approved' | 'denied') => {
    setProcessing(approvalId)

    const res = await fetch(`/api/approvals/${approvalId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ decision }),
    })

    if (res.ok) {
      setApprovals(approvals.map(a =>
        a.id === approvalId
          ? { ...a, status: decision, decided_via: 'dashboard' }
          : a
      ))
    }
    setProcessing(null)
  }

  const statusConfig: Record<string, { icon: ElementType; color: string; bg: string }> = {
    pending: { icon: Clock, color: 'text-amber-600', bg: 'bg-amber-100' },
    approved: { icon: CheckCircle, color: 'text-emerald-600', bg: 'bg-emerald-100' },
    denied: { icon: XCircle, color: 'text-red-600', bg: 'bg-red-100' },
    expired: { icon: AlertTriangle, color: 'text-[#86868b]', bg: 'bg-[#f5f5f7]' },
  }

  const pending = approvals.filter(a => a.status === 'pending')
  const resolved = approvals.filter(a => a.status !== 'pending')

  return (
    <div className="space-y-6">
      {/* Pending approvals */}
      {pending.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-amber-700 uppercase tracking-wide">
            Pending ({pending.length})
          </h2>
          {pending.map((approval) => {
            const config = statusConfig[approval.status]
            const StatusIcon = config.icon
            const isExpired = new Date(approval.expires_at) < new Date()

            return (
              <div key={approval.id} className="bg-white rounded-2xl border-2 border-amber-200 shadow-sm p-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className="text-sm font-semibold text-[#1d1d1f] capitalize">
                        {approval.action_type.replace(/_/g, ' ')}
                      </span>
                      {approval.clients?.name && (
                        <span className="text-xs text-[#86868b]">
                          -- {approval.clients.name}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-[#424245] leading-relaxed">{approval.context_summary}</p>
                    <div className="flex items-center gap-3 mt-2.5 text-xs text-[#86868b]">
                      <span>{formatRelativeTime(approval.created_at)}</span>
                      {approval.conversations?.channel && (
                        <span className="px-2 py-0.5 rounded-full bg-[#f5f5f7] text-[#86868b]">
                          via {approval.conversations.channel.replace('_', ' ')}
                        </span>
                      )}
                      {isExpired && (
                        <span className="text-red-500 font-medium">Expired</span>
                      )}
                    </div>
                  </div>
                  {!isExpired && (
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleDecision(approval.id, 'approved')}
                        disabled={processing === approval.id}
                        className="px-4 py-2 bg-emerald-600 text-white text-sm font-medium rounded-xl hover:bg-emerald-700 disabled:opacity-50 transition-colors"
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => handleDecision(approval.id, 'denied')}
                        disabled={processing === approval.id}
                        className="px-4 py-2 bg-white border border-[#d2d2d7] text-[#424245] text-sm font-medium rounded-xl hover:bg-[#f5f5f7] disabled:opacity-50 transition-colors"
                      >
                        Deny
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {pending.length === 0 && (
        <div className="bg-white rounded-2xl border border-[#d2d2d7] shadow-sm p-10 text-center">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 flex items-center justify-center mx-auto mb-4">
            <ShieldCheck className="w-6 h-6 text-emerald-400" />
          </div>
          <p className="text-[#424245] font-medium mb-1">All caught up!</p>
          <p className="text-sm text-[#86868b]">No pending approvals right now</p>
        </div>
      )}

      {/* Resolved approvals */}
      {resolved.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-[#86868b] uppercase tracking-wide">
            History
          </h2>
          <div className="bg-white rounded-2xl border border-[#d2d2d7] shadow-sm divide-y divide-[#f5f5f7]">
            {resolved.map((approval) => {
              const config = statusConfig[approval.status]
              const StatusIcon = config.icon
              return (
                <div key={approval.id} className="flex items-center gap-4 px-6 py-4">
                  <div className={`p-2 rounded-xl ${config.bg}`}>
                    <StatusIcon className={`w-4 h-4 ${config.color}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-[#1d1d1f] capitalize">
                      {approval.action_type.replace(/_/g, ' ')}
                    </p>
                    <p className="text-xs text-[#86868b] truncate">{approval.context_summary}</p>
                  </div>
                  <div className="text-right">
                    <span className={`inline-block px-3 py-1 text-xs font-medium rounded-full ${
                      approval.status === 'approved' ? 'bg-emerald-100 text-emerald-700' :
                      approval.status === 'denied' ? 'bg-red-100 text-red-700' :
                      'bg-[#f5f5f7] text-[#424245]'
                    }`}>
                      {approval.status}
                    </span>
                    {approval.decided_via && (
                      <p className="text-xs text-[#86868b] mt-0.5">via {approval.decided_via}</p>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
