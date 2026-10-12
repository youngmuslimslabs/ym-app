'use client'

import Link from 'next/link'
import { useParams, useSearchParams } from 'next/navigation'
import { ChevronLeft } from 'lucide-react'
import { ProfileModeProvider } from '@/contexts/ProfileModeContext'
import { usePersonProfile } from '@/app/profile/hooks/usePersonProfile'
import { PersonalInfoSection } from '@/app/profile/components/PersonalInfoSection'
import { YMRolesSection } from '@/app/profile/components/YMRolesSection'
import { YMProjectsSection } from '@/app/profile/components/YMProjectsSection'
import { EducationSection } from '@/app/profile/components/EducationSection'
import { SkillsChipSelector } from '@/app/profile/components/SkillsChipSelector'
import { ProfileSkeleton } from './components/ProfileSkeleton'
import { ProfileNotFound } from './components/ProfileNotFound'
import { PersonHero } from './components/PersonHero'

export default function PersonProfilePage() {
  const params = useParams()
  const searchParams = useSearchParams()
  const userId = params?.id as string

  // Get back URL from query params, fallback to /people
  const backUrl = searchParams.get('back') ?? '/people'

  const { personData, isLoading, error } = usePersonProfile(userId)

  if (isLoading) {
    return <ProfileSkeleton />
  }

  if (error || !personData) {
    return <ProfileNotFound />
  }

  // Dummy handlers for read-only mode (won't be called)
  const noop = () => {}

  const displayName =
    personData.firstName && personData.lastName
      ? `${personData.firstName} ${personData.lastName}`
      : personData.googleEmail?.split('@')[0] || 'Profile'

  const currentRoles = (personData.ymRoles ?? [])
    .filter((role) => role.isCurrent)
    .map((role) => role.roleTypeName || role.roleTypeCustom)
    .filter((name): name is string => Boolean(name))

  return (
    <ProfileModeProvider isEditable={false}>
      <div className="mx-auto max-w-3xl px-4 pb-16 pt-4 sm:px-6 sm:pt-6">
        <Link
          href={backUrl}
          className="-ml-1 mb-2 inline-flex min-h-11 w-fit items-center gap-1 rounded-md pr-2 text-sm font-medium text-muted-foreground transition-colors duration-200 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <ChevronLeft className="size-4" aria-hidden="true" />
          Back to directory
        </Link>

        <PersonHero
          name={displayName}
          avatarUrl={personData.avatarUrl}
          side={personData.side}
          roles={currentRoles}
        />

        <div className="mx-auto mt-10 max-w-2xl space-y-12">
          <div
            className="animate-in fade-in slide-in-from-bottom-4 duration-200"
            style={{ animationDelay: '0ms' }}
          >
            <PersonalInfoSection
              phoneNumber={personData.phoneNumber}
              personalEmail={personData.personalEmail}
              googleEmail={personData.googleEmail}
              side={personData.side}
              ethnicity={personData.ethnicity}
              dateOfBirth={personData.dateOfBirth}
              onPhoneChange={noop}
              onPersonalEmailChange={noop}
              onEthnicityChange={noop}
              onDateOfBirthChange={noop}
            />
          </div>

          <div
            className="animate-in fade-in slide-in-from-bottom-4 duration-200"
            style={{ animationDelay: '100ms' }}
          >
            <YMRolesSection
              roles={personData.ymRoles ?? []}
              onUpdateRole={noop}
              onAddRole={noop}
              onRemoveRole={noop}
            />
          </div>

          <div
            className="animate-in fade-in slide-in-from-bottom-4 duration-200"
            style={{ animationDelay: '200ms' }}
          >
            <YMProjectsSection
              projects={personData.ymProjects ?? []}
              onUpdateProject={noop}
              onAddProject={noop}
              onRemoveProject={noop}
            />
          </div>

          <div
            className="animate-in fade-in slide-in-from-bottom-4 duration-200"
            style={{ animationDelay: '300ms' }}
          >
            <EducationSection
              education={personData.education ?? []}
              onUpdateEducation={noop}
              onAddEducation={noop}
              onRemoveEducation={noop}
            />
          </div>

          <div
            className="animate-in fade-in slide-in-from-bottom-4 duration-200"
            style={{ animationDelay: '400ms' }}
          >
            <SkillsChipSelector
              selectedSkills={personData.skills ?? []}
              onToggle={noop}
            />
          </div>
        </div>
      </div>
    </ProfileModeProvider>
  )
}
