import { createAdminClient } from '@/lib/supabase/admin'

export async function processVapiEvent(data: {
  type: string
  callId?: string
  payload: any
}) {
  const supabase = createAdminClient()

  await supabase.from('ai_audit_log').insert({
    tenant_id: null as any,
    event_type: 'tool_call',
    tool_name: `vapi:${data.type}`,
    tool_input: { callId: data.callId, type: data.type },
    tool_output: data.payload,
  })
}
