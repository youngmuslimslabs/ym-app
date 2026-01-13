"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Loader2, Plus, X } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent } from "@/components/ui/card"
import {
  SearchableCombobox,
  ComboboxOption,
  ComboboxValue,
} from "@/components/searchable-combobox"
import { DateRangeInput } from "@/components/date-range-input"
import { useOnboarding, YMRoleEntry } from "@/contexts/OnboardingContext"
import { calculateProgress } from "./constants"
import { fetchRoleTypes, type RoleType } from "@/lib/supabase/queries/roles"
import { fetchCompletedUsers, type UserOption } from "@/lib/supabase/queries/users"


function createEmptyRole(): YMRoleEntry {
  return {
    id: crypto.randomUUID(),
    isCurrent: false,
  }
}

export default function Step3() {
  const router = useRouter()
  const { data, updateData, saveStepData, isSaving, isLoading } = useOnboarding()

  // Initialize with one empty role entry or from context
  const [roles, setRoles] = useState<YMRoleEntry[]>(
    data.ymRoles?.length ? data.ymRoles : [createEmptyRole()]
  )
  const [saveError, setSaveError] = useState<string | null>(null)

  // Fetch role types and users from Supabase
  const [roleTypes, setRoleTypes] = useState<RoleType[]>([])
  const [users, setUsers] = useState<UserOption[]>([])
  const [isLoadingData, setIsLoadingData] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)

  // Fetch role types and users on mount
  useEffect(() => {
    const loadData = async () => {
      setIsLoadingData(true)
      setLoadError(null)

      const [roleTypesResult, usersResult] = await Promise.all([
        fetchRoleTypes(),
        fetchCompletedUsers(),
      ])

      if (roleTypesResult.error) {
        setLoadError(roleTypesResult.error)
        setIsLoadingData(false)
        return
      }

      // Users can be empty (no one completed onboarding yet) - that's OK
      setRoleTypes(roleTypesResult.data || [])
      setUsers(usersResult.data || [])
      setIsLoadingData(false)
    }

    loadData()
  }, [])

  // Sync state when data loads from Supabase (pre-fill)
  useEffect(() => {
    if (data.ymRoles?.length) {
      setRoles(data.ymRoles)
    }
  }, [data.ymRoles])

  const progressPercentage = calculateProgress(3)

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
    updateData({ ymRoles: roles })
    router.push("/onboarding?step=2")
  }

  const handleNext = async () => {
    setSaveError(null)
    const stepData = { ymRoles: roles }

    updateData(stepData)
    const result = await saveStepData(3, stepData)
    if (!result.success) {
      setSaveError(result.error || "Failed to save. Please try again.")
      return
    }

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
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background p-6">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="mt-4 text-sm text-muted-foreground">Loading roles...</p>
      </div>
    )
  }

  // Show error state if data failed to load
  if (loadError) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background p-6">
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-6 text-center max-w-md">
          <p className="text-sm text-destructive">{loadError}</p>
          <Button
            variant="outline"
            size="sm"
            className="mt-4"
            onClick={() => window.location.reload()}
          >
            Try Again
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col bg-background p-6">
      {/* Progress Bar */}
      <div className="w-full">
        <Progress value={progressPercentage} className="h-2" />
      </div>

      {/* Main Content */}
      <div className="flex flex-1 flex-col items-center py-12">
        {/* Heading */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">
            What YM roles have you held?
          </h1>
          <p className="mt-3 text-muted-foreground">
            Tell us about your experience in the organization
          </p>
        </div>

        {/* Role Entries */}
        <div className="w-full max-w-2xl space-y-4">
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
      </div>

      {/* Error Message */}
      {saveError && (
        <div className="mb-4 w-full max-w-md mx-auto rounded-md bg-destructive/10 p-4 text-center text-sm text-destructive">
          {saveError}
        </div>
      )}

      {/* Navigation Buttons */}
      <div className="flex w-full items-center justify-center gap-4 pb-4">
        <Button variant="outline" onClick={handleBack} disabled={isSaving} className="w-40">
          Back
        </Button>
        <Button onClick={handleNext} disabled={!isValid || isSaving || isLoading} className="w-40">
          {isSaving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            "Next"
          )}
        </Button>
      </div>
    </div>
  )
}
