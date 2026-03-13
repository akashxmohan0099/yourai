import { createAdminClient } from '@/lib/supabase/admin'
import { NextRequest, NextResponse } from 'next/server'

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .substring(0, 50)
}

export async function POST(request: NextRequest) {
  try {
    const { userId, businessName, email } = await request.json()

    if (!userId || !businessName) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Debug: check env vars are present
    const hasUrl = !!process.env.NEXT_PUBLIC_SUPABASE_URL
    const hasServiceKey = !!process.env.SUPABASE_SERVICE_ROLE_KEY
    if (!hasUrl || !hasServiceKey) {
      return NextResponse.json(
        { error: 'Missing env vars', hasUrl, hasServiceKey },
        { status: 500 }
      )
    }

    const supabase = createAdminClient()
    const baseSlug = generateSlug(businessName)

    // Ensure unique slug
    let slug = baseSlug
    let suffix = 1
    while (true) {
      const { data: existing } = await supabase
        .from('tenants')
        .select('id')
        .eq('slug', slug)
        .single()

      if (!existing) break
      slug = `${baseSlug}-${suffix}`
      suffix++
    }

    // Create tenant
    const { data: tenant, error: tenantError } = await supabase
      .from('tenants')
      .insert({
        name: businessName,
        slug,
        owner_id: userId,
        status: 'onboarding',
      })
      .select()
      .single()

    if (tenantError) throw tenantError

    // Create user profile
    const { error: profileError } = await supabase
      .from('user_profiles')
      .insert({
        auth_user_id: userId,
        tenant_id: tenant.id,
        role: 'owner',
        display_name: email.split('@')[0],
      })

    if (profileError) throw profileError

    // Create empty business config
    const { error: configError } = await supabase
      .from('business_config')
      .insert({
        tenant_id: tenant.id,
        business_name: businessName,
      })

    if (configError) throw configError

    return NextResponse.json({ tenant })
  } catch (error: any) {
    console.error('Account setup error:', error)
    return NextResponse.json(
      {
        error: 'Failed to set up account',
        details: error?.message || error?.code || String(error),
        hint: error?.hint || null,
      },
      { status: 500 }
    )
  }
}
