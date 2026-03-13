export interface VapiServerMessage {
  message: {
    type: 'assistant-request' | 'conversation-update' | 'end-of-call-report' | 'function-call' | 'hang' | 'speech-update' | 'status-update' | 'transcript' | 'tool-calls' | 'transfer-destination-request' | 'voice-input'
    call?: VapiCall
    transcript?: string
    functionCall?: {
      name: string
      parameters: Record<string, unknown>
    }
    toolCallList?: Array<{
      id: string
      type: string
      function: {
        name: string
        arguments: string
      }
    }>
    endedReason?: string
    recordingUrl?: string
    summary?: string
    messages?: Array<{
      role: string
      message: string
    }>
    /** Present on transfer-destination-request messages */
    destination?: {
      type?: string
      assistantName?: string
      assistant?: { name?: string }
      description?: string
      message?: string
    }
  }
}

export interface VapiCall {
  id: string
  orgId: string
  type: string
  status: string
  assistantId?: string
  phoneNumberId?: string
  customer?: {
    number?: string
    name?: string
  }
  createdAt: string
  endedAt?: string
}

export interface VapiServerResponse {
  messageResponse?: {
    assistantMessage?: {
      role: 'assistant'
      content: string
    }
    endCall?: boolean
    forwardTo?: {
      number: string
      message?: string
    }
  }
}
