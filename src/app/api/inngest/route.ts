import { serve } from 'inngest/next'
import { inngest } from '@/lib/inngest/client'
import { logConversationEvent } from '@/lib/inngest/functions/log-conversation'

export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [logConversationEvent],
})
