"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Plus, X } from "lucide-react"

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
import { calculateProgress, PLACEHOLDER_AMIRS } from "./constants"

// YM Role types from role_types table in database schema
// Based on ym-hierarchy.md organizational structure
const YM_ROLES: ComboboxOption[] = [
  // NS roles
  { value: "nc", label: "National Coordinator" },
  { value: "ns_sg", label: "NS Secretary General" },
  { value: "cabinet_chair", label: "Cabinet Chair" },
  { value: "council_coord", label: "Council Coordinator" },
  { value: "nat_cloud_rep", label: "National Cloud Rep" },
  { value: "ns_member", label: "NS Member" },
  // Council/Regional roles
  { value: "rc", label: "Regional Coordinator" },
  { value: "reg_cloud_rep", label: "Regional Cloud Rep" },
  { value: "reg_special_proj", label: "Regional Special Projects" },
  // Subregional roles
  { value: "src", label: "Sub-Regional Coordinator" },
  { value: "sr_sg", label: "SR Secretary General" },
  // NeighborNet roles
  { value: "nnc", label: "NeighborNet Coordinator" },
  { value: "ct_member", label: "Core Team Member" },
  { value: "member", label: "Member" },
  // Cloud roles
  { value: "cloud_coord", label: "Cloud Coordinator" },
  { value: "cloud_member", label: "Cloud Member" },
  // Cabinet roles
  { value: "cabinet_sg", label: "Cabinet Secretary General" },
  { value: "dept_head", label: "Department Head" },
  { value: "team_lead", label: "Team Lead" },
  { value: "team_member", label: "Team Member" },
]


function createEmptyRole(): YMRoleEntry {
  return {
    id: crypto.randomUUID(),
    isCurrent: false,
  }
}

export default function Step3() {
  const router = useRouter()
  const { data, updateData } = useOnboarding()

  // Initialize with one empty role entry or from context
  const [roles, setRoles] = useState<YMRoleEntry[]>(
    data.ymRoles?.length ? data.ymRoles : [createEmptyRole()]
  )

  const progressPercentage = calculateProgress(3)

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

  const handleNext = () => {
    updateData({ ymRoles: roles })
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
      const option = YM_ROLES.find((r) => r.value === role.roleTypeId)
      return { type: "existing", value: role.roleTypeId, label: option?.label }
    }
    if (role.roleTypeCustom) {
      return { type: "custom", value: role.roleTypeCustom }
    }
    return undefined
  }

  const getAmirComboboxValue = (role: YMRoleEntry): ComboboxValue | undefined => {
    if (role.amirUserId) {
      const option = PLACEHOLDER_AMIRS.find((a) => a.value === role.amirUserId)
      return { type: "existing", value: role.amirUserId, label: option?.label }
    }
    if (role.amirCustomName) {
      return { type: "custom", value: role.amirCustomName }
    }
    return undefined
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
                    options={YM_ROLES}
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
                    options={PLACEHOLDER_AMIRS}
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

      {/* Navigation Buttons */}
      <div className="flex w-full items-center justify-center gap-4 pb-4">
        <Button variant="outline" onClick={handleBack} className="w-40">
          Back
        </Button>
        <Button onClick={handleNext} disabled={!isValid} className="w-40">
          Next
        </Button>
      </div>
    </div>
  )
}
