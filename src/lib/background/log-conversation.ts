import { createAdminClient } from '@/lib/supabase/admin'

export async function logConversationEvent(data: {
  tenantId: string
  conversationId: string
  eventType: string
  data: {
    toolName?: string
    toolInput?: any
    toolOutput?: any
    permissionResult?: string
    modelUsed?: string
    tokensIn?: number
    tokensOut?: number
    latencyMs?: number
    error?: string
  }
}) {
  const supabase = createAdminClient()

  await supabase.from('ai_audit_log').insert({
    tenant_id: data.tenantId,
    conversation_id: data.conversationId,
    event_type: data.eventType,
    tool_name: data.data.toolName,
    tool_input: data.data.toolInput,
    tool_output: data.data.toolOutput,
    permission_result: data.data.permissionResult,
    model_used: data.data.modelUsed,
    tokens_in: data.data.tokensIn,
    tokens_out: data.data.tokensOut,
    latency_ms: data.data.latencyMs,
    error: data.data.error,
  })
}
