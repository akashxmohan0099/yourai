import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createBusinessSquad, buildSquadPayload } from '@/lib/vapi/squads'
import { buildVapiServerConfig, getVapiWebhookSecret } from '@/lib/vapi/server-auth'

const VAPI_API_BASE = 'https://api.vapi.ai'

async function getAuthenticatedTenant() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return null

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('tenant_id, role')
    .eq('auth_user_id', user.id)
    .single()

  if (!profile || !['owner', 'admin'].includes(profile.role)) return null

  return { supabase, tenantId: profile.tenant_id, role: profile.role }
}

/**
 * POST /api/vapi/squad — Create a new squad on Vapi
 */
export async function POST(request: NextRequest) {
  try {
    const auth = await getAuthenticatedTenant()
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { supabase, tenantId } = auth
    const apiKey = process.env.VAPI_API_KEY
    if (!apiKey) {
      return NextResponse.json(
        { error: 'Vapi API key not configured' },
        { status: 500 }
      )
    }

    // Get business config for squad setup
    const { data: config } = await supabase
      .from('business_config')
      .select('business_name, business_type, vapi_assistant_id, vapi_phone_number_id')
      .eq('tenant_id', tenantId)
      .single()

    if (!config) {
      return NextResponse.json(
        { error: 'Business not configured' },
        { status: 400 }
      )
    }

    // Get services for the business
    const { data: services } = await supabase
      .from('services')
      .select('name')
      .eq('tenant_id', tenantId)
      .eq('is_active', true)

    const serviceNames = (services || []).map((s: any) => s.name)

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    const serverUrl = `${appUrl}/api/voice/respond`
    if (!getVapiWebhookSecret()) {
      return NextResponse.json(
        { error: 'VAPI_WEBHOOK_SECRET must be configured before creating a squad.' },
        { status: 500 }
      )
    }

    // Build the squad
    const squad = createBusinessSquad({
      businessName: config.business_name || 'Our Business',
      businessType: config.business_type || 'service business',
      services: serviceNames,
      server: buildVapiServerConfig(serverUrl),
    })

    const payload = buildSquadPayload(squad)

    // Create squad on Vapi
    const res = await fetch(`${VAPI_API_BASE}/squad`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    })

    if (!res.ok) {
      const errorBody = await res.text()
      console.error('Vapi squad creation failed:', res.status, errorBody)
      return NextResponse.json(
        { error: 'Failed to create squad on Vapi', details: errorBody },
        { status: res.status }
      )
    }

    const vapiSquad = await res.json()

    // Save squad ID in business_config
    await supabase
      .from('business_config')
      .update({ vapi_squad_id: vapiSquad.id })
      .eq('tenant_id', tenantId)

    return NextResponse.json({
      squad: vapiSquad,
      message: 'Squad created successfully',
    })
  } catch (error) {
    console.error('Squad creation error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * GET /api/vapi/squad — List existing squads
 */
export async function GET() {
  try {
    const auth = await getAuthenticatedTenant()
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const apiKey = process.env.VAPI_API_KEY
    if (!apiKey) {
      return NextResponse.json(
        { error: 'Vapi API key not configured' },
        { status: 500 }
      )
    }

    const res = await fetch(`${VAPI_API_BASE}/squad`, {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
    })

    if (!res.ok) {
      const errorBody = await res.text()
      return NextResponse.json(
        { error: 'Failed to list squads', details: errorBody },
        { status: res.status }
      )
    }

    const squads = await res.json()
    return NextResponse.json({ squads })
  } catch (error) {
    console.error('Squad list error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
