import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

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
      .select('tenant_id')
      .eq('auth_user_id', user.id)
      .single()

    if (!profile) {
      return NextResponse.json({ error: 'No tenant found for user' }, { status: 403 })
    }

    const clientId = process.env.NYLAS_CLIENT_ID
    if (!clientId) {
      return NextResponse.json({ error: 'NYLAS_CLIENT_ID not configured' }, { status: 500 })
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    const redirectUri = `${appUrl}/api/nylas/callback`

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
        state: profile.tenant_id,
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
