'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { BusinessInfoStep } from '@/components/onboarding/business-info-step'
import { ServicesStep } from '@/components/onboarding/services-step'
import { HoursStep } from '@/components/onboarding/hours-step'
import { FaqsStep } from '@/components/onboarding/faqs-step'
import { ToneStep } from '@/components/onboarding/tone-step'
import { Check } from 'lucide-react'
import { cn } from '@/lib/utils'

const STEPS = [
  { id: 1, name: 'Business Info', description: 'Basic details about your business' },
  { id: 2, name: 'Services', description: 'What you offer and pricing' },
  { id: 3, name: 'Hours', description: 'When you\'re open' },
  { id: 4, name: 'FAQs', description: 'Common customer questions' },
  { id: 5, name: 'AI Tone', description: 'How your AI should sound' },
]

export default function OnboardingPage() {
  const [currentStep, setCurrentStep] = useState(1)
  const [tenantId, setTenantId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    async function loadTenant() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
        return
      }

      const { data: profile } = await supabase
        .from('user_profiles')
        .select('tenant_id, tenants(status)')
        .eq('auth_user_id', user.id)
        .single()

      if (!profile) {
        router.push('/signup')
        return
      }

      if ((profile.tenants as any)?.status === 'active') {
        router.push('/dashboard')
        return
      }

      setTenantId(profile.tenant_id)
      setLoading(false)
    }
    loadTenant()
  }, [router, supabase])

  const handleNext = () => {
    if (currentStep < 5) {
      setCurrentStep(currentStep + 1)
    }
  }

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleComplete = async () => {
    if (!tenantId) return

    // Activate tenant
    const res = await fetch('/api/onboarding/complete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tenantId }),
    })

    if (res.ok) {
      router.push('/dashboard')
      router.refresh()
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Set up your AI assistant</h1>
          <p className="text-gray-600 mt-1">Let's get your business ready in a few quick steps</p>
        </div>

        {/* Step indicator */}
        <div className="flex items-center justify-center mb-8">
          {STEPS.map((step, index) => (
            <div key={step.id} className="flex items-center">
              <div className="flex flex-col items-center">
                <div
                  className={cn(
                    'w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors',
                    currentStep > step.id
                      ? 'bg-blue-600 text-white'
                      : currentStep === step.id
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-200 text-gray-500'
                  )}
                >
                  {currentStep > step.id ? (
                    <Check className="w-4 h-4" />
                  ) : (
                    step.id
                  )}
                </div>
                <span className="text-xs text-gray-500 mt-1 hidden sm:block">
                  {step.name}
                </span>
              </div>
              {index < STEPS.length - 1 && (
                <div
                  className={cn(
                    'w-12 sm:w-20 h-0.5 mx-1',
                    currentStep > step.id ? 'bg-blue-600' : 'bg-gray-200'
                  )}
                />
              )}
            </div>
          ))}
        </div>

        {/* Step content */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          {currentStep === 1 && tenantId && (
            <BusinessInfoStep tenantId={tenantId} onNext={handleNext} />
          )}
          {currentStep === 2 && tenantId && (
            <ServicesStep tenantId={tenantId} onNext={handleNext} onBack={handleBack} />
          )}
          {currentStep === 3 && tenantId && (
            <HoursStep tenantId={tenantId} onNext={handleNext} onBack={handleBack} />
          )}
          {currentStep === 4 && tenantId && (
            <FaqsStep tenantId={tenantId} onNext={handleNext} onBack={handleBack} />
          )}
          {currentStep === 5 && tenantId && (
            <ToneStep tenantId={tenantId} onComplete={handleComplete} onBack={handleBack} />
          )}
        </div>
      </div>
    </div>
  )
}
