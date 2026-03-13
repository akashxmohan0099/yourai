import { NextRequest, NextResponse } from 'next/server'
import { expireStaleApprovals } from '@/lib/background/process-approval'

export async function POST(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const result = await expireStaleApprovals()
    return NextResponse.json(result)
  } catch (error) {
    console.error('Expire approvals cron error:', error)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
