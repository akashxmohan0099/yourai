import { createAdminClient } from '@/lib/supabase/admin'

export async function handleApprovalResolved(data: {
  approvalId: string
  tenantId: string
  conversationId: string
  clientId?: string
  actionType: string
  actionDetails: any
  decision: string
}) {
  const supabase = createAdminClient()

  await supabase.from('ai_audit_log').insert({
    tenant_id: data.tenantId,
    conversation_id: data.conversationId,
    event_type: 'permission_check',
    tool_name: 'request-approval',
    tool_input: { approvalId: data.approvalId, actionType: data.actionType },
    permission_result: data.decision,
  })
}

// Called by cron to expire stale approvals
export async function expireStaleApprovals() {
  const supabase = createAdminClient()

  const { data: expired } = await supabase
    .from('approvals')
    .update({
      status: 'expired',
      updated_at: new Date().toISOString(),
    })
    .eq('status', 'pending')
    .lt('expires_at', new Date().toISOString())
    .select('id')

  return { expired: expired?.length || 0 }
}
