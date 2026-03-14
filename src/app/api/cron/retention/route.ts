import { NextRequest, NextResponse } from 'next/server'
import { runReviewRequestCampaign, runRebookingNudgeCampaign, runInvoiceReminderCampaign } from '@/lib/background/retention-campaigns'

export async function POST(request: NextRequest) {
  const cronSecret = process.env.CRON_SECRET
  const authHeader = request.headers.get('authorization')
  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const url = new URL(request.url)
  const type = url.searchParams.get('type')

  try {
    let result
    switch (type) {
      case 'review':
        result = await runReviewRequestCampaign()
        break
      case 'rebooking':
        result = await runRebookingNudgeCampaign()
        break
      case 'invoice':
        result = await runInvoiceReminderCampaign()
        break
      default:
        // Run all
        const [reviews, rebooking, invoices] = await Promise.all([
          runReviewRequestCampaign(),
          runRebookingNudgeCampaign(),
          runInvoiceReminderCampaign(),
        ])
        result = { reviews, rebooking, invoices }
    }
    return NextResponse.json(result)
  } catch (error) {
    console.error('Retention cron error:', error)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
