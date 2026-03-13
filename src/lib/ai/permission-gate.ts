import { BusinessContext } from './context-builder'

export interface PermissionResult {
  allowed: boolean
  reason?: string
  requiresApproval?: boolean
}

export function checkPermission(
  toolName: string,
  toolInput: Record<string, unknown>,
  rules: BusinessContext['rules']
): PermissionResult {
  // Check hard boundaries first
  const hardRules = rules.filter(
    (r) =>
      r.ruleType === 'hard_boundary' &&
      (r.toolScope.length === 0 || r.toolScope.includes(toolName))
  )

  for (const rule of hardRules) {
    const violation = evaluateRule(rule, toolName, toolInput)
    if (violation) {
      return {
        allowed: false,
        reason: `Blocked by business rule: ${rule.rule}`,
      }
    }
  }

  // Check soft guidelines (these may require approval)
  const softRules = rules.filter(
    (r) =>
      r.ruleType === 'soft_guideline' &&
      (r.toolScope.length === 0 || r.toolScope.includes(toolName))
  )

  for (const rule of softRules) {
    const violation = evaluateRule(rule, toolName, toolInput)
    if (violation) {
      return {
        allowed: false,
        requiresApproval: true,
        reason: `Requires approval: ${rule.rule}`,
      }
    }
  }

  return { allowed: true }
}

function evaluateRule(
  rule: BusinessContext['rules'][0],
  toolName: string,
  toolInput: Record<string, unknown>
): boolean {
  // Rule evaluation logic
  // For now, we do keyword-based matching against tool inputs
  // More sophisticated rule evaluation can be added later

  const ruleText = rule.rule.toLowerCase()
  const inputStr = JSON.stringify(toolInput).toLowerCase()

  // Check for discount-related rules
  if (ruleText.includes('no discount') || ruleText.includes('no free')) {
    if (
      inputStr.includes('discount') ||
      inputStr.includes('free') ||
      inputStr.includes('complimentary')
    ) {
      return true
    }
  }

  // Check for price-related rules
  if (ruleText.includes('minimum price') || ruleText.includes('price floor')) {
    // Would need price checking logic specific to the rule
    return false
  }

  return false
}
