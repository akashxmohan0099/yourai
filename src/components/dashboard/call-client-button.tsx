'use client'

import { useState } from 'react'
import { Phone } from 'lucide-react'
import { OutboundCallModal } from './outbound-call'

interface CallClientButtonProps {
  clientId: string
  clientName: string
  clientPhone: string
  voiceEnabled: boolean
}

export function CallClientButton({
  clientId,
  clientName,
  clientPhone,
  voiceEnabled,
}: CallClientButtonProps) {
  const [showModal, setShowModal] = useState(false)

  if (!voiceEnabled || !clientPhone) return null

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        className="btn-primary"
        title="Call client"
      >
        <Phone className="h-4 w-4" />
        Call client
      </button>

      <OutboundCallModal
        key={`${clientId}-${showModal ? 'open' : 'closed'}`}
        open={showModal}
        onClose={() => setShowModal(false)}
        clientId={clientId}
        clientName={clientName}
        clientPhone={clientPhone}
      />
    </>
  )
}
