import { createAdminClient } from '@/lib/supabase/admin'

export async function processVapiEvent(data: {
  type: string
  callId?: string
  payload: any
}) {
  const supabase = createAdminClient()

  // Resolve tenant from the call's conversation record
  let tenantId: string | null = null

  if (data.callId) {
    const { data: conv } = await supabase
      .from('conversations')
      .select('tenant_id')
      .eq('channel_message_id', data.callId)
      .limit(1)
      .single()

    tenantId = conv?.tenant_id || null
  }

  if (!tenantId) {
    // Can't log without tenant — skip silently rather than fail with NOT NULL violation
    console.warn(`[processVapiEvent] Could not resolve tenant for callId=${data.callId}, skipping audit log`)
    return
  }

  await supabase.from('ai_audit_log').insert({
    tenant_id: tenantId,
    event_type: 'tool_call',
    tool_name: `vapi:${data.type}`,
    tool_input: { callId: data.callId, type: data.type },
    tool_output: data.payload,
  })
}
