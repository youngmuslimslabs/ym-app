// Onboarding configuration
// Single source of truth for step count and progress calculation

export const ONBOARDING_TOTAL_STEPS = 7

export function calculateProgress(currentStep: number): number {
  return (currentStep / ONBOARDING_TOTAL_STEPS) * 100
}
