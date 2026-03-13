import { ChannelAdapter, NormalizedMessage } from '../types'

export const nylasEmailAdapter: ChannelAdapter = {
  async normalize(payload: any): Promise<NormalizedMessage> {
    const message = payload.data?.object || payload

    return {
      tenantId: '', // Resolved by normalizer
      conversationId: '', // Resolved by normalizer
      clientId: '', // Resolved by resolver
      channel: 'email',
      content: message.body || message.snippet || '',
      channelMessageId: message.id,
      metadata: {
        subject: message.subject,
        from: message.from?.[0]?.email,
        fromName: message.from?.[0]?.name,
        threadId: message.thread_id,
        to: message.to?.map((t: any) => t.email),
      },
    }
  },
}
