"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Plus, X } from "lucide-react"
import { usePostHog } from "posthog-js/react"

import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent } from "@/components/ui/card"
import {
  SearchableCombobox,
  ComboboxOption,
  ComboboxValue,
} from "@/components/searchable-combobox"
import { DateRangeInput } from "@/components/date-range-input"
import { useOnboarding, YMRoleEntry } from "@/contexts/OnboardingContext"
import { useOnboardingReference } from "@/contexts/OnboardingReferenceContext"
import {
  OnboardingLayout,
  OnboardingContent,
  OnboardingStepSkeleton,
  OnboardingErrorState,
} from "./components"


function createEmptyRole(): YMRoleEntry {
  return {
    id: crypto.randomUUID(),
    isCurrent: false,
  }
}

export default function Step3() {
  const router = useRouter()
  const posthog = usePostHog()
  const { data, updateData, saveStepInBackground, isLoading } = useOnboarding()
  const { roleTypes, users, isLoading: isLoadingData, error: loadError } = useOnboardingReference()

  // Initialize with one empty role entry or from context
  const [roles, setRoles] = useState<YMRoleEntry[]>(
    data.ymRoles?.length ? data.ymRoles : [createEmptyRole()]
  )

  // Sync state when data loads from Supabase (pre-fill)
  useEffect(() => {
    if (data.ymRoles?.length) {
      setRoles(data.ymRoles)
    }
  }, [data.ymRoles])

  // Convert role types to combobox options
  const roleOptions: ComboboxOption[] = roleTypes.map(rt => ({
    value: rt.id,
    label: rt.name,
  }))

  // Convert users to combobox options
  const userOptions: ComboboxOption[] = users.map(user => ({
    value: user.id,
    label: `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.email,
  }))

  // Validation: at least one role with required fields filled
  const isRoleValid = (role: YMRoleEntry): boolean => {
    const hasRole = Boolean(role.roleTypeId || role.roleTypeCustom)
    const hasStartDate = Boolean(role.startMonth && role.startYear)
    return hasRole && hasStartDate
  }

  const isValid = roles.length > 0 && roles.every(isRoleValid)

  const handleRoleChange = (index: number, updates: Partial<YMRoleEntry>) => {
    setRoles((prev) =>
      prev.map((role, i) => (i === index ? { ...role, ...updates } : role))
    )
  }

  const handleAddRole = () => {
    setRoles((prev) => [...prev, createEmptyRole()])
  }

  const handleRemoveRole = (index: number) => {
    setRoles((prev) => prev.filter((_, i) => i !== index))
  }

  const handleBack = () => {
    const stepData = { ymRoles: roles }
    updateData(stepData)
    saveStepInBackground(3, stepData)
    router.push("/onboarding?step=2")
  }

  const handleNext = () => {
    const stepData = { ymRoles: roles }
    updateData(stepData)
    saveStepInBackground(3, stepData)
    posthog?.capture('onboarding_step_completed', {
      step: 3,
      step_name: 'ym_roles',
      role_count: roles.length,
    })
    router.push("/onboarding?step=4")
  }

  const handleRoleTypeChange = (index: number, value: ComboboxValue | undefined) => {
    if (!value) {
      handleRoleChange(index, { roleTypeId: undefined, roleTypeCustom: undefined })
    } else if (value.type === "existing") {
      handleRoleChange(index, { roleTypeId: value.value, roleTypeCustom: undefined })
    } else {
      handleRoleChange(index, { roleTypeId: undefined, roleTypeCustom: value.value })
    }
  }

  const handleAmirChange = (index: number, value: ComboboxValue | undefined) => {
    if (!value) {
      handleRoleChange(index, { amirUserId: undefined, amirCustomName: undefined })
    } else if (value.type === "existing") {
      handleRoleChange(index, { amirUserId: value.value, amirCustomName: undefined })
    } else {
      handleRoleChange(index, { amirUserId: undefined, amirCustomName: value.value })
    }
  }

  const getRoleComboboxValue = (role: YMRoleEntry): ComboboxValue | undefined => {
    if (role.roleTypeId) {
      const option = roleOptions.find((r) => r.value === role.roleTypeId)
      return { type: "existing", value: role.roleTypeId, label: option?.label }
    }
    if (role.roleTypeCustom) {
      return { type: "custom", value: role.roleTypeCustom }
    }
    return undefined
  }

  const getAmirComboboxValue = (role: YMRoleEntry): ComboboxValue | undefined => {
    if (role.amirUserId) {
      const option = userOptions.find((a) => a.value === role.amirUserId)
      return { type: "existing", value: role.amirUserId, label: option?.label }
    }
    if (role.amirCustomName) {
      return { type: "custom", value: role.amirCustomName }
    }
    return undefined
  }

  // Show loading state while fetching data
  if (isLoadingData) {
    return <OnboardingStepSkeleton />
  }

  // Show error state if data failed to load
  if (loadError) {
    return (
      <OnboardingErrorState
        message={loadError}
        onRetry={() => window.location.reload()}
      />
    )
  }

  return (
    <OnboardingLayout
      step={3}
      isValid={isValid}
      isLoading={isLoading}
      onBack={handleBack}
      onNext={handleNext}
    >
      <OnboardingContent
        title="What YM roles have you held?"
        subtitle="Tell us about your experience in the organization"
        centered={false}
        maxWidth="max-w-2xl"
      >
        {/* Role Entries */}
        <div className="space-y-4">
          {roles.map((role, index) => (
            <Card key={role.id} className="relative">
              {roles.length > 1 && (
                <button
                  onClick={() => handleRemoveRole(index)}
                  className="absolute right-3 top-3 p-1 rounded-sm hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  aria-label="Remove role"
                >
                  <X className="h-4 w-4 text-muted-foreground" />
                </button>
              )}
              <CardContent className="pt-6 space-y-4">
                {/* Role Type */}
                <div className="space-y-1.5">
                  <Label>Role</Label>
                  <SearchableCombobox
                    options={roleOptions}
                    value={getRoleComboboxValue(role)}
                    onChange={(value) => handleRoleTypeChange(index, value)}
                    placeholder="Select or add a role"
                    searchPlaceholder="Search roles..."
                    allowCustom
                  />
                </div>

                {/* Amir/Manager */}
                <div className="space-y-1.5">
                  <Label>Amir / Manager</Label>
                  <SearchableCombobox
                    options={userOptions}
                    value={getAmirComboboxValue(role)}
                    onChange={(value) => handleAmirChange(index, value)}
                    placeholder="Select or add a person"
                    searchPlaceholder="Search people..."
                    allowCustom
                  />
                </div>

                {/* Date Range */}
                <div className="space-y-1.5">
                  <Label>Date Range</Label>
                  <DateRangeInput
                    startMonth={role.startMonth}
                    startYear={role.startYear}
                    endMonth={role.endMonth}
                    endYear={role.endYear}
                    isCurrent={role.isCurrent}
                    onChange={(values) => handleRoleChange(index, values)}
                    currentLabel="I currently hold this role"
                  />
                </div>

                {/* Description */}
                <div className="space-y-1.5">
                  <Label>What did you do? (optional)</Label>
                  <Textarea
                    value={role.description ?? ""}
                    onChange={(e) =>
                      handleRoleChange(index, { description: e.target.value })
                    }
                    placeholder="Describe your responsibilities and achievements..."
                    rows={3}
                  />
                </div>
              </CardContent>
            </Card>
          ))}

          {/* Add Another Button */}
          <Button
            variant="outline"
            onClick={handleAddRole}
            className="w-full"
          >
            <Plus className="mr-2 h-4 w-4" />
            Add another role
          </Button>
        </div>
      </OnboardingContent>
    </OnboardingLayout>
  )
}
