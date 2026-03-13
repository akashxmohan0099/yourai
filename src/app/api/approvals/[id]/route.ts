import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { resolveApproval } from '@/lib/approvals/engine'
import { NextRequest, NextResponse } from 'next/server'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { decision } = await request.json()

    if (!['approved', 'denied'].includes(decision)) {
      return NextResponse.json({ error: 'Invalid decision' }, { status: 400 })
    }

    const supabase = await createClient()

    // Get current user
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verify user has owner or admin role — staff/viewer cannot resolve approvals
    const adminSupabase = createAdminClient()
    const { data: profile } = await adminSupabase
      .from('user_profiles')
      .select('role, tenant_id')
      .eq('auth_user_id', user.id)
      .single()

    if (!profile || !['owner', 'admin'].includes(profile.role)) {
      return NextResponse.json({ error: 'Forbidden: owner or admin role required' }, { status: 403 })
    }

    // Verify the approval belongs to the user's tenant
    const { data: approval } = await adminSupabase
      .from('approvals')
      .select('tenant_id')
      .eq('id', id)
      .single()

    if (!approval || approval.tenant_id !== profile.tenant_id) {
      return NextResponse.json({ error: 'Approval not found' }, { status: 404 })
    }

    const success = await resolveApproval(
      adminSupabase,
      id,
      decision,
      user.id,
      'dashboard'
    )

    if (!success) {
      return NextResponse.json(
        { error: 'Approval not found or already resolved' },
        { status: 404 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Approval update error:', error)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
