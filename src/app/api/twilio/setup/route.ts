import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import {
  buyPhoneNumber,
  configureWebhook,
  listPhoneNumbers,
} from '@/lib/twilio/client'

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
    const { phoneNumber, buyNumber, ownerPhone } = body as {
      phoneNumber?: string
      buyNumber?: boolean
      ownerPhone?: string
    }

    const updates: Record<string, unknown> = {}
    let purchasedNumber: { sid: string; phoneNumber: string } | null = null

    // ----- Buy a phone number if requested -----
    if (buyNumber && phoneNumber) {
      try {
        const result = await buyPhoneNumber(phoneNumber)
        purchasedNumber = { sid: result.sid, phoneNumber: result.phoneNumber }
        updates.twilio_phone_number = result.phoneNumber
      } catch (err: any) {
        return NextResponse.json(
          { error: `Failed to buy phone number: ${err.message}` },
          { status: 400 }
        )
      }
    } else if (phoneNumber && !buyNumber) {
      // Just set the phone number (already owned)
      updates.twilio_phone_number = phoneNumber
    }

    // ----- Save owner notification phone -----
    if (ownerPhone !== undefined) {
      updates.owner_notification_phone = ownerPhone || null
    }

    // ----- Determine sms_enabled -----
    // Fetch the current config so we can merge
    const { data: currentConfig } = await supabase
      .from('business_config')
      .select('twilio_phone_number, sms_enabled')
      .eq('tenant_id', tenantId)
      .single()

    const resolvedPhoneNumber =
      (updates.twilio_phone_number as string) || currentConfig?.twilio_phone_number

    if (resolvedPhoneNumber) {
      updates.sms_enabled = true
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: 'No updates provided' }, { status: 400 })
    }

    // ----- Persist to business_config -----
    const { data: updatedConfig, error: updateError } = await supabase
      .from('business_config')
      .update(updates)
      .eq('tenant_id', tenantId)
      .select('twilio_phone_number, sms_enabled, owner_notification_phone')
      .single()

    if (updateError) {
      console.error('Failed to update business_config:', updateError)
      return NextResponse.json({ error: 'Failed to save configuration' }, { status: 500 })
    }

    // ----- Configure the webhook URL on the purchased/assigned number -----
    if (resolvedPhoneNumber) {
      try {
        // Find the SID for this phone number
        let phoneNumberSid = purchasedNumber?.sid
        if (!phoneNumberSid) {
          const numbers = await listPhoneNumbers()
          const match = numbers.find(
            (n: any) => n.phoneNumber === resolvedPhoneNumber
          )
          phoneNumberSid = match?.sid
        }

        if (phoneNumberSid) {
          // Build the webhook URL — use the request origin or known host
          const forwardedHost = request.headers.get('x-forwarded-host')
          const vercelUrl = process.env.VERCEL_URL
          const origin =
            request.headers.get('origin')
            || (forwardedHost ? `https://${forwardedHost}` : null)
            || process.env.NEXT_PUBLIC_APP_URL
            || (vercelUrl ? `https://${vercelUrl}` : null)

          if (origin) {
            const smsWebhookUrl = `${origin}/api/webhooks/twilio/sms`
            await configureWebhook(phoneNumberSid, smsWebhookUrl)
          }
        }
      } catch (err) {
        // Non-fatal — webhook config can be done manually
        console.error('Failed to configure Twilio webhook:', err)
      }
    }

    return NextResponse.json({
      config: updatedConfig,
      purchased: purchasedNumber,
    })
  } catch (error) {
    console.error('Twilio setup error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// GET handler to return current SMS/Twilio status
export async function GET() {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: profile } = await supabase
      .from('user_profiles')
      .select('tenant_id, role')
      .eq('auth_user_id', user.id)
      .single()

    if (!profile || !['owner', 'admin'].includes(profile.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { data: config } = await supabase
      .from('business_config')
      .select('twilio_phone_number, sms_enabled, owner_notification_phone')
      .eq('tenant_id', profile.tenant_id)
      .single()

    // Also list phone numbers from Twilio if credentials are set
    let twilioNumbers: any[] = []
    try {
      if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) {
        twilioNumbers = await listPhoneNumbers()
      }
    } catch {
      // Twilio credentials may be invalid
    }

    return NextResponse.json({
      twilio_phone_number: config?.twilio_phone_number || null,
      sms_enabled: config?.sms_enabled || false,
      owner_notification_phone: config?.owner_notification_phone || null,
      twilioNumbers,
    })
  } catch (error) {
    console.error('Twilio status error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
