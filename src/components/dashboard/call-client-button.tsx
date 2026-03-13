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
        className="p-2.5 hover:bg-[#f5f5f7] bg-white border border-[#d2d2d7] rounded-xl transition-colors group"
        title="Call client"
      >
        <Phone className="w-5 h-5 text-[#86868b] group-hover:text-[#1d1d1f] transition-colors" />
      </button>

      <OutboundCallModal
        open={showModal}
        onClose={() => setShowModal(false)}
        clientId={clientId}
        clientName={clientName}
        clientPhone={clientPhone}
      />
    </>
  )
}
