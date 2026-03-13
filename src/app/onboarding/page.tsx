'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { BasicInfoStep } from '@/components/onboarding/basic-info-step'
import { FeaturesStep } from '@/components/onboarding/features-step'
import { TellAiStep } from '@/components/onboarding/tell-ai-step'
import { SummaryStep } from '@/components/onboarding/summary-step'
import { Check } from 'lucide-react'
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
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="animate-spin rounded-full h-6 w-6 border-2 border-[#d2d2d7] border-t-[#1d1d1f]" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Top bar */}
      <div className="border-b border-[#d2d2d7]">
        <div className="max-w-3xl mx-auto px-6 py-4 flex items-center justify-between">
          <span className="text-lg font-semibold text-[#1d1d1f] tracking-tight">YourAI</span>
          <span className="text-sm text-[#86868b]">Step {currentStep} of {STEPS.length}</span>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-6 py-10">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-semibold text-[#1d1d1f] tracking-tight">
            Set up your business
          </h1>
          <p className="text-[#86868b] mt-1">
            Configure your AI assistant in a few quick steps.
          </p>
        </div>

        {/* Step indicator */}
        <div className="flex items-start justify-between mb-10">
          {STEPS.map((step, index) => (
            <div key={step.id} className="flex items-center flex-1 last:flex-none">
              <div className="flex flex-col items-center">
                <div
                  className={cn(
                    'w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors',
                    currentStep > step.id
                      ? 'bg-[#1d1d1f] text-white'
                      : currentStep === step.id
                      ? 'bg-[#1d1d1f] text-white'
                      : 'bg-[#f5f5f7] text-[#86868b] border border-[#d2d2d7]'
                  )}
                >
                  {currentStep > step.id ? (
                    <Check className="w-4 h-4" />
                  ) : (
                    step.id
                  )}
                </div>
                <span className={cn(
                  'text-xs mt-2 font-medium hidden sm:block',
                  currentStep === step.id
                    ? 'text-[#1d1d1f]'
                    : currentStep > step.id
                    ? 'text-[#1d1d1f]'
                    : 'text-[#86868b]'
                )}>
                  {step.name}
                </span>
              </div>
              {index < STEPS.length - 1 && (
                <div
                  className={cn(
                    'flex-1 h-px mx-3 mt-4 sm:mt-4 transition-colors',
                    currentStep > step.id ? 'bg-[#1d1d1f]' : 'bg-[#d2d2d7]'
                  )}
                />
              )}
            </div>
          ))}
        </div>

        {/* Step content */}
        <div className="bg-white border border-[#d2d2d7] rounded-2xl p-6 sm:p-8">
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

        <p className="text-center text-sm text-[#86868b] mt-6">
          You can change these later in Settings.
        </p>
      </div>
    </div>
  )
}
