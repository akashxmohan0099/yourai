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
    /** Full conversation transcript from end-of-call report */
    messages?: Array<{
      role: string
      message: string
      time?: number
      secondsFromStart?: number
    }>
    /** Artifact data from end-of-call report */
    artifact?: {
      messages?: Array<{
        role: string
        message: string
        time?: number
        secondsFromStart?: number
      }>
      recordingUrl?: string
      stereoRecordingUrl?: string
      transcript?: string
    }
    /** Call duration in seconds */
    durationSeconds?: number
    /** Status of the call (for status-update messages) */
    status?: string
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
    toolResults?: Array<{
      toolCallId: string
      result: string
    }>
  }
}
