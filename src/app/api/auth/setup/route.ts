import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
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
    const { businessName } = await request.json()

    if (!businessName) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Verify the caller's session — use their actual auth identity, not client input
    const userSupabase = await createClient()
    const { data: { user }, error: authError } = await userSupabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = user.id
    const email = user.email || ''

    // Prevent duplicate tenant creation for the same user
    const adminSupabase = createAdminClient()
    const { data: existingProfile } = await adminSupabase
      .from('user_profiles')
      .select('id')
      .eq('auth_user_id', userId)
      .limit(1)
      .single()

    if (existingProfile) {
      return NextResponse.json(
        { error: 'Account already set up' },
        { status: 409 }
      )
    }

    const supabase = adminSupabase
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
