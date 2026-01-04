// Onboarding configuration
// Single source of truth for step count and progress calculation

import type { ComboboxOption } from "@/components/searchable-combobox"

export const ONBOARDING_TOTAL_STEPS = 7

export function calculateProgress(currentStep: number): number {
  return (currentStep / ONBOARDING_TOTAL_STEPS) * 100
}

// TODO: Fetch from Supabase users table
// Placeholder data for Amir/Manager selection in steps 3 and 4
export const PLACEHOLDER_AMIRS: ComboboxOption[] = [
  { value: "user-1", label: "Ahmed Hassan" },
  { value: "user-2", label: "Fatima Al-Said" },
  { value: "user-3", label: "Omar Khan" },
  { value: "user-4", label: "Yasmin Ibrahim" },
  { value: "user-5", label: "Khalid Mohammed" },
]
