import { SupabaseClient } from '@supabase/supabase-js'
import { sendSms } from '../twilio/client'
import { handleApprovalResolved } from '../background/process-approval'

export interface CreateApprovalOptions {
  tenantId: string
  conversationId: string
  clientId?: string
  actionType: string
  actionDetails: Record<string, unknown>
  contextSummary: string
}

export async function createApproval(
  supabase: SupabaseClient,
  options: CreateApprovalOptions
): Promise<string> {
  // Get approval timeout from config
  const { data: config } = await supabase
    .from('business_config')
    .select('approval_timeout_minutes, owner_notification_phone')
    .eq('tenant_id', options.tenantId)
    .single()

  const timeoutMinutes = config?.approval_timeout_minutes || 30
  const expiresAt = new Date(Date.now() + timeoutMinutes * 60 * 1000).toISOString()

  // Create approval record
  const { data: approval, error } = await supabase
    .from('approvals')
    .insert({
      tenant_id: options.tenantId,
      conversation_id: options.conversationId,
      client_id: options.clientId || null,
      action_type: options.actionType,
      action_details: options.actionDetails,
      context_summary: options.contextSummary,
      status: 'pending',
      expires_at: expiresAt,
    })
    .select('id')
    .single()

  if (error) throw error

  const approvalId = approval.id

  // Send SMS notification to owner
  if (config?.owner_notification_phone) {
    try {
      const message = formatApprovalSms(options.actionType, options.contextSummary, approvalId)
      await sendSms(config.owner_notification_phone, message)

      await supabase
        .from('approvals')
        .update({ sms_sent: true })
        .eq('id', approvalId)
    } catch (err) {
      console.error('Failed to send approval SMS:', err)
    }
  }

  // Approval expiration is now handled by the expire-approvals cron job

  return approvalId
}

export async function resolveApproval(
  supabase: SupabaseClient,
  approvalId: string,
  decision: 'approved' | 'denied',
  decidedBy: string | null,
  decidedVia: 'dashboard' | 'sms'
): Promise<boolean> {
  const { data: approval } = await supabase
    .from('approvals')
    .select('*')
    .eq('id', approvalId)
    .single()

  if (!approval || approval.status !== 'pending') {
    return false
  }

  // Check if expired
  if (new Date(approval.expires_at) < new Date()) {
    await supabase
      .from('approvals')
      .update({ status: 'expired' })
      .eq('id', approvalId)
    return false
  }

  // Update approval
  await supabase
    .from('approvals')
    .update({
      status: decision,
      decided_by: decidedBy,
      decided_at: new Date().toISOString(),
      decided_via: decidedVia,
    })
    .eq('id', approvalId)

  // Log the resolution (fire and forget)
  handleApprovalResolved({
    approvalId,
    tenantId: approval.tenant_id,
    conversationId: approval.conversation_id,
    clientId: approval.client_id,
    actionType: approval.action_type,
    actionDetails: approval.action_details,
    decision,
  }).catch(err => console.error('Approval resolution logging error:', err))

  return true
}

export async function handleApprovalSmsReply(
  supabase: SupabaseClient,
  tenantId: string,
  fromPhone: string,
  messageBody: string
): Promise<boolean> {
  const normalized = messageBody.trim().toUpperCase()

  // Check if this is a YES/NO reply from the owner
  if (normalized !== 'YES' && normalized !== 'NO' && normalized !== 'Y' && normalized !== 'N' && normalized !== 'APPROVE' && normalized !== 'DENY') {
    return false
  }

  // Verify sender is the owner
  const { data: config } = await supabase
    .from('business_config')
    .select('owner_notification_phone')
    .eq('tenant_id', tenantId)
    .single()

  if (!config?.owner_notification_phone) return false

  // Normalize phone numbers for comparison
  const ownerPhone = config.owner_notification_phone.replace(/\D/g, '')
  const senderPhone = fromPhone.replace(/\D/g, '')

  if (!ownerPhone.endsWith(senderPhone.slice(-10)) && !senderPhone.endsWith(ownerPhone.slice(-10))) {
    return false
  }

  // Find the most recent pending approval
  const { data: pendingApproval } = await supabase
    .from('approvals')
    .select('id')
    .eq('tenant_id', tenantId)
    .eq('status', 'pending')
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  if (!pendingApproval) {
    await sendSms(fromPhone, 'No pending approvals found.')
    return true
  }

  const isApproved = ['YES', 'Y', 'APPROVE'].includes(normalized)
  const decision = isApproved ? 'approved' : 'denied'

  await resolveApproval(supabase, pendingApproval.id, decision, null, 'sms')

  const replyMsg = isApproved
    ? 'Approved! The customer will be notified.'
    : 'Denied. The customer will be informed.'
  await sendSms(fromPhone, replyMsg)

  return true
}

function formatApprovalSms(actionType: string, summary: string, approvalId: string): string {
  return `[YourAI] Approval needed:\n\n${actionType}: ${summary}\n\nReply YES to approve or NO to deny.\n\nRef: ${approvalId.slice(0, 8)}`
}
