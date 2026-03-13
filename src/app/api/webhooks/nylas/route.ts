import { createAdminClient } from '@/lib/supabase/admin'
import { handleNylasCalendarWebhook } from '@/lib/scheduling/calendar-sync'
import { verifyNylasWebhookRequest } from '@/lib/nylas/webhook-validator'

export async function GET(request: Request) {
  // Nylas webhook verification (challenge response)
  const url = new URL(request.url)
  const challenge = url.searchParams.get('challenge')
  if (challenge) {
    return new Response(challenge, { status: 200 })
  }
  return new Response('OK', { status: 200 })
}

export async function POST(request: Request) {
  try {
    const verification = await verifyNylasWebhookRequest(request)
    if (!verification.ok) {
      return verification.response
    }

    const payload = JSON.parse(verification.body)
    const supabase = createAdminClient()

    for (const delta of payload.deltas || [payload]) {
      await handleNylasCalendarWebhook(supabase, delta)
    }

    return new Response('OK', { status: 200 })
  } catch (error) {
    console.error('Nylas webhook error:', error)
    return new Response('Internal error', { status: 500 })
  }
}
