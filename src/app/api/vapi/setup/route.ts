import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getVapiClient } from '@/lib/vapi/client'

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
    const { assistantId, phoneNumberId, voiceEnabled } = body

    const vapi = getVapiClient()
    const updates: Record<string, unknown> = {}

    // If assistantId provided, validate it exists on Vapi then save
    if (assistantId !== undefined) {
      if (assistantId) {
        try {
          await vapi.getAssistant(assistantId)
        } catch {
          return NextResponse.json(
            { error: 'Invalid assistant ID. Could not find assistant on Vapi.' },
            { status: 400 }
          )
        }
      }
      updates.vapi_assistant_id = assistantId || null
    }

    // If phoneNumberId provided, assign it to the assistant via Vapi API
    if (phoneNumberId !== undefined) {
      if (phoneNumberId) {
        // Get the current assistant ID (from the update or from the database)
        let currentAssistantId = assistantId
        if (!currentAssistantId) {
          const { data: currentConfig } = await supabase
            .from('business_config')
            .select('vapi_assistant_id')
            .eq('tenant_id', tenantId)
            .single()
          currentAssistantId = currentConfig?.vapi_assistant_id
        }

        if (!currentAssistantId) {
          return NextResponse.json(
            { error: 'Cannot assign phone number without an assistant ID configured.' },
            { status: 400 }
          )
        }

        try {
          await vapi.assignPhoneToAssistant(phoneNumberId, currentAssistantId)
        } catch {
          return NextResponse.json(
            { error: 'Failed to assign phone number to assistant on Vapi.' },
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
      // Auto-determine voice_enabled: true when both assistant and phone are configured
      const finalAssistantId = assistantId !== undefined ? assistantId : undefined
      const finalPhoneId = phoneNumberId !== undefined ? phoneNumberId : undefined

      if (finalAssistantId !== undefined || finalPhoneId !== undefined) {
        // Fetch current config to merge with updates
        const { data: currentConfig } = await supabase
          .from('business_config')
          .select('vapi_assistant_id, vapi_phone_number_id')
          .eq('tenant_id', tenantId)
          .single()

        const resolvedAssistantId = finalAssistantId ?? currentConfig?.vapi_assistant_id
        const resolvedPhoneId = finalPhoneId ?? currentConfig?.vapi_phone_number_id

        updates.voice_enabled = !!(resolvedAssistantId && resolvedPhoneId)
      }
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: 'No updates provided' }, { status: 400 })
    }

    const { data: updatedConfig, error: updateError } = await supabase
      .from('business_config')
      .update(updates)
      .eq('tenant_id', tenantId)
      .select('vapi_assistant_id, vapi_phone_number_id, voice_enabled')
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
