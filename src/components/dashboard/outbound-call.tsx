'use client'

import { useState, useEffect } from 'react'
import { Phone, X, Loader2, PhoneCall, PhoneOff, CheckCircle2 } from 'lucide-react'

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
  follow_up: 'Check in with the client after a recent visit',
  reminder: 'Remind the client about an upcoming appointment',
  rebooking: 'Encourage the client to book another appointment',
  review_request: 'Ask the client to leave a review',
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

  // Reset state when modal opens
  useEffect(() => {
    if (open) {
      setCallStatus('idle')
      setCallId(null)
      setError(null)
      setCustomMessage('')
      setPurpose('follow_up')
    }
  }, [open])

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

      // Simulate progression: ringing -> in-progress -> completed
      // In production, you'd poll the Vapi API or use webhooks
      setTimeout(() => setCallStatus('in-progress'), 3000)
      setTimeout(() => setCallStatus('completed'), 60000)
    } catch (err) {
      setCallStatus('error')
      setError('Failed to connect. Please try again.')
    }
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={callStatus === 'idle' || callStatus === 'completed' || callStatus === 'error' ? onClose : undefined}
      />

      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-xl border border-[#d2d2d7] w-full max-w-md mx-4 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#f5f5f7]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#f5f5f7] rounded-full flex items-center justify-center">
              <Phone className="w-5 h-5 text-[#1d1d1f]" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-[#1d1d1f]">Call Client</h2>
              <p className="text-sm text-[#86868b]">Outbound voice call</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-[#f5f5f7] rounded-xl transition-colors"
          >
            <X className="w-5 h-5 text-[#86868b]" />
          </button>
        </div>

        {/* Content */}
        <div className="px-6 py-5 space-y-5">
          {/* Client info */}
          <div className="flex items-center gap-3 bg-[#f5f5f7] rounded-xl px-4 py-3">
            <div className="w-10 h-10 bg-[#d2d2d7] rounded-full flex items-center justify-center">
              <span className="text-[#1d1d1f] font-semibold">
                {(clientName || 'A').charAt(0).toUpperCase()}
              </span>
            </div>
            <div>
              <p className="text-sm font-medium text-[#1d1d1f]">{clientName}</p>
              <p className="text-sm text-[#86868b]">{clientPhone}</p>
            </div>
          </div>

          {/* Call status indicator */}
          {callStatus !== 'idle' && (
            <div className={`flex items-center gap-3 rounded-xl px-4 py-3 ${
              callStatus === 'initiating' ? 'bg-amber-50' :
              callStatus === 'ringing' ? 'bg-blue-50' :
              callStatus === 'in-progress' ? 'bg-emerald-50' :
              callStatus === 'completed' ? 'bg-[#f5f5f7]' :
              'bg-red-50'
            }`}>
              {callStatus === 'initiating' && (
                <>
                  <Loader2 className="w-5 h-5 text-amber-600 animate-spin" />
                  <span className="text-sm font-medium text-amber-700">Initiating call...</span>
                </>
              )}
              {callStatus === 'ringing' && (
                <>
                  <PhoneCall className="w-5 h-5 text-blue-600 animate-pulse" />
                  <span className="text-sm font-medium text-blue-700">Ringing...</span>
                </>
              )}
              {callStatus === 'in-progress' && (
                <>
                  <PhoneCall className="w-5 h-5 text-emerald-600" />
                  <span className="text-sm font-medium text-emerald-700">Call in progress</span>
                </>
              )}
              {callStatus === 'completed' && (
                <>
                  <CheckCircle2 className="w-5 h-5 text-[#1d1d1f]" />
                  <span className="text-sm font-medium text-[#424245]">Call completed</span>
                </>
              )}
              {callStatus === 'error' && (
                <>
                  <PhoneOff className="w-5 h-5 text-red-600" />
                  <span className="text-sm font-medium text-red-700">{error || 'Call failed'}</span>
                </>
              )}
            </div>
          )}

          {/* Only show form fields when idle or error */}
          {(callStatus === 'idle' || callStatus === 'error') && (
            <>
              {/* Purpose selector */}
              <div>
                <label className="block text-sm font-medium text-[#424245] mb-2">
                  Call Purpose
                </label>
                <select
                  value={purpose}
                  onChange={(e) => setPurpose(e.target.value as CallPurpose)}
                  className="w-full px-4 py-2.5 text-sm border border-[#d2d2d7] rounded-xl bg-white text-[#1d1d1f] focus:ring-2 focus:ring-[#0066CC] focus:border-transparent"
                >
                  {Object.entries(PURPOSE_LABELS).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
                <p className="mt-1.5 text-xs text-[#86868b]">
                  {PURPOSE_DESCRIPTIONS[purpose]}
                </p>
              </div>

              {/* Custom message */}
              <div>
                <label className="block text-sm font-medium text-[#424245] mb-2">
                  Custom Message <span className="text-[#86868b] font-normal">(optional)</span>
                </label>
                <textarea
                  value={customMessage}
                  onChange={(e) => setCustomMessage(e.target.value)}
                  placeholder="Override the default greeting message..."
                  rows={3}
                  className="w-full px-4 py-2.5 text-sm border border-[#d2d2d7] rounded-xl resize-none bg-white text-[#1d1d1f] placeholder:text-[#86868b] focus:ring-2 focus:ring-[#0066CC] focus:border-transparent"
                />
              </div>
            </>
          )}

          {callId && (
            <p className="text-xs text-[#86868b]">
              Call ID: <span className="font-mono">{callId}</span>
            </p>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center gap-3 px-6 py-4 border-t border-[#f5f5f7] bg-[#f5f5f7]">
          {(callStatus === 'idle' || callStatus === 'error') && (
            <>
              <button
                onClick={onClose}
                className="flex-1 px-4 py-2.5 text-sm font-medium text-[#424245] bg-white border border-[#d2d2d7] rounded-xl hover:bg-[#f5f5f7] transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={startCall}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-white bg-[#1d1d1f] rounded-xl hover:bg-black transition-colors"
              >
                <Phone className="w-4 h-4" />
                Start Call
              </button>
            </>
          )}
          {(callStatus === 'initiating' || callStatus === 'ringing' || callStatus === 'in-progress') && (
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2.5 text-sm font-medium text-[#424245] bg-white border border-[#d2d2d7] rounded-xl hover:bg-[#f5f5f7] transition-colors"
            >
              Close (call continues in background)
            </button>
          )}
          {callStatus === 'completed' && (
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-[#1d1d1f] rounded-xl hover:bg-black transition-colors"
            >
              Done
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
