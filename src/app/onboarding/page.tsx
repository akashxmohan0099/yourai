'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { BasicInfoStep } from '@/components/onboarding/basic-info-step'
import { FeaturesStep } from '@/components/onboarding/features-step'
import { TellAiStep } from '@/components/onboarding/tell-ai-step'
import { SummaryStep } from '@/components/onboarding/summary-step'
import { Check, Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { BusinessTypeTemplate, FeatureKey } from '@/lib/onboarding/business-type-templates'
import { getTemplateById } from '@/lib/onboarding/business-type-templates'

const STEPS = [
  { id: 1, name: 'Basics', description: 'Tell us about your business' },
  { id: 2, name: 'Features', description: 'What do you need?' },
  { id: 3, name: 'Teach AI', description: 'Tell our AI about your business' },
  { id: 4, name: 'Review', description: 'Review and launch' },
]

export default function OnboardingPage() {
  const [currentStep, setCurrentStep] = useState(1)
  const [tenantId, setTenantId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedTemplate, setSelectedTemplate] = useState<BusinessTypeTemplate | null>(null)
  const [selectedFeatures, setSelectedFeatures] = useState<FeatureKey[]>([])
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
        .select('tenant_id, tenants(status, business_type)')
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

      // Restore template if already selected
      const businessType = (profile.tenants as any)?.business_type
      if (businessType) {
        const template = getTemplateById(businessType)
        if (template) setSelectedTemplate(template)
      }

      setTenantId(profile.tenant_id)
      setLoading(false)
    }
    loadTenant()
  }, [router, supabase])

  const handleNext = () => {
    if (currentStep < 4) setCurrentStep(currentStep + 1)
  }

  const handleBack = () => {
    if (currentStep > 1) setCurrentStep(currentStep - 1)
  }

  const handleTemplateSelect = (template: BusinessTypeTemplate) => {
    setSelectedTemplate(template)
    setSelectedFeatures(template.defaultFeatures)
  }

  const handleComplete = async () => {
    if (!tenantId) return

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

  return (
    <div className="min-h-screen bg-stone-50">
      <div className="max-w-4xl mx-auto px-4 py-10">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-violet-100 mb-4">
            <Sparkles className="w-7 h-7 text-violet-600" />
          </div>
          <h1 className="text-2xl font-semibold text-stone-900 mb-2">
            Let&apos;s set up your AI assistant
          </h1>
          <p className="text-stone-500 text-lg">
            A few quick steps and your business gets a 24/7 AI team member
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
                    'w-16 sm:w-24 h-1 mx-2 rounded-full transition-colors duration-200',
                    currentStep > step.id ? 'bg-violet-600' : 'bg-stone-200'
                  )}
                />
              )}
            </div>
          ))}
        </div>

        {/* Step content */}
        <div className="bg-white rounded-2xl shadow-sm border border-stone-200 p-8">
          {currentStep === 1 && tenantId && (
            <BasicInfoStep
              tenantId={tenantId}
              selectedTemplate={selectedTemplate}
              onTemplateSelect={handleTemplateSelect}
              onNext={handleNext}
            />
          )}
          {currentStep === 2 && tenantId && (
            <FeaturesStep
              tenantId={tenantId}
              selectedFeatures={selectedFeatures}
              onFeaturesChange={setSelectedFeatures}
              onNext={handleNext}
              onBack={handleBack}
            />
          )}
          {currentStep === 3 && tenantId && (
            <TellAiStep
              tenantId={tenantId}
              template={selectedTemplate}
              onNext={handleNext}
              onBack={handleBack}
            />
          )}
          {currentStep === 4 && tenantId && (
            <SummaryStep
              tenantId={tenantId}
              template={selectedTemplate}
              features={selectedFeatures}
              onComplete={handleComplete}
              onBack={handleBack}
              onEditStep={setCurrentStep}
            />
          )}
        </div>

        <p className="text-center text-sm text-stone-400 mt-6">
          You can always change these settings later
        </p>
      </div>
    </div>
  )
}
