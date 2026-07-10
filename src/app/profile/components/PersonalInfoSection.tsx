'use client'

import { Phone, Mail, Globe, Calendar } from 'lucide-react'
import { InlineEditField } from './InlineEditField'
import { useProfileMode } from '@/contexts/ProfileModeContext'
import { format } from 'date-fns'
import { formatPhoneNumber, isValidPhone, isValidEmail } from '@/lib/validation'
import { Label } from '@/components/ui/label'
import { SearchableCombobox } from '@/components/searchable-combobox'
import { NATIONALITY_OPTIONS } from '@/lib/constants/nationalities'

// Nationality uses the shared ~190-entry list (single source of truth) via a
// searchable combobox with free entry — the same field the Part-1 onboarding
// flow uses. Values are the demonyms themselves (e.g. 'Pakistani'), stored
// verbatim in the users.ethnicity TEXT column (no DB rename; label only).

// Read-only field display component
function ReadOnlyField({
  label,
  value,
  icon,
}: {
  label: string
  value: string
  icon?: React.ReactNode
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 text-sm font-medium text-foreground">
        {icon && <span className="text-muted-foreground">{icon}</span>}
        <span>{label}</span>
      </div>
      <div className="rounded-lg border bg-muted/30 px-4 py-3 text-sm text-foreground">
        {value || '—'}
      </div>
    </div>
  )
}

interface PersonalInfoSectionProps {
  phoneNumber?: string
  personalEmail?: string
  googleEmail?: string
  ethnicity?: string
  dateOfBirth?: Date
  onPhoneChange: (value: string) => void
  onPersonalEmailChange: (value: string) => void
  onEthnicityChange: (value: string) => void
  onDateOfBirthChange: (value: Date | undefined) => void
}

export function PersonalInfoSection({
  phoneNumber = '',
  personalEmail = '',
  googleEmail,
  ethnicity = '',
  dateOfBirth,
  onPhoneChange,
  onPersonalEmailChange,
  onEthnicityChange,
  onDateOfBirthChange,
}: PersonalInfoSectionProps) {
  const { isEditable } = useProfileMode()

  return (
    <section className="space-y-5">
      <div>
        <h2 className="text-xl font-semibold tracking-tight text-foreground">Personal Information</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {isEditable ? 'Your contact details and personal info' : 'Contact details and personal info'}
        </p>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        {isEditable ? (
          <>
            <InlineEditField
              type="tel"
              label="Phone Number"
              value={phoneNumber}
              onChange={onPhoneChange}
              icon={<Phone className="h-4 w-4" />}
              placeholder="(555) 123-4567"
              formatter={formatPhoneNumber}
              validator={isValidPhone}
              errorMessage="Please enter a valid 10-digit phone number"
            />

            <InlineEditField
              type="email"
              label="Personal Email"
              value={personalEmail}
              onChange={onPersonalEmailChange}
              icon={<Mail className="h-4 w-4" />}
              placeholder="you@example.com"
              validator={isValidEmail}
              errorMessage="Please enter a valid email address"
            />

            {googleEmail && (
              <InlineEditField
                type="email"
                label="YM Email"
                value={googleEmail}
                onChange={() => {}}
                icon={<Mail className="h-4 w-4" />}
                disabled
              />
            )}

            <div className="flex flex-col gap-1.5">
              <Label className="flex items-center gap-2">
                <span className="text-muted-foreground">
                  <Globe className="h-4 w-4" />
                </span>
                Nationality
              </Label>
              <SearchableCombobox
                options={NATIONALITY_OPTIONS}
                value={
                  ethnicity
                    ? NATIONALITY_OPTIONS.some((o) => o.value === ethnicity)
                      ? { type: 'existing', value: ethnicity, label: ethnicity }
                      : { type: 'custom', value: ethnicity }
                    : undefined
                }
                onChange={(v) => onEthnicityChange(v?.value ?? '')}
                placeholder="Select your nationality"
                searchPlaceholder="Search nationalities…"
                allowCustom
                // Show the full ~191-nationality list (scrollable) rather than the
                // default 50-item cap, which truncated the un-searched list at "D".
                maxDisplayed={NATIONALITY_OPTIONS.length}
              />
            </div>

            <InlineEditField
              type="date"
              label="Date of Birth"
              value={dateOfBirth}
              onChange={onDateOfBirthChange}
              icon={<Calendar className="h-4 w-4" />}
              placeholder="Select date"
            />
          </>
        ) : (
          <>
            <ReadOnlyField
              label="Phone Number"
              value={phoneNumber}
              icon={<Phone className="h-4 w-4" />}
            />

            <ReadOnlyField
              label="Personal Email"
              value={personalEmail}
              icon={<Mail className="h-4 w-4" />}
            />

            {googleEmail && (
              <ReadOnlyField
                label="YM Email"
                value={googleEmail}
                icon={<Mail className="h-4 w-4" />}
              />
            )}

            <ReadOnlyField
              label="Nationality"
              value={ethnicity}
              icon={<Globe className="h-4 w-4" />}
            />

            <ReadOnlyField
              label="Date of Birth"
              value={dateOfBirth ? format(dateOfBirth, 'MMMM d, yyyy') : ''}
              icon={<Calendar className="h-4 w-4" />}
            />
          </>
        )}
      </div>
    </section>
  )
}
