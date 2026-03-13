import { inngest } from '../client'
import { createAdminClient } from '@/lib/supabase/admin'
import { runAgentSync } from '@/lib/ai/agent'
import { buildBusinessContext } from '@/lib/ai/context-builder'
import { type ModelMessage } from 'ai'

const VAPI_API_BASE = 'https://api.vapi.ai'

/**
 * Voice Briefing — triggers a Vapi outbound call to the business owner
 * reading the daily briefing aloud, with the ability to answer follow-up questions.
 *
 * Triggered by the daily-briefing function when briefing_channels includes "voice".
 */
export const voiceBriefing = inngest.createFunction(
  { id: 'voice-briefing', name: 'Deliver Voice Briefing to Owner' },
  { event: 'yourai/voice-briefing.requested' },
  async ({ event, step }) => {
    const { tenantId, briefingText } = event.data as {
      tenantId: string
      briefingText: string
    }

    const supabase = createAdminClient()

    // Get the business config for voice call setup
    const config = await step.run('get-config', async () => {
      const { data } = await supabase
        .from('business_config')
        .select(
          'vapi_assistant_id, vapi_owner_assistant_id, vapi_phone_number_id, owner_notification_phone, voice_enabled, business_name'
        )
        .eq('tenant_id', tenantId)
        .single()

      return data
    })

    if (!config) {
      return { delivered: false, reason: 'No business config found' }
    }

    if (!config.voice_enabled) {
      return { delivered: false, reason: 'Voice not enabled for this tenant' }
    }

    if (!config.owner_notification_phone) {
      return { delivered: false, reason: 'No owner phone number configured' }
    }

    if (!config.vapi_phone_number_id) {
      return { delivered: false, reason: 'No Vapi phone number configured' }
    }

    const apiKey = process.env.VAPI_API_KEY
    if (!apiKey) {
      return { delivered: false, reason: 'Vapi API key not configured' }
    }

    // Use the owner assistant if available, otherwise use the main one
    const assistantId = config.vapi_owner_assistant_id || config.vapi_assistant_id
    if (!assistantId) {
      return { delivered: false, reason: 'No Vapi assistant configured' }
    }

    // Build a conversational briefing first message
    const context = await step.run('build-briefing-message', async () => {
      const ctx = await buildBusinessContext(supabase, tenantId)

      // Generate a spoken-friendly version of the briefing
      const messages: ModelMessage[] = [
        {
          role: 'user',
          content: `Convert this daily briefing into a natural, spoken format suitable for a phone call. Keep it concise but friendly. The AI will read this to the business owner, so make it sound conversational, not like reading a document. Start with "Good morning!" or appropriate greeting.

Briefing:
${briefingText}

Remember: This will be read aloud, so use natural speech patterns. After reading the briefing, the AI should offer to answer any questions.`,
        },
      ]

      const spokenBriefing = await runAgentSync(messages, {
        tenantId,
        conversationId: 'voice-briefing',
        mode: 'owner',
        context: ctx,
        supabase,
      })

      return { spokenBriefing, context: ctx }
    })

    // Make the outbound call via Vapi
    const callResult = await step.run('make-call', async () => {
      const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

      const callPayload = {
        assistantId,
        phoneNumberId: config.vapi_phone_number_id,
        customer: {
          number: config.owner_notification_phone,
          name: 'Business Owner',
        },
        assistantOverrides: {
          firstMessage: context.spokenBriefing,
          serverUrl: `${appUrl}/api/voice/respond`,
          model: {
            messages: [
              {
                role: 'system',
                content: `You just delivered the daily briefing to the business owner of ${config.business_name || 'the business'}. You are now available to answer any follow-up questions they have about today's schedule, pending approvals, overnight conversations, or anything else about the business. Be concise and helpful. You have full access to business data through your tools.`,
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
        return { success: false as const, error: errorBody, callId: null, status: null }
      }

      const vapiCall = await res.json()
      return { success: true as const, callId: vapiCall.id as string, status: vapiCall.status as string, error: null }
    })

    if (!callResult.success) {
      return { delivered: false, reason: 'Vapi call failed', error: callResult.error }
    }

    // Log the briefing delivery
    await step.run('log-delivery', async () => {
      await supabase.from('ai_audit_log').insert({
        tenant_id: tenantId,
        event_type: 'tool_call',
        tool_name: 'voice_briefing',
        tool_input: {
          callId: callResult.callId,
          ownerPhone: config.owner_notification_phone,
        },
        tool_output: { status: callResult.status },
      })
    })

    return {
      delivered: true,
      callId: callResult.callId,
      status: callResult.status,
    }
  }
)
