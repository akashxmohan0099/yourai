import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getVapiClient } from '@/lib/vapi/client'
import { buildVapiServerConfig, getVapiWebhookSecret } from '@/lib/vapi/server-auth'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get tenant from user profile
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('tenant_id, role')
      .eq('auth_user_id', user.id)
      .single()

    if (!profile || !['owner', 'admin'].includes(profile.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const tenantId = profile.tenant_id
    const body = await request.json()
    const { assistantId, phoneNumberId, voiceEnabled, ownerAssistantId } = body

    const vapi = getVapiClient()
    const updates: Record<string, unknown> = {}
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || request.nextUrl.origin
    const voiceServerUrl = `${appUrl}/api/voice/respond`
    const voiceServer = buildVapiServerConfig(voiceServerUrl)
    const configuringVoice =
      !!assistantId || !!ownerAssistantId || !!phoneNumberId || voiceEnabled === true

    if (configuringVoice && !getVapiWebhookSecret()) {
      return NextResponse.json(
        { error: 'VAPI_WEBHOOK_SECRET must be configured before enabling voice callbacks.' },
        { status: 500 }
      )
    }

    // If assistantId provided, validate it exists on Vapi then save
    if (assistantId !== undefined) {
      if (assistantId) {
        try {
          await vapi.getAssistant(assistantId)
          await vapi.updateAssistant(assistantId, {
            server: voiceServer,
            serverUrl: voiceServerUrl,
          })
        } catch {
          return NextResponse.json(
            { error: 'Invalid assistant ID. Could not find assistant on Vapi.' },
            { status: 400 }
          )
        }
      }
      updates.vapi_assistant_id = assistantId || null
    }

    // If ownerAssistantId provided, validate it exists on Vapi then save
    if (ownerAssistantId !== undefined) {
      if (ownerAssistantId) {
        try {
          await vapi.getAssistant(ownerAssistantId)
          await vapi.updateAssistant(ownerAssistantId, {
            server: voiceServer,
            serverUrl: voiceServerUrl,
          })
        } catch {
          return NextResponse.json(
            { error: 'Invalid owner assistant ID. Could not find assistant on Vapi.' },
            { status: 400 }
          )
        }
      }
      updates.vapi_owner_assistant_id = ownerAssistantId || null
    }

    // If phoneNumberId provided, configure it in server-URL mode.
    // We do NOT assign an assistantId to the phone number — instead, the phone
    // uses our serverUrl and we return a dynamic assistant via assistant-request.
    // This lets us inject fresh business context and tool definitions per call.
    if (phoneNumberId !== undefined) {
      if (phoneNumberId) {
        try {
          // Configure phone number for server-URL mode: remove assistantId,
          // set serverUrl so Vapi sends assistant-request to our server.
          await vapi.updatePhoneNumber(phoneNumberId, {
            assistantId: null,
            squadId: null,
            serverUrl: voiceServerUrl,
            server: voiceServer,
          })
        } catch (err) {
          console.error('Failed to configure phone number:', err)
          return NextResponse.json(
            { error: 'Failed to configure phone number on Vapi.' },
            { status: 400 }
          )
        }
      }
      updates.vapi_phone_number_id = phoneNumberId || null
    }

    // Handle voice_enabled toggle
    if (voiceEnabled !== undefined) {
      updates.voice_enabled = voiceEnabled
    } else {
      // Auto-determine: enabled when phone number is configured
      const finalPhoneId = phoneNumberId !== undefined ? phoneNumberId : undefined

      if (finalPhoneId !== undefined) {
        updates.voice_enabled = !!finalPhoneId
      } else if (assistantId !== undefined) {
        const { data: currentConfig } = await supabase
          .from('business_config')
          .select('vapi_phone_number_id')
          .eq('tenant_id', tenantId)
          .single()
        updates.voice_enabled = !!(currentConfig?.vapi_phone_number_id)
      }
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: 'No updates provided' }, { status: 400 })
    }

    const { data: updatedConfig, error: updateError } = await supabase
      .from('business_config')
      .update(updates)
      .eq('tenant_id', tenantId)
      .select('vapi_assistant_id, vapi_phone_number_id, vapi_owner_assistant_id, voice_enabled')
      .single()

    if (updateError) {
      console.error('Failed to update business_config:', updateError)
      return NextResponse.json({ error: 'Failed to save configuration' }, { status: 500 })
    }

    return NextResponse.json({ config: updatedConfig })
  } catch (error) {
    console.error('Vapi setup error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
