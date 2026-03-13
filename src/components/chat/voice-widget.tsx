'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { Mic, MicOff, Phone, PhoneOff, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

type CallStatus = 'idle' | 'connecting' | 'active' | 'ended'

interface VoiceWidgetProps {
  tenantId: string
  assistantId: string
  businessName: string
  embedded?: boolean
}

export function VoiceWidget({ tenantId, assistantId, businessName, embedded = false }: VoiceWidgetProps) {
  const [status, setStatus] = useState<CallStatus>('idle')
  const [isMuted, setIsMuted] = useState(false)
  const [duration, setDuration] = useState(0)
  const [isSpeaking, setIsSpeaking] = useState(false)
  const vapiRef = useRef<any>(null)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // Initialize Vapi instance lazily
  const getVapi = useCallback(async () => {
    if (vapiRef.current) return vapiRef.current

    const { default: Vapi } = await import('@vapi-ai/web')
    const publicKey = process.env.NEXT_PUBLIC_VAPI_PUBLIC_KEY
    const vapi = publicKey ? new Vapi(publicKey) : new Vapi(assistantId)
    vapiRef.current = vapi

    vapi.on('call-start', () => {
      setStatus('active')
      setDuration(0)
      timerRef.current = setInterval(() => {
        setDuration((d) => d + 1)
      }, 1000)
    })

    vapi.on('call-end', () => {
      setStatus('ended')
      setIsSpeaking(false)
      setIsMuted(false)
      if (timerRef.current) {
        clearInterval(timerRef.current)
        timerRef.current = null
      }
      setTimeout(() => setStatus('idle'), 2000)
    })

    vapi.on('speech-start', () => {
      setIsSpeaking(true)
    })

    vapi.on('speech-end', () => {
      setIsSpeaking(false)
    })

    vapi.on('error', (error: any) => {
      console.error('Vapi error:', error)
      setStatus('ended')
      setIsSpeaking(false)
      setIsMuted(false)
      if (timerRef.current) {
        clearInterval(timerRef.current)
        timerRef.current = null
      }
      setTimeout(() => setStatus('idle'), 2000)
    })

    return vapi
  }, [assistantId])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }
      if (vapiRef.current) {
        try {
          vapiRef.current.stop()
        } catch {
          // ignore cleanup errors
        }
      }
    }
  }, [])

  const startCall = async () => {
    try {
      setStatus('connecting')
      const vapi = await getVapi()
      await vapi.start(assistantId)
    } catch (error) {
      console.error('Failed to start call:', error)
      setStatus('ended')
      setTimeout(() => setStatus('idle'), 2000)
    }
  }

  const endCall = () => {
    if (vapiRef.current) {
      vapiRef.current.stop()
    }
  }

  const toggleMute = () => {
    if (vapiRef.current) {
      const newMuted = !isMuted
      vapiRef.current.setMuted(newMuted)
      setIsMuted(newMuted)
    }
  }

  const formatDuration = (seconds: number) => {
    const m = Math.floor(seconds / 60)
    const s = seconds % 60
    return `${m}:${s.toString().padStart(2, '0')}`
  }

  const positionClass = embedded ? '' : 'fixed bottom-24 right-6 z-50'

  // Idle state: floating mic button (or inline start button when embedded)
  if (status === 'idle') {
    if (embedded) {
      return (
        <button
          onClick={startCall}
          className="inline-flex items-center gap-2 px-6 py-3 bg-violet-600 text-white rounded-xl hover:bg-violet-700 transition-all hover:scale-105 shadow-lg shadow-violet-200 font-medium text-sm"
          aria-label={`Call ${businessName}`}
        >
          <Phone className="w-5 h-5" />
          Start Voice Call
        </button>
      )
    }

    return (
      <button
        onClick={startCall}
        className="fixed bottom-24 right-6 w-12 h-12 bg-violet-600 text-white rounded-full shadow-lg shadow-violet-200 hover:bg-violet-700 transition-all hover:scale-105 flex items-center justify-center z-50"
        aria-label={`Call ${businessName}`}
        title={`Call ${businessName}`}
      >
        <Phone className="w-5 h-5" />
      </button>
    )
  }

  // Connecting state
  if (status === 'connecting') {
    return (
      <div className={cn(positionClass, 'flex flex-col items-center gap-2')}>
        <div className={cn(
          'bg-white rounded-2xl border border-stone-200 px-6 py-4 flex flex-col items-center gap-3 min-w-[180px]',
          !embedded && 'shadow-2xl'
        )}>
          <div className="relative">
            <div className="w-14 h-14 bg-violet-100 rounded-full flex items-center justify-center">
              <Phone className="w-6 h-6 text-violet-600" />
            </div>
            <div className="absolute inset-0 w-14 h-14 bg-violet-200 rounded-full animate-ping opacity-40" />
          </div>
          <div className="flex items-center gap-2 text-sm text-stone-600">
            <Loader2 className="w-4 h-4 animate-spin text-violet-600" />
            <span>Connecting...</span>
          </div>
          <button
            onClick={endCall}
            className="text-xs text-stone-400 hover:text-stone-600 transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    )
  }

  // Active call state
  if (status === 'active') {
    return (
      <div className={positionClass}>
        <div className={cn(
          'bg-white rounded-2xl border border-stone-200 px-5 py-4 flex flex-col items-center gap-3 min-w-[200px]',
          !embedded && 'shadow-2xl'
        )}>
          {/* Waveform / speaking indicator */}
          <div className="relative flex items-center justify-center">
            <div
              className={cn(
                'w-16 h-16 rounded-full flex items-center justify-center transition-all duration-300',
                isSpeaking
                  ? 'bg-violet-100 ring-4 ring-violet-200'
                  : 'bg-stone-100'
              )}
            >
              <Mic
                className={cn(
                  'w-7 h-7 transition-colors',
                  isSpeaking ? 'text-violet-600' : 'text-stone-500'
                )}
              />
            </div>
            {/* Animated rings when speaking */}
            {isSpeaking && (
              <>
                <div className="absolute inset-0 w-16 h-16 m-auto bg-violet-200 rounded-full animate-ping opacity-20" />
                <div
                  className="absolute w-20 h-20 m-auto bg-violet-100 rounded-full animate-pulse opacity-30"
                  style={{ animationDuration: '1.5s' }}
                />
              </>
            )}
          </div>

          {/* Duration */}
          <div className="text-center">
            <p className="text-xs text-stone-500 font-medium">
              {isSpeaking ? 'AI Speaking...' : 'Listening...'}
            </p>
            <p className="text-lg font-semibold text-stone-900 tabular-nums">
              {formatDuration(duration)}
            </p>
          </div>

          {/* Call controls */}
          <div className="flex items-center gap-3">
            <button
              onClick={toggleMute}
              className={cn(
                'w-10 h-10 rounded-full flex items-center justify-center transition-colors',
                isMuted
                  ? 'bg-red-100 text-red-600 hover:bg-red-200'
                  : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
              )}
              aria-label={isMuted ? 'Unmute' : 'Mute'}
              title={isMuted ? 'Unmute' : 'Mute'}
            >
              {isMuted ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
            </button>
            <button
              onClick={endCall}
              className="w-12 h-12 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center transition-colors shadow-md"
              aria-label="End call"
              title="End call"
            >
              <PhoneOff className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    )
  }

  // Ended state
  return (
    <div className={positionClass}>
      <div className={cn(
        'bg-white rounded-2xl border border-stone-200 px-6 py-4 flex flex-col items-center gap-2 min-w-[180px]',
        !embedded && 'shadow-2xl'
      )}>
        <div className="w-12 h-12 bg-stone-100 rounded-full flex items-center justify-center">
          <PhoneOff className="w-5 h-5 text-stone-400" />
        </div>
        <p className="text-sm text-stone-500 font-medium">Call ended</p>
      </div>
    </div>
  )
}
