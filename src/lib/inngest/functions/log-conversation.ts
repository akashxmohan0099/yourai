import { inngest } from '../client'
import { createAdminClient } from '@/lib/supabase/admin'

export const logConversationEvent = inngest.createFunction(
  { id: 'log-conversation-event' },
  { event: 'conversation/event' },
  async ({ event }) => {
    const { tenantId, conversationId, eventType, data } = event.data

    const supabase = createAdminClient()

    await supabase.from('ai_audit_log').insert({
      tenant_id: tenantId,
      conversation_id: conversationId,
      event_type: eventType,
      tool_name: data.toolName,
      tool_input: data.toolInput,
      tool_output: data.toolOutput,
      permission_result: data.permissionResult,
      model_used: data.modelUsed,
      tokens_in: data.tokensIn,
      tokens_out: data.tokensOut,
      latency_ms: data.latencyMs,
      error: data.error,
    })

    return { logged: true }
  }
)
