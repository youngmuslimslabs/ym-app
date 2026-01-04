'use client'

import { Phone, Mail, Globe, Calendar } from 'lucide-react'
import { InlineEditField } from './InlineEditField'

// Common ethnicities - matching step1-personal-info.tsx
const ETHNICITIES = [
  'Afghan', 'Algerian', 'Bangladeshi', 'Egyptian', 'Emirati', 'Ethiopian',
  'Indian', 'Indonesian', 'Iranian', 'Iraqi', 'Jordanian', 'Kuwaiti',
  'Lebanese', 'Libyan', 'Malaysian', 'Moroccan', 'Nigerian', 'Pakistani',
  'Palestinian', 'Saudi', 'Somali', 'Sudanese', 'Syrian', 'Tunisian',
  'Turkish', 'Yemeni', 'Other',
].map(eth => ({ value: eth.toLowerCase(), label: eth }))

// Format phone number as user types: (555) 123-4567
function formatPhoneNumber(value: string): string {
  const digits = value.replace(/\D/g, '')
  const limited = digits.slice(0, 10)

  if (limited.length === 0) return ''
  if (limited.length <= 3) return `(${limited}`
  if (limited.length <= 6) return `(${limited.slice(0, 3)}) ${limited.slice(3)}`
  return `(${limited.slice(0, 3)}) ${limited.slice(3, 6)}-${limited.slice(6)}`
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
  return (
    <section className="space-y-5">
      <div>
        <h2 className="text-xl font-semibold tracking-tight text-foreground">Personal Information</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Your contact details and personal info
        </p>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <InlineEditField
          type="tel"
          label="Phone Number"
          value={phoneNumber}
          onChange={onPhoneChange}
          icon={<Phone className="h-4 w-4" />}
          placeholder="(555) 123-4567"
          formatter={formatPhoneNumber}
        />

        <InlineEditField
          type="email"
          label="Personal Email"
          value={personalEmail}
          onChange={onPersonalEmailChange}
          icon={<Mail className="h-4 w-4" />}
          placeholder="you@example.com"
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

        <InlineEditField
          type="select"
          label="Ethnicity"
          value={ethnicity}
          onChange={onEthnicityChange}
          icon={<Globe className="h-4 w-4" />}
          options={ETHNICITIES}
          placeholder="Select ethnicity"
        />

        <InlineEditField
          type="date"
          label="Date of Birth"
          value={dateOfBirth}
          onChange={onDateOfBirthChange}
          icon={<Calendar className="h-4 w-4" />}
          placeholder="Select date"
        />
      </div>
    </section>
  )
}
