'use client'

import { useState } from 'react'
import { MessageCircle, Phone } from 'lucide-react'
import { ChatWidget } from './chat-widget'
import { VoiceWidget } from './voice-widget'
import { cn } from '@/lib/utils'

interface CommunicationHubProps {
  tenantId: string
  businessName: string
  voiceEnabled: boolean
  assistantId?: string
  embedded?: boolean
}

export function CommunicationHub({
  tenantId,
  businessName,
  voiceEnabled,
  assistantId,
  embedded = false,
}: CommunicationHubProps) {
  const [activeTab, setActiveTab] = useState<'chat' | 'call'>('chat')
  const showVoice = voiceEnabled && !!assistantId

  // If voice is not available, just render the chat widget directly
  if (!showVoice) {
    return <ChatWidget tenantId={tenantId} businessName={businessName} embedded={embedded} />
  }

  if (embedded) {
    return (
      <div className="flex flex-col h-screen">
        {/* Tab bar */}
        <div className="flex bg-white border-b border-[#d2d2d7]">
          <button
            onClick={() => setActiveTab('chat')}
            className={cn(
              'flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium transition-colors',
              activeTab === 'chat'
                ? 'text-[#1d1d1f] border-b-2 border-[#1d1d1f] bg-[#f5f5f7]/50'
                : 'text-[#86868b] hover:text-[#424245] hover:bg-[#f5f5f7]'
            )}
          >
            <MessageCircle className="w-4 h-4" />
            Chat
          </button>
          <button
            onClick={() => setActiveTab('call')}
            className={cn(
              'flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium transition-colors',
              activeTab === 'call'
                ? 'text-[#1d1d1f] border-b-2 border-[#1d1d1f] bg-[#f5f5f7]/50'
                : 'text-[#86868b] hover:text-[#424245] hover:bg-[#f5f5f7]'
            )}
          >
            <Phone className="w-4 h-4" />
            Call
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 min-h-0">
          {activeTab === 'chat' ? (
            <ChatWidget tenantId={tenantId} businessName={businessName} embedded />
          ) : (
            <EmbeddedVoicePanel
              tenantId={tenantId}
              assistantId={assistantId}
              businessName={businessName}
            />
          )}
        </div>
      </div>
    )
  }

  // Non-embedded (floating widget) mode:
  // Show chat widget as main + voice button as secondary FAB
  return (
    <>
      <ChatWidget tenantId={tenantId} businessName={businessName} />
      <VoiceWidget
        tenantId={tenantId}
        assistantId={assistantId}
        businessName={businessName}
      />
    </>
  )
}

/**
 * Embedded voice panel shown when the "Call" tab is selected
 * in full-page embedded mode.
 */
function EmbeddedVoicePanel({
  tenantId,
  assistantId,
  businessName,
}: {
  tenantId: string
  assistantId: string
  businessName: string
}) {
  return (
    <div className="h-full flex flex-col items-center justify-center bg-[#f5f5f7] p-8">
      <div className="text-center max-w-sm">
        <div className="w-16 h-16 bg-[#f5f5f7] border border-[#d2d2d7] rounded-full flex items-center justify-center mx-auto mb-4">
          <Phone className="w-7 h-7 text-[#1d1d1f]" />
        </div>
        <h3 className="text-lg font-semibold text-[#1d1d1f] mb-1">
          Call {businessName}
        </h3>
        <p className="text-sm text-[#86868b] mb-6">
          Start a voice call with our AI assistant. You can ask questions, book
          appointments, and more -- all by voice.
        </p>
        {/* Render the VoiceWidget inline -- it handles its own state */}
        <VoiceWidget
          tenantId={tenantId}
          assistantId={assistantId}
          businessName={businessName}
          embedded
        />
      </div>
    </div>
  )
}
