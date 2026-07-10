'use client'

import { useState, useEffect, useRef } from 'react'
import { UserX, Loader2 } from 'lucide-react'
import { Label } from '@/components/ui/label'
import { TagChipSelector } from '@/components/tag-chip-selector'
import {
  CONTRIBUTION_TAGS,
  parseTags,
  serializeTags,
  toggleTag,
} from './contribution-tags'
import {
  SearchableCombobox,
  type ComboboxOption,
  type ComboboxValue,
} from '@/components/searchable-combobox'
import { DateRangeInput } from '@/components/date-range-input'
import { ExpandableCard, ExpandableCardList } from './ExpandableCard'
import { useProfileMode } from '@/contexts/ProfileModeContext'
import type { YMRoleEntry } from '@/contexts/OnboardingContext'
import { fetchAllUsersForSelection } from '@/lib/supabase/queries/users'
import { fetchRoleTypes } from '@/lib/supabase/queries/roles'
import { roleValid, isSystemRole } from '@/lib/profile-completion'

function getRoleTitle(role: YMRoleEntry, roleOptions: ComboboxOption[]): string {
  if (role.roleTypeName) {
    return role.roleTypeName
  }
  if (role.roleTypeId) {
    const found = roleOptions.find(r => r.value === role.roleTypeId)
    return found?.label ?? role.roleTypeId
  }
  if (role.roleTypeCustom) {
    return role.roleTypeCustom
  }
  return 'New Role'
}

function getRoleSubtitle(role: YMRoleEntry): string {
  const parts: string[] = []

  if (role.startMonth && role.startYear) {
    const startDate = new Date(role.startYear, role.startMonth - 1)
    const start = startDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })

    if (role.isCurrent) {
      parts.push(`${start} - Present`)
    } else if (role.endMonth && role.endYear) {
      const endDate = new Date(role.endYear, role.endMonth - 1)
      const end = endDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
      parts.push(`${start} - ${end}`)
    } else {
      parts.push(start)
    }
  }

  return parts.join(' • ')
}

interface YMRolesSectionProps {
  roles: YMRoleEntry[]
  onUpdateRole: (index: number, updates: Partial<YMRoleEntry>) => void
  onAddRole: () => void
  onRemoveRole: (index: number) => void
  /** When true, reveal the required-field error on any entry missing its role. */
  showErrors?: boolean
}

export function YMRolesSection({
  roles,
  onUpdateRole,
  onAddRole,
  onRemoveRole,
  showErrors = false,
}: YMRolesSectionProps) {
  const { isEditable } = useProfileMode()
  const [expandedId, setExpandedId] = useState<string | null>(null)

  // When errors are revealed, open the first incomplete entry so the error is
  // visible (and, as entries get fixed, jump to the next one).
  useEffect(() => {
    if (!showErrors) return
    const firstInvalid = roles.find((r) => !roleValid(r))
    if (firstInvalid) setExpandedId(firstInvalid.id)
  }, [showErrors, roles])

  // Expand a newly-added entry so it's ready to fill (not collapsed).
  const prevCount = useRef(roles.length)
  useEffect(() => {
    if (roles.length > prevCount.current) setExpandedId(roles[roles.length - 1].id)
    prevCount.current = roles.length
  }, [roles])
  const [optionsLoaded, setOptionsLoaded] = useState(!isEditable)
  const [roleOptions, setRoleOptions] = useState<ComboboxOption[]>([])
  const [amirOptions, setAmirOptions] = useState<ComboboxOption[]>([])

  // Only fetch dropdown options in edit mode — read-only uses pre-resolved names from the query
  useEffect(() => {
    if (!isEditable) return

    async function loadOptions() {
      const [rolesResult, usersResult] = await Promise.all([
        fetchRoleTypes(),
        fetchAllUsersForSelection(),
      ])
      if (rolesResult.data) {
        setRoleOptions(rolesResult.data.map(rt => ({ value: rt.id, label: rt.name })))
      }
      if (usersResult.data) {
        setAmirOptions(usersResult.data)
      }
      setOptionsLoaded(true)
    }
    loadOptions()
  }, [isEditable])

  const getRoleComboboxValue = (role: YMRoleEntry): ComboboxValue | undefined => {
    if (role.roleTypeId) {
      const option = roleOptions.find(r => r.value === role.roleTypeId)
      return { type: 'existing', value: role.roleTypeId, label: option?.label }
    }
    if (role.roleTypeCustom) {
      return { type: 'custom', value: role.roleTypeCustom }
    }
    return undefined
  }

  const getAmirComboboxValue = (role: YMRoleEntry): ComboboxValue | undefined => {
    if (role.amirUserId) {
      const option = amirOptions.find(a => a.value === role.amirUserId)
      return { type: 'existing', value: role.amirUserId, label: option?.label }
    }
    if (role.amirCustomName) {
      return { type: 'custom', value: role.amirCustomName }
    }
    return undefined
  }

  const handleRoleTypeChange = (index: number, value: ComboboxValue | undefined) => {
    if (!value) {
      onUpdateRole(index, { roleTypeId: undefined, roleTypeName: undefined, roleTypeCustom: undefined })
    } else if (value.type === 'existing') {
      onUpdateRole(index, { roleTypeId: value.value, roleTypeName: value.label, roleTypeCustom: undefined })
    } else {
      onUpdateRole(index, { roleTypeId: undefined, roleTypeName: undefined, roleTypeCustom: value.value })
    }
  }

  const handleAmirChange = (index: number, value: ComboboxValue | undefined) => {
    if (!value) {
      onUpdateRole(index, { amirUserId: undefined, amirCustomName: undefined })
    } else if (value.type === 'existing') {
      onUpdateRole(index, { amirUserId: value.value, amirCustomName: undefined })
    } else {
      onUpdateRole(index, { amirUserId: undefined, amirCustomName: value.value })
    }
  }

  const getAmirDisplay = (role: YMRoleEntry): string => {
    if (role.amirUserName) {
      return role.amirUserName
    }
    if (role.amirUserId) {
      const option = amirOptions.find(a => a.value === role.amirUserId)
      return option?.label || role.amirUserId
    }
    if (role.amirCustomName) {
      return role.amirCustomName
    }
    return '—'
  }

  const emptyState = (
    <div className="flex flex-col items-center justify-center py-8 text-center rounded-lg border border-dashed">
      <UserX className="h-10 w-10 text-muted-foreground/50 mb-3" />
      <p className="text-sm text-muted-foreground">No roles added yet</p>
    </div>
  )

  if (!optionsLoaded) {
    return (
      <section className="space-y-5">
        <div>
          <h2 className="text-xl font-semibold tracking-tight text-foreground">YM Roles</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Your positions and responsibilities in the organization
          </p>
        </div>
        <div className="flex justify-center py-8">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      </section>
    )
  }

  return (
    <ExpandableCardList
      title="YM Roles"
      description={isEditable ? "Your positions and responsibilities in the organization" : "Positions and responsibilities in the organization"}
      addLabel={isEditable ? "Add another role" : undefined}
      onAdd={isEditable ? onAddRole : undefined}
      emptyState={!isEditable ? emptyState : undefined}
    >
      {roles.map((role, index) => {
        // System roles (e.g. Event Admin) are admin-granted and can never be
        // self-managed (RLS forbids it). Render read-only even in edit mode so
        // they're visible but not editable or deletable.
        const isSystem = isSystemRole(role)
        const canEdit = isEditable && !isSystem

        return (
        <ExpandableCard
          key={role.id}
          id={role.id}
          title={getRoleTitle(role, roleOptions)}
          subtitle={getRoleSubtitle(role)}
          badge={role.isCurrent ? 'Current' : undefined}
          isExpanded={expandedId === role.id}
          onToggle={() => setExpandedId(expandedId === role.id ? null : role.id)}
          onDelete={canEdit && roles.length > 1 ? () => onRemoveRole(index) : undefined}
        >
          {canEdit ? (
            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label>
                  Role <span className="text-destructive">*</span>
                </Label>
                <SearchableCombobox
                  options={roleOptions}
                  value={getRoleComboboxValue(role)}
                  onChange={(value) => handleRoleTypeChange(index, value)}
                  placeholder="Select or add a role"
                  searchPlaceholder="Search roles..."
                  allowCustom
                />
                {showErrors && !roleValid(role) && (
                  <p className="text-sm text-destructive">Select a role to continue.</p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label>Amir / Manager</Label>
                <SearchableCombobox
                  options={amirOptions}
                  value={getAmirComboboxValue(role)}
                  onChange={(value) => handleAmirChange(index, value)}
                  placeholder="Select or add a person"
                  searchPlaceholder="Search people..."
                  allowCustom
                />
              </div>

              <div className="space-y-1.5">
                <Label>Date Range</Label>
                <DateRangeInput
                  startMonth={role.startMonth}
                  startYear={role.startYear}
                  endMonth={role.endMonth}
                  endYear={role.endYear}
                  isCurrent={role.isCurrent}
                  onChange={(values) => onUpdateRole(index, values)}
                  currentLabel="I currently hold this role"
                />
              </div>

              <div className="space-y-1.5">
                <Label>What did you focus on? (optional)</Label>
                <TagChipSelector
                  options={CONTRIBUTION_TAGS}
                  selected={parseTags(role.description)}
                  onToggle={(tag) =>
                    onUpdateRole(index, {
                      description: serializeTags(toggleTag(parseTags(role.description), tag)),
                    })
                  }
                  allowCustom
                />
              </div>
            </div>
          ) : (
            <div className="space-y-3 text-sm">
              {isSystem && isEditable && (
                <p className="text-muted-foreground">
                  Assigned by an administrator and can&apos;t be edited here.
                </p>
              )}
              <div>
                <span className="font-medium text-muted-foreground">Amir / Manager:</span>
                <span className="ml-2 text-foreground">{getAmirDisplay(role)}</span>
              </div>
              {role.description && (
                <div>
                  <span className="font-medium text-muted-foreground">Description:</span>
                  <p className="mt-1 text-foreground whitespace-pre-wrap">{role.description}</p>
                </div>
              )}
            </div>
          )}
        </ExpandableCard>
        )
      })}
    </ExpandableCardList>
  )
}
