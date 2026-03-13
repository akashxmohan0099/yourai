import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { buildVapiServerFields, getVapiWebhookSecret } from '@/lib/vapi/server-auth'

const VAPI_API_BASE = 'https://api.vapi.ai'

type OutboundPurpose = 'follow_up' | 'reminder' | 'rebooking' | 'review_request'

const PURPOSE_MESSAGES: Record<OutboundPurpose, string> = {
  follow_up:
    "Hi! I'm calling on behalf of {businessName} to follow up with you. How are you doing?",
  reminder:
    "Hi! I'm calling from {businessName} with a friendly reminder about your upcoming appointment. Would you like to confirm?",
  rebooking:
    "Hi! It's been a while since your last visit at {businessName}. We'd love to see you again — would you like to schedule an appointment?",
  review_request:
    "Hi! I'm calling from {businessName}. We hope you had a great experience! Would you be willing to leave us a quick review?",
}

/**
 * POST /api/calls/outbound — Initiate an outbound call to a client via Vapi
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get tenant and verify owner/admin role
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('tenant_id, role')
      .eq('auth_user_id', user.id)
      .single()

    if (!profile || !['owner', 'admin'].includes(profile.role)) {
      return NextResponse.json({ error: 'Forbidden — owner or admin only' }, { status: 403 })
    }

    const tenantId = profile.tenant_id
    const body = await request.json()
    const { clientId, clientPhone, purpose, customMessage } = body as {
      clientId: string
      clientPhone: string
      purpose: OutboundPurpose
      customMessage?: string
    }

    // Validate required fields
    if (!clientId || !clientPhone || !purpose) {
      return NextResponse.json(
        { error: 'Missing required fields: clientId, clientPhone, purpose' },
        { status: 400 }
      )
    }

    if (!['follow_up', 'reminder', 'rebooking', 'review_request'].includes(purpose)) {
      return NextResponse.json(
        { error: 'Invalid purpose. Must be: follow_up, reminder, rebooking, review_request' },
        { status: 400 }
      )
    }

    // Get tenant's Vapi config
    const { data: config } = await supabase
      .from('business_config')
      .select('vapi_assistant_id, vapi_phone_number_id, voice_enabled, business_name')
      .eq('tenant_id', tenantId)
      .single()

    if (!config?.voice_enabled || !config.vapi_assistant_id || !config.vapi_phone_number_id) {
      return NextResponse.json(
        { error: 'Voice calling is not configured for this business. Set up Vapi first.' },
        { status: 400 }
      )
    }

    const apiKey = process.env.VAPI_API_KEY
    if (!apiKey) {
      return NextResponse.json(
        { error: 'Vapi API key not configured' },
        { status: 500 }
      )
    }

    // Verify client exists
    const { data: client } = await supabase
      .from('clients')
      .select('id, name, phone')
      .eq('id', clientId)
      .eq('tenant_id', tenantId)
      .single()

    if (!client) {
      return NextResponse.json(
        { error: 'Client not found' },
        { status: 404 }
      )
    }

    // Build the first message
    const businessName = config.business_name || 'our business'
    const firstMessage = customMessage
      || PURPOSE_MESSAGES[purpose].replace('{businessName}', businessName)

    // Create conversation record
    const { data: conversation } = await supabase
      .from('conversations')
      .insert({
        tenant_id: tenantId,
        client_id: clientId,
        channel: 'voice',
        status: 'active',
        started_at: new Date().toISOString(),
        metadata: {
          direction: 'outbound',
          purpose,
          initiatedBy: user.id,
        },
      })
      .select('id')
      .single()

    // Create outbound call via Vapi
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    if (!getVapiWebhookSecret()) {
      return NextResponse.json(
        { error: 'VAPI_WEBHOOK_SECRET must be configured before placing outbound calls.' },
        { status: 500 }
      )
    }
    const serverFields = buildVapiServerFields(`${appUrl}/api/voice/respond`)

    const callPayload = {
      assistantId: config.vapi_assistant_id,
      phoneNumberId: config.vapi_phone_number_id,
      customer: {
        number: clientPhone,
        name: client.name || undefined,
      },
      assistantOverrides: {
        firstMessage,
        ...serverFields,
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
      console.error('Vapi outbound call failed:', res.status, errorBody)
      return NextResponse.json(
        { error: 'Failed to create outbound call', details: errorBody },
        { status: res.status }
      )
    }

    const vapiCall = await res.json()

    // Update conversation with call ID
    if (conversation) {
      await supabase
        .from('conversations')
        .update({
          metadata: {
            direction: 'outbound',
            purpose,
            initiatedBy: user.id,
            callId: vapiCall.id,
          },
        })
        .eq('id', conversation.id)
    }

    // Log the outbound call in messages
    await supabase.from('messages').insert({
      conversation_id: conversation?.id,
      tenant_id: tenantId,
      role: 'system',
      content: `Outbound call initiated: ${purpose.replace('_', ' ')} call to ${client.name || clientPhone}`,
      metadata: {
        channel: 'voice',
        callId: vapiCall.id,
        direction: 'outbound',
        purpose,
      },
    })

    return NextResponse.json({
      callId: vapiCall.id,
      conversationId: conversation?.id,
      status: vapiCall.status || 'queued',
      message: 'Outbound call initiated',
    })
  } catch (error) {
    console.error('Outbound call error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
