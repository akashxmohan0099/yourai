import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import crypto from 'crypto'

function signState(tenantId: string, userId: string): string {
  const secret = process.env.NYLAS_API_KEY || ''
  const payload = `${tenantId}:${userId}`
  const hmac = crypto.createHmac('sha256', secret).update(payload).digest('hex')
  return `${payload}:${hmac}`
}

export async function GET() {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.redirect(new URL('/login', process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'))
    }

    // Get tenant from user profile
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('tenant_id, role')
      .eq('auth_user_id', user.id)
      .single()

    if (!profile) {
      return NextResponse.json({ error: 'No tenant found for user' }, { status: 403 })
    }

    // Only owners and admins can connect email
    if (profile.role !== 'owner' && profile.role !== 'admin') {
      return NextResponse.json({ error: 'Only owners and admins can connect email' }, { status: 403 })
    }

    const clientId = process.env.NYLAS_CLIENT_ID
    if (!clientId) {
      return NextResponse.json({ error: 'NYLAS_CLIENT_ID not configured' }, { status: 500 })
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    const redirectUri = `${appUrl}/api/nylas/callback`

    // Sign state to prevent tampering
    const signedState = signState(profile.tenant_id, user.id)

    // Create Nylas hosted auth URL via v3 API
    const response = await fetch('https://api.us.nylas.com/v3/connect/auth', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.NYLAS_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        client_id: clientId,
        redirect_uri: redirectUri,
        provider: 'microsoft',
        access_type: 'online',
        prompt: 'login',
        state: signedState,
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Nylas auth URL creation failed:', errorText)
      return NextResponse.json({ error: 'Failed to create auth URL' }, { status: 500 })
    }

    const data = await response.json()
    const authUrl = data.data?.url || data.url

    if (!authUrl) {
      console.error('No auth URL in Nylas response:', JSON.stringify(data))
      return NextResponse.json({ error: 'No auth URL returned from Nylas' }, { status: 500 })
    }

    return NextResponse.redirect(authUrl)
  } catch (error) {
    console.error('Nylas auth initiation error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
