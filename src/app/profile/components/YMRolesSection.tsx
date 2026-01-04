'use client'

import { useState } from 'react'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  SearchableCombobox,
  type ComboboxOption,
  type ComboboxValue,
} from '@/components/searchable-combobox'
import { DateRangeInput } from '@/components/date-range-input'
import { ExpandableCard, ExpandableCardList } from './ExpandableCard'
import type { YMRoleEntry } from '@/contexts/OnboardingContext'

// YM Role types from step3-ym-roles.tsx
const YM_ROLES: ComboboxOption[] = [
  { value: 'nc', label: 'National Coordinator' },
  { value: 'ns_sg', label: 'NS Secretary General' },
  { value: 'cabinet_chair', label: 'Cabinet Chair' },
  { value: 'council_coord', label: 'Council Coordinator' },
  { value: 'nat_cloud_rep', label: 'National Cloud Rep' },
  { value: 'ns_member', label: 'NS Member' },
  { value: 'rc', label: 'Regional Coordinator' },
  { value: 'reg_cloud_rep', label: 'Regional Cloud Rep' },
  { value: 'reg_special_proj', label: 'Regional Special Projects' },
  { value: 'src', label: 'Sub-Regional Coordinator' },
  { value: 'sr_sg', label: 'SR Secretary General' },
  { value: 'nnc', label: 'NeighborNet Coordinator' },
  { value: 'ct_member', label: 'Core Team Member' },
  { value: 'member', label: 'Member' },
  { value: 'cloud_coord', label: 'Cloud Coordinator' },
  { value: 'cloud_member', label: 'Cloud Member' },
  { value: 'cabinet_sg', label: 'Cabinet Secretary General' },
  { value: 'dept_head', label: 'Department Head' },
  { value: 'team_lead', label: 'Team Lead' },
  { value: 'team_member', label: 'Team Member' },
]

// TODO: Fetch from Supabase users table
const PLACEHOLDER_AMIRS: ComboboxOption[] = [
  { value: 'user-1', label: 'Ahmed Hassan' },
  { value: 'user-2', label: 'Fatima Al-Said' },
  { value: 'user-3', label: 'Omar Khan' },
  { value: 'user-4', label: 'Yasmin Ibrahim' },
  { value: 'user-5', label: 'Khalid Mohammed' },
]

function getRoleTitle(role: YMRoleEntry): string {
  if (role.roleTypeId) {
    const found = YM_ROLES.find(r => r.value === role.roleTypeId)
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
}

export function YMRolesSection({
  roles,
  onUpdateRole,
  onAddRole,
  onRemoveRole,
}: YMRolesSectionProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const getRoleComboboxValue = (role: YMRoleEntry): ComboboxValue | undefined => {
    if (role.roleTypeId) {
      const option = YM_ROLES.find(r => r.value === role.roleTypeId)
      return { type: 'existing', value: role.roleTypeId, label: option?.label }
    }
    if (role.roleTypeCustom) {
      return { type: 'custom', value: role.roleTypeCustom }
    }
    return undefined
  }

  const getAmirComboboxValue = (role: YMRoleEntry): ComboboxValue | undefined => {
    if (role.amirUserId) {
      const option = PLACEHOLDER_AMIRS.find(a => a.value === role.amirUserId)
      return { type: 'existing', value: role.amirUserId, label: option?.label }
    }
    if (role.amirCustomName) {
      return { type: 'custom', value: role.amirCustomName }
    }
    return undefined
  }

  const handleRoleTypeChange = (index: number, value: ComboboxValue | undefined) => {
    if (!value) {
      onUpdateRole(index, { roleTypeId: undefined, roleTypeCustom: undefined })
    } else if (value.type === 'existing') {
      onUpdateRole(index, { roleTypeId: value.value, roleTypeCustom: undefined })
    } else {
      onUpdateRole(index, { roleTypeId: undefined, roleTypeCustom: value.value })
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

  return (
    <ExpandableCardList
      title="YM Roles"
      description="Your positions and responsibilities in the organization"
      addLabel="Add another role"
      onAdd={onAddRole}
    >
      {roles.map((role, index) => (
        <ExpandableCard
          key={role.id}
          id={role.id}
          title={getRoleTitle(role)}
          subtitle={getRoleSubtitle(role)}
          badge={role.isCurrent ? 'Current' : undefined}
          isExpanded={expandedId === role.id}
          onToggle={() => setExpandedId(expandedId === role.id ? null : role.id)}
          onDelete={roles.length > 1 ? () => onRemoveRole(index) : undefined}
        >
          <div className="space-y-4">
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
              <Label>What did you do? (optional)</Label>
              <Textarea
                value={role.description ?? ''}
                onChange={(e) => onUpdateRole(index, { description: e.target.value })}
                placeholder="Describe your responsibilities and achievements..."
                rows={3}
              />
            </div>
          </div>
        </ExpandableCard>
      ))}
    </ExpandableCardList>
  )
}
