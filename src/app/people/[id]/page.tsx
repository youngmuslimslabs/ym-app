'use client'

import { useParams, useRouter, useSearchParams } from 'next/navigation'
import { ArrowLeft, User } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ProfileModeProvider } from '@/contexts/ProfileModeContext'
import { usePersonProfile } from '@/app/profile/hooks/usePersonProfile'
import { PersonalInfoSection } from '@/app/profile/components/PersonalInfoSection'
import { YMRolesSection } from '@/app/profile/components/YMRolesSection'
import { YMProjectsSection } from '@/app/profile/components/YMProjectsSection'
import { EducationSection } from '@/app/profile/components/EducationSection'
import { SkillsChipSelector } from '@/app/profile/components/SkillsChipSelector'
import { ProfileSkeleton } from './components/ProfileSkeleton'
import { ProfileNotFound } from './components/ProfileNotFound'

export default function PersonProfilePage() {
  const params = useParams()
  const router = useRouter()
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

  return (
    <ProfileModeProvider isEditable={false}>
      <div className="flex min-h-screen flex-col bg-background">
        {/* Header */}
        <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="flex h-16 items-center gap-4 px-6">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => router.push(backUrl)}
              className="shrink-0"
            >
              <ArrowLeft className="h-5 w-5" />
              <span className="sr-only">Back to directory</span>
            </Button>

            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                <User className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h1 className="text-lg font-semibold tracking-tight">
                  {personData.firstName && personData.lastName
                    ? `${personData.firstName} ${personData.lastName}`
                    : personData.googleEmail?.split('@')[0] || 'Profile'}
                </h1>
                <p className="text-sm text-muted-foreground">
                  View profile
                </p>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 px-6 py-8">
          <div className="mx-auto max-w-2xl space-y-12">
            <div
              className="animate-in fade-in slide-in-from-bottom-4 duration-500"
              style={{ animationDelay: '0ms' }}
            >
              <PersonalInfoSection
                phoneNumber={personData.phoneNumber}
                personalEmail={personData.personalEmail}
                googleEmail={personData.googleEmail}
                ethnicity={personData.ethnicity}
                dateOfBirth={personData.dateOfBirth}
                onPhoneChange={noop}
                onPersonalEmailChange={noop}
                onEthnicityChange={noop}
                onDateOfBirthChange={noop}
              />
            </div>

            <div
              className="animate-in fade-in slide-in-from-bottom-4 duration-500"
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
              className="animate-in fade-in slide-in-from-bottom-4 duration-500"
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
              className="animate-in fade-in slide-in-from-bottom-4 duration-500"
              style={{ animationDelay: '300ms' }}
            >
              <EducationSection
                educationLevel={personData.educationLevel}
                education={personData.education ?? []}
                onEducationLevelChange={noop}
                onUpdateEducation={noop}
                onAddEducation={noop}
                onRemoveEducation={noop}
              />
            </div>

            <div
              className="animate-in fade-in slide-in-from-bottom-4 duration-500"
              style={{ animationDelay: '400ms' }}
            >
              <SkillsChipSelector
                selectedSkills={personData.skills ?? []}
                onToggle={noop}
              />
            </div>
          </div>
        </main>
      </div>
    </ProfileModeProvider>
  )
}
