import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { buildBusinessContext, buildClientContext, formatContextForPrompt, formatClientContextForPrompt } from '@/lib/ai/context-builder'
import { buildSystemPrompt } from '@/lib/ai/prompts/system'
import { resolveTenantFromChannel } from '@/lib/channels/normalizer'
import { resolveClient } from '@/lib/clients/resolver'
import type { VapiServerMessage } from '@/lib/vapi/types'
import { SupabaseClient } from '@supabase/supabase-js'
import { buildVapiServerFields, verifyVapiRequest } from '@/lib/vapi/server-auth'

export const maxDuration = 10 // Voice requires fast responses

// ── Helpers ────────────────────────────────────────────────────────────

/**
 * Find or create a conversation record for a Vapi call.
 * Stores callId in conversation metadata so end-of-call can find it.
 */
async function getOrCreateCallConversation(
  supabase: SupabaseClient,
  tenantId: string,
  callId: string,
  callerNumber?: string
): Promise<{ conversationId: string; clientId: string | null }> {
  // Try to find existing conversation by callId in metadata
  const { data: existing } = await supabase
    .from('conversations')
    .select('id, client_id')
    .eq('tenant_id', tenantId)
    .eq('metadata->>callId', callId)
    .single()

  if (existing) {
    return { conversationId: existing.id, clientId: existing.client_id }
  }

  // Resolve or create client from caller phone number
  let clientId: string | null = null
  if (callerNumber) {
    const client = await resolveClient(supabase, {
      tenantId,
      channel: 'voice',
      identifier: callerNumber,
      metadata: { customerPhone: callerNumber },
    })
    clientId = client.id
  }

  // Create new conversation with callId in metadata
  const { data: conv } = await supabase
    .from('conversations')
    .insert({
      tenant_id: tenantId,
      client_id: clientId,
      channel: 'voice',
      status: 'active',
      metadata: { callId, callerNumber },
    })
    .select('id')
    .single()

  return { conversationId: conv?.id || '', clientId }
}

/**
 * Detect whether an incoming call is from the business owner/manager.
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

  if (assistantId && config.vapi_owner_assistant_id && assistantId === config.vapi_owner_assistant_id) {
    return true
  }

  if (callerPhone && config.owner_notification_phone) {
    const normalizePhone = (p: string) => p.replace(/[\s\-\(\)]/g, '')
    if (normalizePhone(callerPhone) === normalizePhone(config.owner_notification_phone)) {
      return true
    }
  }

  return false
}

// ── Vapi tool definitions (OpenAI function-calling format) ─────────────

function getVapiCustomerToolDefs() {
  return [
    {
      type: 'function',
      function: {
        name: 'getServices',
        description: 'Get the list of services offered by the business, optionally filtered by category',
        parameters: {
          type: 'object',
          properties: {
            category: { type: 'string', description: 'Filter by service category' },
          },
        },
      },
    },
    {
      type: 'function',
      function: {
        name: 'getPricing',
        description: 'Get pricing information for a specific service',
        parameters: {
          type: 'object',
          properties: {
            serviceName: { type: 'string', description: 'Name of the service to get pricing for' },
          },
          required: ['serviceName'],
        },
      },
    },
    {
      type: 'function',
      function: {
        name: 'getHours',
        description: 'Get the business hours for a specific day or all days',
        parameters: {
          type: 'object',
          properties: {
            day: { type: 'string', description: 'Specific day of the week (e.g., "monday"), or omit for all days' },
          },
        },
      },
    },
    {
      type: 'function',
      function: {
        name: 'getFaqs',
        description: 'Search frequently asked questions for relevant answers',
        parameters: {
          type: 'object',
          properties: {
            query: { type: 'string', description: 'The question or topic to search FAQs for' },
          },
          required: ['query'],
        },
      },
    },
    {
      type: 'function',
      function: {
        name: 'checkAvailability',
        description: 'Check if the business is open on a given day and time',
        parameters: {
          type: 'object',
          properties: {
            day: { type: 'string', description: 'Day of the week (e.g., "monday")' },
            time: { type: 'string', description: 'Time to check in HH:MM format (e.g., "14:00")' },
          },
          required: ['day'],
        },
      },
    },
    {
      type: 'function',
      function: {
        name: 'createAppointment',
        description: 'Book a new appointment for the caller. Checks for conflicts automatically. Ask the caller for their name, preferred service, date and time before calling this.',
        parameters: {
          type: 'object',
          properties: {
            clientName: { type: 'string', description: 'Full name of the client' },
            serviceName: { type: 'string', description: 'Name of the service being booked' },
            date: { type: 'string', description: 'Date for the appointment in YYYY-MM-DD format' },
            time: { type: 'string', description: 'Start time in HH:MM format (24-hour)' },
            durationMinutes: { type: 'number', description: 'Duration in minutes (uses service default if omitted)' },
            notes: { type: 'string', description: 'Any additional notes' },
          },
          required: ['clientName', 'date', 'time'],
        },
      },
    },
  ]
}

function getVapiOwnerToolDefs() {
  return [
    ...getVapiCustomerToolDefs(),
    {
      type: 'function',
      function: {
        name: 'getSchedule',
        description: "Get the schedule/appointments for a given time range. Use for today's schedule, tomorrow's appointments, or this week's bookings.",
        parameters: {
          type: 'object',
          properties: {
            range: {
              type: 'string',
              enum: ['today', 'tomorrow', 'this_week', 'next_week', 'custom'],
              description: 'Time range to view',
            },
            customStartDate: { type: 'string', description: 'Start date for custom range (YYYY-MM-DD)' },
            customEndDate: { type: 'string', description: 'End date for custom range (YYYY-MM-DD)' },
          },
          required: ['range'],
        },
      },
    },
    {
      type: 'function',
      function: {
        name: 'searchClients',
        description: 'Search for clients by name, email, or phone number',
        parameters: {
          type: 'object',
          properties: {
            query: { type: 'string', description: 'Search query — name, email, or phone number' },
            limit: { type: 'number', description: 'Max results to return (default 5)' },
          },
          required: ['query'],
        },
      },
    },
    {
      type: 'function',
      function: {
        name: 'addClientNote',
        description: 'Add a note to a client record. Use for recording preferences or follow-up items.',
        parameters: {
          type: 'object',
          properties: {
            clientName: { type: 'string', description: 'Name of the client' },
            note: { type: 'string', description: 'The note to add' },
            tag: { type: 'string', description: 'Optional tag (e.g., "VIP", "follow-up")' },
          },
          required: ['clientName', 'note'],
        },
      },
    },
  ]
}

// ── Main handler ───────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  try {
    const authError = verifyVapiRequest(request)
    if (authError) {
      return authError
    }

    const body: VapiServerMessage = await request.json()
    const messageType = body.message?.type

    switch (messageType) {
      case 'assistant-request':
        return await handleAssistantRequest(body)

      case 'tool-calls':
        if (body.message?.toolCallList) {
          return await handleToolCalls(body)
        }
        return NextResponse.json({})

      case 'status-update':
        return await handleStatusUpdate(body)

      case 'end-of-call-report':
        await handleEndOfCall(body)
        return NextResponse.json({})

      case 'transfer-destination-request':
        return await handleTransferDestination(body)

      // Informational messages — acknowledge but no action needed
      case 'transcript':
      case 'conversation-update':
      case 'speech-update':
      case 'hang':
        return NextResponse.json({})

      default:
        return NextResponse.json({})
    }
  } catch (error) {
    console.error('Voice respond error:', error)
    // Always return 200 to Vapi to avoid retries
    return NextResponse.json({})
  }
}

// ── assistant-request ──────────────────────────────────────────────────
// Vapi asks which assistant to use. We return a full config with tools.

async function handleAssistantRequest(body: VapiServerMessage): Promise<NextResponse> {
  const supabase = createAdminClient()
  const callId = body.message?.call?.id
  const callerNumber = body.message?.call?.customer?.number

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
            { role: 'system', content: 'You are a helpful business assistant. This number is not configured yet. Please ask the caller to try again later.' },
          ],
        },
        voice: { provider: '11labs', voiceId: 'bIHbv24MWmeRgasZH58o' },
      },
    })
  }

  // Create conversation for this call
  if (callId) {
    await getOrCreateCallConversation(supabase, tenantId, callId, callerNumber)
  }

  // Build context
  const context = await buildBusinessContext(supabase, tenantId)
  const contextBlock = formatContextForPrompt(context)

  // Detect owner vs customer
  const assistantId = body.message?.call?.assistantId
  const ownerCall = await isOwnerCall(supabase, tenantId, callerNumber, assistantId)
  const mode = ownerCall ? 'owner' : 'customer'

  const systemPrompt = buildSystemPrompt({
    businessName: context.businessName,
    industry: context.industry,
    description: context.description,
    tone: context.tone,
    customInstructions: context.customInstructions,
    mode,
  })

  const toolDefs = ownerCall ? getVapiOwnerToolDefs() : getVapiCustomerToolDefs()
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
          { role: 'system', content: `${systemPrompt}\n\n--- Business Information ---\n${contextBlock}` },
        ],
        tools: toolDefs,
      },
      voice: { provider: 'vapi', voiceId: 'Elliot' },
      ...serverFields,
      transcriber: { provider: 'deepgram', model: 'nova-3', language: 'en' },
    },
  })
}

// ── status-update ──────────────────────────────────────────────────────
// Create conversation when call goes "in-progress" (fallback for non-assistant-request mode)

async function handleStatusUpdate(body: VapiServerMessage): Promise<NextResponse> {
  const status = body.message?.status
  const callId = body.message?.call?.id

  if (status === 'in-progress' && callId) {
    const supabase = createAdminClient()
    const tenantId = await resolveTenantFromChannel('voice', body.message)
    if (tenantId) {
      const callerNumber = body.message?.call?.customer?.number
      await getOrCreateCallConversation(supabase, tenantId, callId, callerNumber)
    }
  }

  return NextResponse.json({})
}

// ── tool-calls ─────────────────────────────────────────────────────────
// Vapi intercepts AI tool calls and sends them here for execution.

async function handleToolCalls(body: VapiServerMessage): Promise<NextResponse> {
  const supabase = createAdminClient()
  const toolCalls = body.message?.toolCallList || []
  const callId = body.message?.call?.id
  const callerNumber = body.message?.call?.customer?.number

  const tenantId = await resolveTenantFromChannel('voice', body.message)
  if (!tenantId) {
    const results = toolCalls.map((tc) => ({
      toolCallId: tc.id,
      result: JSON.stringify({ error: 'Could not resolve tenant for this phone number' }),
    }))
    return NextResponse.json({ results })
  }

  // Find or create conversation
  let conversationId = ''
  let clientId: string | undefined
  if (callId) {
    const conv = await getOrCreateCallConversation(supabase, tenantId, callId, callerNumber)
    conversationId = conv.conversationId
    clientId = conv.clientId || undefined
  }

  // Build context and detect mode
  const context = await buildBusinessContext(supabase, tenantId)
  const assistantId = body.message?.call?.assistantId
  const ownerCall = await isOwnerCall(supabase, tenantId, callerNumber, assistantId)

  const { getCustomerTools, getOwnerTools } = await import('@/lib/ai/tools')
  const tools = ownerCall
    ? getOwnerTools(context, supabase, tenantId, conversationId)
    : getCustomerTools(context, supabase, tenantId, conversationId, clientId, true)

  // Execute each tool call
  const results = await Promise.all(
    toolCalls.map(async (tc) => {
      const fnName = tc.function?.name
      let args: Record<string, unknown> = {}
      try {
        const rawArgs = tc.function?.arguments
        args = rawArgs
          ? (typeof rawArgs === 'string' ? JSON.parse(rawArgs) : rawArgs)
          : {}
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

        // Log to audit
        await supabase.from('ai_audit_log').insert({
          tenant_id: tenantId,
          conversation_id: conversationId || null,
          event_type: 'tool_call',
          tool_name: fnName,
          tool_input: args,
          tool_output: output,
          model_used: 'claude-sonnet-4-20250514',
        }).then(() => {}, (err) => console.error('Audit log error:', err))

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

  // Vapi expects { results: [...] } for tool-calls responses
  return NextResponse.json({ results })
}

// ── end-of-call-report ─────────────────────────────────────────────────
// Save the full transcript, summary, and recording to the conversation.

async function handleEndOfCall(body: VapiServerMessage) {
  const supabase = createAdminClient()
  const callId = body.message?.call?.id
  if (!callId) return

  const tenantId = await resolveTenantFromChannel('voice', body.message)
  if (!tenantId) return

  const callerNumber = body.message?.call?.customer?.number

  // Find or create the conversation
  const { conversationId } = await getOrCreateCallConversation(
    supabase, tenantId, callId, callerNumber
  )
  if (!conversationId) return

  // Extract data from the end-of-call report
  const artifactMessages = body.message?.artifact?.messages || body.message?.messages || []
  const transcript = artifactMessages
    .filter((m) => m.role === 'user' || m.role === 'assistant' || m.role === 'bot')
    .map((m) => `${m.role === 'user' ? 'Customer' : 'AI'}: ${m.message}`)
    .join('\n')

  const recordingUrl = body.message?.artifact?.recordingUrl || body.message?.recordingUrl
  const stereoRecordingUrl = body.message?.artifact?.stereoRecordingUrl
  const summary = body.message?.summary
  const endedReason = body.message?.endedReason
  const durationSeconds = body.message?.durationSeconds

  // Calculate duration from timestamps if not provided
  let duration = durationSeconds
  if (!duration && body.message?.call?.createdAt && body.message?.call?.endedAt) {
    duration = Math.round(
      (new Date(body.message.call.endedAt).getTime() -
        new Date(body.message.call.createdAt).getTime()) / 1000
    )
  }

  // Save individual messages from the transcript for the conversation view
  const messageInserts = artifactMessages
    .filter((m) => m.role === 'user' || m.role === 'assistant' || m.role === 'bot')
    .map((m) => ({
      conversation_id: conversationId,
      tenant_id: tenantId,
      role: m.role === 'user' ? 'user' : 'assistant',
      content: m.message,
      metadata: {
        channel: 'voice',
        callId,
        secondsFromStart: m.secondsFromStart,
      },
    }))

  if (messageInserts.length > 0) {
    // Check if messages already exist for this call (avoid duplicates)
    const { count } = await supabase
      .from('messages')
      .select('id', { count: 'exact', head: true })
      .eq('conversation_id', conversationId)

    // Only insert if no messages exist yet (or very few from tool-call logging)
    if ((count || 0) < 2) {
      await supabase.from('messages').insert(messageInserts)
    }
  }

  // Update conversation with call metadata
  await supabase
    .from('conversations')
    .update({
      status: 'resolved',
      ended_at: new Date().toISOString(),
      metadata: {
        callId,
        callerNumber,
        endedReason,
        summary,
        transcript,
        recordingUrl,
        stereoRecordingUrl,
        durationSeconds: duration,
      },
    })
    .eq('id', conversationId)
}

// ── transfer-destination-request ───────────────────────────────────────

async function handleTransferDestination(body: VapiServerMessage): Promise<NextResponse> {
  const supabase = createAdminClient()

  const tenantId = await resolveTenantFromChannel('voice', body.message)
  if (!tenantId) {
    return NextResponse.json({ error: 'Could not resolve tenant for transfer' })
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
          tools: getVapiCustomerToolDefs(),
        },
        voice: { provider: 'vapi', voiceId: 'Elliot' },
        ...serverFields,
        transcriber: { provider: 'deepgram', model: 'nova-3', language: 'en' },
      },
      transferMode: 'rolling-history',
    },
  })
}
