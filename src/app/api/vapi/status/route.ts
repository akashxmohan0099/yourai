import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getVapiClient } from '@/lib/vapi/client'

export async function GET() {
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

    // Get current Vapi config from business_config
    const { data: config } = await supabase
      .from('business_config')
      .select('vapi_assistant_id, vapi_phone_number_id, voice_enabled')
      .eq('tenant_id', tenantId)
      .single()

    const result: Record<string, unknown> = {
      vapi_assistant_id: config?.vapi_assistant_id || null,
      vapi_phone_number_id: config?.vapi_phone_number_id || null,
      voice_enabled: config?.voice_enabled || false,
      assistant: null,
    }

    // If assistant ID is configured, fetch details from Vapi
    if (config?.vapi_assistant_id) {
      try {
        const vapi = getVapiClient()
        const assistant = await vapi.getAssistant(config.vapi_assistant_id)
        result.assistant = {
          id: assistant.id,
          name: assistant.name || 'Unnamed Assistant',
          model: assistant.model?.model || null,
          voice: assistant.voice?.voiceId || assistant.voice?.provider || null,
          createdAt: assistant.createdAt,
        }
      } catch {
        // Assistant may have been deleted or API key changed
        result.assistant = null
        result.assistantError = 'Could not fetch assistant details from Vapi'
      }
    }

    return NextResponse.json(result)
  } catch (error) {
    console.error('Vapi status error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
