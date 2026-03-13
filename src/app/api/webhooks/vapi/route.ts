import { NextRequest, NextResponse } from 'next/server'
import { processVapiEvent } from '@/lib/background/process-vapi-event'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Fire and forget — don't block the webhook response
    processVapiEvent({
      type: body.message?.type || 'unknown',
      callId: body.message?.call?.id,
      payload: body,
    }).catch(err => console.error('Vapi event processing error:', err))

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('Vapi webhook error:', error)
    return NextResponse.json({ received: true }, { status: 200 })
  }
}
