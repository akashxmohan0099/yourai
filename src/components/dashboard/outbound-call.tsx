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
      <div className="relative bg-white rounded-2xl shadow-xl border border-stone-200 w-full max-w-md mx-4 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-stone-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-violet-100 rounded-full flex items-center justify-center">
              <Phone className="w-5 h-5 text-violet-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-stone-900">Call Client</h2>
              <p className="text-sm text-stone-500">Outbound voice call</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-stone-100 rounded-xl transition-colors"
          >
            <X className="w-5 h-5 text-stone-400" />
          </button>
        </div>

        {/* Content */}
        <div className="px-6 py-5 space-y-5">
          {/* Client info */}
          <div className="flex items-center gap-3 bg-stone-50 rounded-xl px-4 py-3">
            <div className="w-10 h-10 bg-violet-100 rounded-full flex items-center justify-center">
              <span className="text-violet-600 font-semibold">
                {(clientName || 'A').charAt(0).toUpperCase()}
              </span>
            </div>
            <div>
              <p className="text-sm font-medium text-stone-900">{clientName}</p>
              <p className="text-sm text-stone-500">{clientPhone}</p>
            </div>
          </div>

          {/* Call status indicator */}
          {callStatus !== 'idle' && (
            <div className={`flex items-center gap-3 rounded-xl px-4 py-3 ${
              callStatus === 'initiating' ? 'bg-amber-50' :
              callStatus === 'ringing' ? 'bg-blue-50' :
              callStatus === 'in-progress' ? 'bg-emerald-50' :
              callStatus === 'completed' ? 'bg-violet-50' :
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
                  <CheckCircle2 className="w-5 h-5 text-violet-600" />
                  <span className="text-sm font-medium text-violet-700">Call completed</span>
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
                <label className="block text-sm font-medium text-stone-700 mb-2">
                  Call Purpose
                </label>
                <select
                  value={purpose}
                  onChange={(e) => setPurpose(e.target.value as CallPurpose)}
                  className="w-full px-4 py-2.5 text-sm border border-stone-300 rounded-xl bg-white text-stone-900 focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                >
                  {Object.entries(PURPOSE_LABELS).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
                <p className="mt-1.5 text-xs text-stone-400">
                  {PURPOSE_DESCRIPTIONS[purpose]}
                </p>
              </div>

              {/* Custom message */}
              <div>
                <label className="block text-sm font-medium text-stone-700 mb-2">
                  Custom Message <span className="text-stone-400 font-normal">(optional)</span>
                </label>
                <textarea
                  value={customMessage}
                  onChange={(e) => setCustomMessage(e.target.value)}
                  placeholder="Override the default greeting message..."
                  rows={3}
                  className="w-full px-4 py-2.5 text-sm border border-stone-300 rounded-xl resize-none bg-white text-stone-900 placeholder:text-stone-400 focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                />
              </div>
            </>
          )}

          {callId && (
            <p className="text-xs text-stone-400">
              Call ID: <span className="font-mono">{callId}</span>
            </p>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center gap-3 px-6 py-4 border-t border-stone-100 bg-stone-50">
          {(callStatus === 'idle' || callStatus === 'error') && (
            <>
              <button
                onClick={onClose}
                className="flex-1 px-4 py-2.5 text-sm font-medium text-stone-700 bg-white border border-stone-300 rounded-xl hover:bg-stone-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={startCall}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-white bg-violet-600 rounded-xl hover:bg-violet-700 transition-colors"
              >
                <Phone className="w-4 h-4" />
                Start Call
              </button>
            </>
          )}
          {(callStatus === 'initiating' || callStatus === 'ringing' || callStatus === 'in-progress') && (
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2.5 text-sm font-medium text-stone-600 bg-white border border-stone-300 rounded-xl hover:bg-stone-50 transition-colors"
            >
              Close (call continues in background)
            </button>
          )}
          {callStatus === 'completed' && (
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-violet-600 rounded-xl hover:bg-violet-700 transition-colors"
            >
              Done
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
