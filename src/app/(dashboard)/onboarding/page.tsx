'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { BusinessInfoStep } from '@/components/onboarding/business-info-step'
import { ServicesStep } from '@/components/onboarding/services-step'
import { HoursStep } from '@/components/onboarding/hours-step'
import { FaqsStep } from '@/components/onboarding/faqs-step'
import { ToneStep } from '@/components/onboarding/tone-step'
import { Check, Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'

const STEPS = [
  { id: 1, name: 'Business Info', description: 'Tell us about your business' },
  { id: 2, name: 'Services', description: 'What you offer and pricing' },
  { id: 3, name: 'Hours', description: 'When you\'re available' },
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
      <div className="min-h-screen flex items-center justify-center bg-stone-50">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-violet-600" />
      </div>
    )
  }

  const currentStepInfo = STEPS.find(s => s.id === currentStep)

  return (
    <div className="min-h-screen bg-stone-50">
      <div className="max-w-3xl mx-auto px-4 py-10">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-violet-100 mb-4">
            <Sparkles className="w-7 h-7 text-violet-600" />
          </div>
          <h1 className="text-2xl font-semibold text-stone-900 mb-2">
            Welcome! Let&apos;s set up your AI assistant
          </h1>
          <p className="text-stone-500 text-lg">
            Just a few quick steps and you&apos;ll be ready to go
          </p>
        </div>

        {/* Step indicator */}
        <div className="flex items-center justify-center mb-10">
          {STEPS.map((step, index) => (
            <div key={step.id} className="flex items-center">
              <div className="flex flex-col items-center">
                <div
                  className={cn(
                    'w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold transition-all duration-200',
                    currentStep > step.id
                      ? 'bg-violet-600 text-white shadow-md shadow-violet-200'
                      : currentStep === step.id
                      ? 'bg-violet-600 text-white shadow-md shadow-violet-200 ring-4 ring-violet-100'
                      : 'bg-stone-200 text-stone-500'
                  )}
                >
                  {currentStep > step.id ? (
                    <Check className="w-5 h-5" />
                  ) : (
                    step.id
                  )}
                </div>
                <span className={cn(
                  'text-xs mt-2 hidden sm:block font-medium',
                  currentStep >= step.id ? 'text-violet-600' : 'text-stone-400'
                )}>
                  {step.name}
                </span>
              </div>
              {index < STEPS.length - 1 && (
                <div
                  className={cn(
                    'w-12 sm:w-20 h-1 mx-2 rounded-full transition-colors duration-200',
                    currentStep > step.id ? 'bg-violet-600' : 'bg-stone-200'
                  )}
                />
              )}
            </div>
          ))}
        </div>

        {/* Step progress text */}
        <div className="text-center mb-6">
          <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-violet-100 text-violet-700 text-sm font-medium">
            Step {currentStep} of 5
          </span>
        </div>

        {/* Step content */}
        <div className="bg-white rounded-2xl shadow-sm border border-stone-200 p-8">
          {currentStepInfo && (
            <div className="mb-6">
              <h2 className="text-xl font-semibold text-stone-900 mb-1">
                {currentStepInfo.description}
              </h2>
              <p className="text-stone-500">
                {currentStep === 1 && 'Share the basics so your AI knows who it represents.'}
                {currentStep === 2 && 'List what you offer so your AI can answer questions and create quotes.'}
                {currentStep === 3 && 'Set your working hours so your AI can schedule appointments correctly.'}
                {currentStep === 4 && 'Add common questions so your AI can respond instantly.'}
                {currentStep === 5 && 'Choose a personality that matches your brand.'}
              </p>
            </div>
          )}

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

        {/* Friendly footer */}
        <p className="text-center text-sm text-stone-400 mt-6">
          You can always change these settings later
        </p>
      </div>
    </div>
  )
}
