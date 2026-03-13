import { NextRequest, NextResponse } from 'next/server'
import { generateDailyBriefings } from '@/lib/background/daily-briefing'

export async function POST(request: NextRequest) {
  // Verify cron secret
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const result = await generateDailyBriefings()
    return NextResponse.json(result)
  } catch (error) {
    console.error('Daily briefing cron error:', error)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
