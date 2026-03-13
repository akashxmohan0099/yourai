import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { NextResponse, type NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url)
    const code = url.searchParams.get('code')
    const state = url.searchParams.get('state') // tenant_id passed as state

    if (!code) {
      const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
      return NextResponse.redirect(
        `${appUrl}/settings?error=${encodeURIComponent('No authorization code received from Nylas')}`
      )
    }

    const clientId = process.env.NYLAS_CLIENT_ID
    const clientSecret = process.env.NYLAS_API_KEY

    if (!clientId || !clientSecret) {
      return NextResponse.json({ error: 'Nylas credentials not configured' }, { status: 500 })
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    const redirectUri = `${appUrl}/api/nylas/callback`

    // Exchange code for grant via Nylas v3 token endpoint
    const tokenResponse = await fetch('https://api.us.nylas.com/v3/connect/token', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${clientSecret}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        client_id: clientId,
        client_secret: clientSecret,
        code,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
      }),
    })

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text()
      console.error('Nylas token exchange failed:', errorText)
      return NextResponse.redirect(
        `${appUrl}/settings?error=${encodeURIComponent('Failed to connect email account. Please try again.')}`
      )
    }

    const tokenData = await tokenResponse.json()
    const grantId = tokenData.grant_id

    if (!grantId) {
      console.error('No grant_id in Nylas token response:', JSON.stringify(tokenData))
      return NextResponse.redirect(
        `${appUrl}/settings?error=${encodeURIComponent('No grant ID returned from Nylas')}`
      )
    }

    // Determine tenant_id: use state param if available, otherwise look up from authenticated user
    let tenantId = state

    if (!tenantId) {
      const supabase = await createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        return NextResponse.redirect(`${appUrl}/login`)
      }

      const { data: profile } = await supabase
        .from('user_profiles')
        .select('tenant_id')
        .eq('auth_user_id', user.id)
        .single()

      if (!profile) {
        return NextResponse.redirect(
          `${appUrl}/settings?error=${encodeURIComponent('No tenant found for user')}`
        )
      }

      tenantId = profile.tenant_id
    }

    // Save grant_id to business_config using admin client
    const adminSupabase = createAdminClient()
    const { error: updateError } = await adminSupabase
      .from('business_config')
      .update({ nylas_grant_id: grantId })
      .eq('tenant_id', tenantId)

    if (updateError) {
      console.error('Failed to save Nylas grant_id:', updateError)
      return NextResponse.redirect(
        `${appUrl}/settings?error=${encodeURIComponent('Connected to Nylas but failed to save. Please set Grant ID manually: ' + grantId)}`
      )
    }

    return NextResponse.redirect(
      `${appUrl}/settings?success=${encodeURIComponent('Email account connected successfully!')}`
    )
  } catch (error) {
    console.error('Nylas callback error:', error)
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    return NextResponse.redirect(
      `${appUrl}/settings?error=${encodeURIComponent('An unexpected error occurred. Please try again.')}`
    )
  }
}
