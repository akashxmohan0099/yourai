import { createAdminClient } from '@/lib/supabase/admin'
import { runAgentSync } from '@/lib/ai/agent'
import { buildBusinessContext } from '@/lib/ai/context-builder'
import { type ModelMessage } from 'ai'

const VAPI_API_BASE = 'https://api.vapi.ai'

export async function deliverVoiceBriefing(tenantId: string, briefingText: string) {
  const supabase = createAdminClient()

  const { data: config } = await supabase
    .from('business_config')
    .select(
      'vapi_assistant_id, vapi_owner_assistant_id, vapi_phone_number_id, owner_notification_phone, voice_enabled, business_name'
    )
    .eq('tenant_id', tenantId)
    .single()

  if (!config) return { delivered: false, reason: 'No business config found' }
  if (!config.voice_enabled) return { delivered: false, reason: 'Voice not enabled' }
  if (!config.owner_notification_phone) return { delivered: false, reason: 'No owner phone' }
  if (!config.vapi_phone_number_id) return { delivered: false, reason: 'No Vapi phone number' }

  const apiKey = process.env.VAPI_API_KEY
  if (!apiKey) return { delivered: false, reason: 'Vapi API key not configured' }

  const assistantId = config.vapi_owner_assistant_id || config.vapi_assistant_id
  if (!assistantId) return { delivered: false, reason: 'No Vapi assistant configured' }

  // Generate spoken version
  const ctx = await buildBusinessContext(supabase, tenantId)
  const messages: ModelMessage[] = [
    {
      role: 'user',
      content: `Convert this daily briefing into a natural, spoken format suitable for a phone call. Keep it concise but friendly. Start with "Good morning!" or appropriate greeting.\n\nBriefing:\n${briefingText}\n\nRemember: This will be read aloud, so use natural speech patterns. After reading the briefing, the AI should offer to answer any questions.`,
    },
  ]

  const spokenBriefing = await runAgentSync(messages, {
    tenantId,
    conversationId: 'voice-briefing',
    mode: 'owner',
    context: ctx,
    supabase,
  })

  // Make outbound call
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
  const callPayload = {
    assistantId,
    phoneNumberId: config.vapi_phone_number_id,
    customer: {
      number: config.owner_notification_phone,
      name: 'Business Owner',
    },
    assistantOverrides: {
      firstMessage: spokenBriefing,
      serverUrl: `${appUrl}/api/voice/respond`,
      model: {
        messages: [
          {
            role: 'system',
            content: `You just delivered the daily briefing to the business owner of ${config.business_name || 'the business'}. You are now available to answer any follow-up questions they have about today's schedule, pending approvals, overnight conversations, or anything else about the business. Be concise and helpful.`,
          },
        ],
      },
    },
  }

  const res = await fetch(`${VAPI_API_BASE}/call`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(callPayload),
  })

  if (!res.ok) {
    const errorBody = await res.text()
    console.error('Voice briefing call failed:', res.status, errorBody)
    return { delivered: false, reason: 'Vapi call failed', error: errorBody }
  }

  const vapiCall = await res.json()

  // Log delivery
  await supabase.from('ai_audit_log').insert({
    tenant_id: tenantId,
    event_type: 'tool_call',
    tool_name: 'voice_briefing',
    tool_input: { callId: vapiCall.id, ownerPhone: config.owner_notification_phone },
    tool_output: { status: vapiCall.status },
  })

  return { delivered: true, callId: vapiCall.id, status: vapiCall.status }
}
