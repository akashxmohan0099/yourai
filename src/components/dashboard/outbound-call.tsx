'use client'

import { CheckCircle2, Loader2, Phone, PhoneCall, PhoneOff, X } from 'lucide-react'
import { useState } from 'react'

interface OutboundCallModalProps {
  open: boolean
  onClose: () => void
  clientId: string
  clientName: string
  clientPhone: string
}

type CallPurpose = 'follow_up' | 'reminder' | 'rebooking' | 'review_request'
type CallStatus = 'idle' | 'initiating' | 'ringing' | 'in-progress' | 'completed' | 'error'

const PURPOSE_LABELS: Record<CallPurpose, string> = {
  follow_up: 'Follow Up',
  reminder: 'Appointment Reminder',
  rebooking: 'Rebooking Nudge',
  review_request: 'Review Request',
}

const PURPOSE_DESCRIPTIONS: Record<CallPurpose, string> = {
  follow_up: 'Check in with the client after a recent visit.',
  reminder: 'Remind the client about an upcoming appointment.',
  rebooking: 'Encourage the client to book another appointment.',
  review_request: 'Ask the client to leave a review.',
}

export function OutboundCallModal({
  open,
  onClose,
  clientId,
  clientName,
  clientPhone,
}: OutboundCallModalProps) {
  const [purpose, setPurpose] = useState<CallPurpose>('follow_up')
  const [customMessage, setCustomMessage] = useState('')
  const [callStatus, setCallStatus] = useState<CallStatus>('idle')
  const [callId, setCallId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const startCall = async () => {
    setCallStatus('initiating')
    setError(null)

    try {
      const res = await fetch('/api/calls/outbound', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientId,
          clientPhone,
          purpose,
          customMessage: customMessage.trim() || undefined,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        setCallStatus('error')
        setError(data.error || 'Failed to initiate call')
        return
      }

      setCallId(data.callId)
      setCallStatus('ringing')
      setTimeout(() => setCallStatus('in-progress'), 3000)
      setTimeout(() => setCallStatus('completed'), 60000)
    } catch {
      setCallStatus('error')
      setError('Failed to connect. Please try again.')
    }
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div
        className="absolute inset-0 bg-[rgba(28,22,18,0.4)] backdrop-blur-sm"
        onClick={
          callStatus === 'idle' || callStatus === 'completed' || callStatus === 'error'
            ? onClose
            : undefined
        }
      />

      <div className="panel relative w-full max-w-xl rounded-[32px]">
        <div className="flex items-center justify-between border-b border-[var(--line)] px-6 py-5">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[rgba(208,109,79,0.12)]">
              <Phone className="h-5 w-5 text-[var(--accent)]" />
            </div>
            <div>
              <p className="kicker">Outbound call</p>
              <h2 className="mt-2 text-2xl font-semibold text-[var(--ink)]">Call client</h2>
            </div>
          </div>
          <button onClick={onClose} className="btn-secondary h-11 w-11 rounded-2xl px-0">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-5 px-6 py-6">
          <div className="rounded-[24px] bg-white/45 px-4 py-4">
            <p className="text-sm font-semibold text-[var(--ink)]">{clientName}</p>
            <p className="mt-1 text-sm text-[var(--ink-faint)]">{clientPhone}</p>
          </div>

          {callStatus !== 'idle' ? (
            <div className="rounded-[24px] bg-white/45 px-4 py-4">
              {callStatus === 'initiating' ? (
                <div className="flex items-center gap-3 text-[var(--warning)]">
                  <Loader2 className="h-5 w-5 animate-spin" />
                  <span className="text-sm font-medium">Initiating call...</span>
                </div>
              ) : null}
              {callStatus === 'ringing' ? (
                <div className="flex items-center gap-3 text-[var(--teal)]">
                  <PhoneCall className="h-5 w-5 animate-pulse" />
                  <span className="text-sm font-medium">Ringing...</span>
                </div>
              ) : null}
              {callStatus === 'in-progress' ? (
                <div className="flex items-center gap-3 text-[var(--success)]">
                  <PhoneCall className="h-5 w-5" />
                  <span className="text-sm font-medium">Call in progress</span>
                </div>
              ) : null}
              {callStatus === 'completed' ? (
                <div className="flex items-center gap-3 text-[var(--teal)]">
                  <CheckCircle2 className="h-5 w-5" />
                  <span className="text-sm font-medium">Call completed</span>
                </div>
              ) : null}
              {callStatus === 'error' ? (
                <div className="flex items-center gap-3 text-[var(--error)]">
                  <PhoneOff className="h-5 w-5" />
                  <span className="text-sm font-medium">{error || 'Call failed'}</span>
                </div>
              ) : null}
            </div>
          ) : null}

          {callStatus === 'idle' || callStatus === 'error' ? (
            <>
              <div>
                <label className="field-label">Call purpose</label>
                <select
                  value={purpose}
                  onChange={(e) => setPurpose(e.target.value as CallPurpose)}
                  className="field-select text-sm"
                >
                  {Object.entries(PURPOSE_LABELS).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
                <p className="field-note">{PURPOSE_DESCRIPTIONS[purpose]}</p>
              </div>

              <div>
                <label className="field-label">Custom message</label>
                <textarea
                  value={customMessage}
                  onChange={(e) => setCustomMessage(e.target.value)}
                  placeholder="Override the default greeting message..."
                  rows={3}
                  className="field-textarea text-sm"
                />
              </div>
            </>
          ) : null}

          {callId ? (
            <p className="text-xs uppercase tracking-[0.14em] text-[var(--ink-faint)]">
              Call ID: <span className="font-mono normal-case">{callId}</span>
            </p>
          ) : null}
        </div>

        <div className="flex flex-wrap items-center gap-3 border-t border-[var(--line)] px-6 py-5">
          {callStatus === 'idle' || callStatus === 'error' ? (
            <>
              <button onClick={onClose} className="btn-secondary">
                Cancel
              </button>
              <button onClick={startCall} className="btn-primary">
                <Phone className="h-4 w-4" />
                Start call
              </button>
            </>
          ) : null}
          {callStatus === 'initiating' || callStatus === 'ringing' || callStatus === 'in-progress' ? (
            <button onClick={onClose} className="btn-secondary">
              Close (call continues)
            </button>
          ) : null}
          {callStatus === 'completed' ? (
            <button onClick={onClose} className="btn-primary">
              Done
            </button>
          ) : null}
        </div>
      </div>
    </div>
  )
}
