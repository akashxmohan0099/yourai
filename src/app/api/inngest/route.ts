import { serve } from 'inngest/next'
import { inngest } from '@/lib/inngest/client'
import { logConversationEvent } from '@/lib/inngest/functions/log-conversation'
import { handleApprovalCreated, handleApprovalResolved } from '@/lib/inngest/functions/process-approval'
import { processVapiEvent } from '@/lib/inngest/functions/process-vapi-event'
import { dailyBriefing } from '@/lib/inngest/functions/daily-briefing'
import { processInboundEmail } from '@/lib/inngest/functions/process-email'
import {
  reviewRequestCampaign,
  rebookingNudgeCampaign,
  invoiceReminderCampaign,
} from '@/lib/inngest/functions/retention-campaigns'

export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [
    logConversationEvent,
    handleApprovalCreated,
    handleApprovalResolved,
    processVapiEvent,
    dailyBriefing,
    processInboundEmail,
    reviewRequestCampaign,
    rebookingNudgeCampaign,
    invoiceReminderCampaign,
  ],
})
