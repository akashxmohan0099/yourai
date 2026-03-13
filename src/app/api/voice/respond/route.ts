import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { buildBusinessContext, buildClientContext, formatContextForPrompt } from '@/lib/ai/context-builder'
import { runAgentSync } from '@/lib/ai/agent'
import { normalizeIncomingMessage, resolveTenantFromChannel } from '@/lib/channels/normalizer'
import type { VapiServerMessage, VapiServerResponse } from '@/lib/vapi/types'
import { ModelMessage } from 'ai'
import { SupabaseClient } from '@supabase/supabase-js'
import { buildVapiServerFields, verifyVapiRequest } from '@/lib/vapi/server-auth'

export const maxDuration = 10 // Voice requires fast responses

/**
 * Detect whether an incoming call is from the business owner/manager.
 * Checks both the caller's phone number against owner_notification_phone
 * and the Vapi assistant ID against vapi_owner_assistant_id.
 */
async function isOwnerCall(
  supabase: SupabaseClient,
  tenantId: string,
  callerPhone: string | undefined,
  assistantId: string | undefined
): Promise<boolean> {
  const { data: config } = await supabase
    .from('business_config')
    .select('owner_notification_phone, vapi_owner_assistant_id')
    .eq('tenant_id', tenantId)
    .single()

  if (!config) return false

  // Match by owner assistant ID (strongest signal)
  if (assistantId && config.vapi_owner_assistant_id && assistantId === config.vapi_owner_assistant_id) {
    return true
  }

  // Match by caller phone number
  if (callerPhone && config.owner_notification_phone) {
    const normalizePhone = (p: string) => p.replace(/[\s\-\(\)]/g, '')
    if (normalizePhone(callerPhone) === normalizePhone(config.owner_notification_phone)) {
      return true
    }
  }

  return false
}

export async function POST(request: NextRequest) {
  try {
    const authError = verifyVapiRequest(request)
    if (authError) {
      return authError
    }

    const body: VapiServerMessage = await request.json()
    const messageType = body.message?.type

    // Handle different message types
    if (messageType === 'status-update') {
      return NextResponse.json({})
    }

    if (messageType === 'end-of-call-report') {
      // Save call summary in background
      await handleEndOfCall(body)
      return NextResponse.json({})
    }

    if (messageType === 'transcript' || messageType === 'conversation-update') {
      // These are informational, no response needed
      return NextResponse.json({})
    }

    // Handle squad transfer-destination-request (agent wants to hand off)
    if (messageType === 'transfer-destination-request') {
      return await handleTransferDestination(body)
    }

    // Handle assistant-request (Vapi asks which assistant to use for the call)
    if (messageType === 'assistant-request') {
      return await handleAssistantRequest(body)
    }

    // Handle tool calls from Vapi
    if (messageType === 'tool-calls' && body.message?.toolCallList) {
      return await handleToolCalls(body)
    }

    // For voice-input or function-call, run through our agent
    if (messageType === 'voice-input' || messageType === 'function-call') {
      return await handleVoiceInput(body)
    }

    return NextResponse.json({})
  } catch (error) {
    console.error('Voice respond error:', error)
    return NextResponse.json(
      { messageResponse: { assistantMessage: { role: 'assistant', content: "I'm sorry, I'm having trouble right now. Please try again." } } },
      { status: 200 } // Always return 200 to Vapi
    )
  }
}

async function handleVoiceInput(body: VapiServerMessage): Promise<NextResponse> {
  const supabase = createAdminClient()

  // Resolve tenant from phone number
  const tenantId = await resolveTenantFromChannel('voice', body.message)
  if (!tenantId) {
    return NextResponse.json({
      messageResponse: {
        assistantMessage: {
          role: 'assistant',
          content: "I'm sorry, this number isn't configured yet. Please contact the business directly.",
        },
      },
    })
  }

  // Detect owner vs customer call
  const callerPhone = body.message?.call?.customer?.number
  const assistantId = body.message?.call?.assistantId
  const ownerCall = await isOwnerCall(supabase, tenantId, callerPhone, assistantId)
  const mode = ownerCall ? 'owner' : 'customer'

  // Get transcript/content
  const content = body.message?.functionCall?.parameters?.userMessage as string
    || body.message?.transcript
    || ''

  if (!content) {
    return NextResponse.json({})
  }

  // Normalize the message
  const normalized = await normalizeIncomingMessage('voice', body.message, tenantId)

  // Save user message
  await supabase.from('messages').insert({
    conversation_id: normalized.conversationId,
    tenant_id: tenantId,
    role: 'user',
    content,
    metadata: { channel: 'voice', callId: body.message?.call?.id, mode },
  })

  // Build context and get conversation history
  const context = await buildBusinessContext(supabase, tenantId)

  // Build client context for personalized responses
  const clientContext = normalized.clientId
    ? await buildClientContext(supabase, tenantId, normalized.clientId)
    : null

  const { data: prevMessages } = await supabase
    .from('messages')
    .select('role, content')
    .eq('conversation_id', normalized.conversationId)
    .order('created_at', { ascending: true })
    .limit(20)

  const messages: ModelMessage[] = (prevMessages || []).map((m: any) => ({
    role: m.role === 'assistant' ? 'assistant' : 'user',
    content: m.content,
  })) as ModelMessage[]

  // Run agent (sync mode - voice needs immediate response)
  // Owner mode gets full tool access (schedule, clients, invoices, etc.)
  const response = await runAgentSync(messages, {
    tenantId,
    conversationId: normalized.conversationId,
    mode,
    context,
    supabase,
    clientId: normalized.clientId || undefined,
    clientContext,
  })

  // Save assistant response
  await supabase.from('messages').insert({
    conversation_id: normalized.conversationId,
    tenant_id: tenantId,
    role: 'assistant',
    content: response,
    metadata: { channel: 'voice', callId: body.message?.call?.id, mode },
  })

  const vapiResponse: VapiServerResponse = {
    messageResponse: {
      assistantMessage: {
        role: 'assistant',
        content: response,
      },
    },
  }

  return NextResponse.json(vapiResponse)
}

async function handleToolCalls(body: VapiServerMessage): Promise<NextResponse> {
  const supabase = createAdminClient()
  const toolCalls = body.message?.toolCallList || []

  const tenantId = await resolveTenantFromChannel('voice', body.message)
  if (!tenantId) {
    const results = toolCalls.map((tc) => ({
      toolCallId: tc.id,
      result: JSON.stringify({ error: 'Could not resolve tenant' }),
    }))
    return NextResponse.json({ messageResponse: { toolResults: results } })
  }

  // Build context and get tools
  const context = await buildBusinessContext(supabase, tenantId)

  // Detect owner vs customer to determine available tools
  const callerPhone = body.message?.call?.customer?.number
  const assistantId = body.message?.call?.assistantId
  const ownerCall = await isOwnerCall(supabase, tenantId, callerPhone, assistantId)

  const { getCustomerTools, getOwnerTools } = await import('@/lib/ai/tools')
  const tools = ownerCall
    ? getOwnerTools(context, supabase, tenantId)
    : getCustomerTools(context, supabase, tenantId)

  // Execute each tool call
  const results = await Promise.all(
    toolCalls.map(async (tc) => {
      const fnName = tc.function?.name
      let args: Record<string, unknown> = {}
      try {
        args = tc.function?.arguments ? JSON.parse(tc.function.arguments) : {}
      } catch {
        // arguments may already be parsed or empty
      }

      const toolDef = tools[fnName]
      if (!toolDef || !toolDef.execute) {
        return {
          toolCallId: tc.id,
          result: JSON.stringify({ error: `Unknown tool: ${fnName}` }),
        }
      }

      try {
        const output = await toolDef.execute(args)
        return {
          toolCallId: tc.id,
          result: JSON.stringify(output),
        }
      } catch (err: any) {
        console.error(`Tool ${fnName} failed:`, err)
        return {
          toolCallId: tc.id,
          result: JSON.stringify({ error: `Tool failed: ${err.message}` }),
        }
      }
    })
  )

  return NextResponse.json({ messageResponse: { toolResults: results } })
}

/**
 * Handle transfer-destination-request: a squad member wants to hand off to another agent.
 * Vapi sends the destination assistant name; we return its config.
 */
async function handleTransferDestination(body: VapiServerMessage): Promise<NextResponse> {
  const supabase = createAdminClient()

  const tenantId = await resolveTenantFromChannel('voice', body.message)
  if (!tenantId) {
    return NextResponse.json({
      error: 'Could not resolve tenant for transfer',
    })
  }

  const destination = body.message?.destination
  const destinationName: string =
    destination?.assistantName ||
    destination?.assistant?.name ||
    destination?.description ||
    ''

  if (!destinationName) {
    console.error('Transfer destination request missing assistant name:', JSON.stringify(body.message))
    return NextResponse.json({})
  }

  // Build full business context for the transfer destination
  const context = await buildBusinessContext(supabase, tenantId)
  const contextBlock = formatContextForPrompt(context)
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
  const serverFields = buildVapiServerFields(`${appUrl}/api/voice/respond`)

  const systemPrompt = `You are the ${destinationName} for ${context.businessName}. You are handling a phone call that was transferred to you.

${context.description ? `About the business: ${context.description}` : ''}

Be helpful, concise, and natural — this is a voice conversation.
${context.customInstructions ? `\nBusiness rules: ${context.customInstructions}` : ''}

--- Business Information ---
${contextBlock}`

  return NextResponse.json({
    destination: {
      type: 'assistant',
      assistant: {
        name: destinationName,
        model: {
          provider: 'anthropic',
          model: 'claude-sonnet-4-20250514',
          messages: [{ role: 'system', content: systemPrompt }],
        },
        voice: { provider: 'vapi', voiceId: 'Elliot' },
        ...serverFields,
        transcriber: { provider: 'deepgram', model: 'nova-3', language: 'en' },
      },
      transferMode: 'rolling-history',
    },
  })
}

/**
 * Handle assistant-request: Vapi asks which assistant to use for this call.
 * Returns the Greeter (first squad member) so the call starts there.
 */
async function handleAssistantRequest(body: VapiServerMessage): Promise<NextResponse> {
  const supabase = createAdminClient()

  const tenantId = await resolveTenantFromChannel('voice', body.message)
  if (!tenantId) {
    return NextResponse.json({
      assistant: {
        name: 'Default Assistant',
        firstMessage: 'Hello! How can I help you today?',
        model: {
          provider: 'openai',
          model: 'gpt-4o-mini',
          messages: [
            { role: 'system', content: 'You are a helpful business assistant. This number is not configured yet.' },
          ],
        },
        voice: { provider: '11labs', voiceId: 'bIHbv24MWmeRgasZH58o' },
      },
    })
  }

  // Build full business context for this tenant
  const context = await buildBusinessContext(supabase, tenantId)
  const contextBlock = formatContextForPrompt(context)

  const systemPrompt = `You are the AI phone assistant for ${context.businessName}${context.industry ? `, a ${context.industry} business` : ''}.
${context.description ? `\nAbout the business: ${context.description}` : ''}

You are answering a phone call on behalf of the business. Be warm, helpful, and concise — this is a voice conversation so keep responses short and natural.

Your role:
- Answer questions about services, pricing, and availability
- Provide business hours and location information
- Help with frequently asked questions
- Guide callers toward booking or contacting the business

${context.tone === 'casual' ? 'Be relaxed and informal.' : context.tone === 'professional' ? 'Maintain a professional tone.' : context.tone === 'formal' ? 'Use formal, respectful language.' : 'Be warm, approachable, and conversational.'}

Important:
- Only share information you have been provided about the business
- If you don\'t know something, say so and offer to take a message
- Never make up pricing, availability, or service details
- Keep responses concise — this is a phone call, not a text chat
${context.customInstructions ? `\nAdditional instructions from the business owner:\n${context.customInstructions}` : ''}

--- Business Information ---
${contextBlock}`

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
  const serverFields = buildVapiServerFields(`${appUrl}/api/voice/respond`)

  return NextResponse.json({
    assistant: {
      name: `${context.businessName} Assistant`,
      firstMessage: `Hi! Thanks for calling ${context.businessName}. How can I help you today?`,
      model: {
        provider: 'anthropic',
        model: 'claude-sonnet-4-20250514',
        messages: [
          { role: 'system', content: systemPrompt },
        ],
      },
      voice: { provider: 'vapi', voiceId: 'Elliot' },
      ...serverFields,
      transcriber: { provider: 'deepgram', model: 'nova-3', language: 'en' },
    },
  })
}

async function handleEndOfCall(body: VapiServerMessage) {
  const supabase = createAdminClient()
  const callId = body.message?.call?.id
  if (!callId) return

  const tenantId = await resolveTenantFromChannel('voice', body.message)
  if (!tenantId) return

  // Extract transcript from artifact or messages
  const artifactMessages = body.message?.artifact?.messages || body.message?.messages || []
  const transcript = artifactMessages
    .filter((m) => m.role === 'user' || m.role === 'assistant' || m.role === 'bot')
    .map((m) => `${m.role === 'user' ? 'Customer' : 'AI'}: ${m.message}`)
    .join('\n')

  const recordingUrl = body.message?.artifact?.recordingUrl || body.message?.recordingUrl
  const summary = body.message?.summary
  const durationSeconds = body.message?.durationSeconds
  const endedReason = body.message?.endedReason

  // Calculate duration from call timestamps if not provided
  let duration = durationSeconds
  if (!duration && body.message?.call?.createdAt && body.message?.call?.endedAt) {
    duration = Math.round(
      (new Date(body.message.call.endedAt).getTime() - new Date(body.message.call.createdAt).getTime()) / 1000
    )
  }

  // Find and close the conversation
  const { data: conv } = await supabase
    .from('conversations')
    .select('id')
    .eq('tenant_id', tenantId)
    .eq('metadata->>callId', callId)
    .single()

  if (conv) {
    await supabase
      .from('conversations')
      .update({
        status: 'resolved',
        ended_at: new Date().toISOString(),
        metadata: {
          callId,
          endedReason,
          summary,
          transcript,
          recordingUrl,
          durationSeconds: duration,
          callerNumber: body.message?.call?.customer?.number,
        },
      })
      .eq('id', conv.id)
  }
}
