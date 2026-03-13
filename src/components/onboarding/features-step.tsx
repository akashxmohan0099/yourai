'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { ALL_FEATURES, type FeatureKey } from '@/lib/onboarding/business-type-templates'
import { cn } from '@/lib/utils'
import * as Icons from 'lucide-react'

interface FeaturesStepProps {
  tenantId: string
  selectedFeatures: FeatureKey[]
  onFeaturesChange: (features: FeatureKey[]) => void
  onNext: () => void
  onBack: () => void
}

function getIcon(iconName: string) {
  const map: Record<string, any> = {
    Phone: Icons.Phone,
    Calendar: Icons.Calendar,
    FileText: Icons.FileText,
    CreditCard: Icons.CreditCard,
    MessageSquare: Icons.MessageSquare,
    Mail: Icons.Mail,
    Users: Icons.Users,
    Bell: Icons.Bell,
    Star: Icons.Star,
    Sunrise: Icons.Sunrise,
  }
  return map[iconName] || Icons.Circle
}

export function FeaturesStep({ tenantId, selectedFeatures, onFeaturesChange, onNext, onBack }: FeaturesStepProps) {
  const [saving, setSaving] = useState(false)
  const supabase = createClient()

  const toggleFeature = (key: FeatureKey) => {
    if (key === 'ai_receptionist') return // Always on
    if (selectedFeatures.includes(key)) {
      onFeaturesChange(selectedFeatures.filter((f) => f !== key))
    } else {
      onFeaturesChange([...selectedFeatures, key])
    }
  }

  const handleSubmit = async () => {
    setSaving(true)

    // Ensure ai_receptionist is always included
    const features = selectedFeatures.includes('ai_receptionist')
      ? selectedFeatures
      : ['ai_receptionist' as FeatureKey, ...selectedFeatures]

    await supabase
      .from('business_config')
      .update({ enabled_features: features })
      .eq('tenant_id', tenantId)

    setSaving(false)
    onNext()
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-[#1d1d1f]">What do you need for your business?</h2>
        <p className="text-sm text-[#86868b] mt-1">Select the features you want. You can change these anytime.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {ALL_FEATURES.map((feature) => {
          const IconComponent = getIcon(feature.icon)
          const isSelected = selectedFeatures.includes(feature.key) || feature.key === 'ai_receptionist'
          const isLocked = feature.key === 'ai_receptionist'

          return (
            <button
              key={feature.key}
              type="button"
              onClick={() => toggleFeature(feature.key)}
              className={cn(
                'flex items-start gap-3 p-4 rounded-2xl border text-left transition-colors',
                isSelected
                  ? 'border-[#1d1d1f] bg-[#f5f5f7]/50'
                  : 'border-[#d2d2d7] hover:border-[#86868b] hover:bg-[#f5f5f7]',
                isLocked && 'cursor-default opacity-90'
              )}
            >
              <div className={cn(
                'w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0',
                isSelected ? 'bg-[#f5f5f7]' : 'bg-[#f5f5f7]'
              )}>
                <IconComponent className={cn('w-4 h-4', isSelected ? 'text-[#1d1d1f]' : 'text-[#86868b]')} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className={cn('font-medium text-sm', isSelected ? 'text-[#1d1d1f]' : 'text-[#1d1d1f]')}>
                    {feature.label}
                  </span>
                  {isLocked && (
                    <span className="text-[11px] bg-[#f5f5f7] text-[#1d1d1f] px-1.5 py-0.5 rounded font-medium">
                      Always on
                    </span>
                  )}
                </div>
                <p className="text-xs text-[#86868b] mt-0.5 leading-relaxed">{feature.description}</p>
              </div>
              {!isLocked && (
                <div className={cn(
                  'w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 mt-0.5 transition-colors',
                  isSelected
                    ? 'border-[#1d1d1f] bg-[#1d1d1f]'
                    : 'border-[#d2d2d7]'
                )}>
                  {isSelected && <Icons.Check className="w-3 h-3 text-white" />}
                </div>
              )}
              {isLocked && (
                <div className="w-4 h-4 rounded border border-[#d2d2d7] bg-[#f5f5f7] flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Icons.Check className="w-3 h-3 text-[#1d1d1f]" />
                </div>
              )}
            </button>
          )
        })}
      </div>

      <div className="flex justify-between pt-2 border-t border-[#f5f5f7]">
        <button
          type="button"
          onClick={onBack}
          className="px-5 py-2 text-sm font-medium text-[#1d1d1f] hover:text-black hover:bg-[#f5f5f7] rounded-xl transition-colors"
        >
          Back
        </button>
        <button
          onClick={handleSubmit}
          disabled={saving}
          className="px-6 py-2 bg-[#1d1d1f] text-white text-sm font-medium rounded-xl hover:bg-black disabled:opacity-50 transition-colors"
        >
          {saving ? 'Saving...' : 'Continue'}
        </button>
      </div>
    </div>
  )
}
