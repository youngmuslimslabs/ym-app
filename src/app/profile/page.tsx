'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { usePostHog } from 'posthog-js/react'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ProfileModeProvider } from '@/contexts/ProfileModeContext'
import { toUserMessage } from '@/lib/errors/userMessage'
import { useProfileForm, type ProfileFormState } from './hooks/useProfileForm'
import { useProfileData } from './hooks/useProfileData'
import { PersonalInfoSection } from './components/PersonalInfoSection'
import { YMRolesSection } from './components/YMRolesSection'
import { YMProjectsSection } from './components/YMProjectsSection'
import { EducationSection } from './components/EducationSection'
import { SkillsChipSelector } from './components/SkillsChipSelector'
import { SaveButton } from './components/SaveButton'
import { ProfilePageSkeleton } from './components/ProfilePageSkeleton'
import { MemberAvatar } from '@/components/brand/member-avatar'
import { PageHeader } from '@/components/layout/page-header'
import {
  UnsavedChangesModal,
  useUnsavedChangesWarning,
} from './components/UnsavedChangesModal'

// Empty initial state for form (will be populated from Supabase)
const EMPTY_PROFILE_DATA: ProfileFormState = {
  googleEmail: '',
  phoneNumber: '',
  personalEmail: '',
  ethnicity: '',
  dateOfBirth: undefined,
  subregionId: '',
  neighborNetId: '',
  ymRoles: [],
  ymProjects: [],
  educationLevel: undefined,
  education: [],
  skills: [],
}

export default function ProfilePage() {
  const router = useRouter()
  const posthog = usePostHog()
  const [showUnsavedModal, setShowUnsavedModal] = useState(false)
  const [pendingNavigation, setPendingNavigation] = useState<string | null>(null)
  const [isInitialized, setIsInitialized] = useState(false)

  // Fetch profile data from Supabase
  const { profileData, isLoading, error } = useProfileData()

  const {
    formData,
    hasChanges,
    changeCount,
    updateField,
    updateRole,
    addRole,
    removeRole,
    updateProject,
    addProject,
    removeProject,
    updateEducation,
    addEducation,
    removeEducation,
    toggleSkill,
    resetForm,
    saveForm,
    setInitialData,
  } = useProfileForm(EMPTY_PROFILE_DATA)

  // Wrapper for saveForm that throws on error (for FloatingSaveBar error handling)
  const handleSave = async () => {
    const result = await saveForm()
    if (!result.success) {
      try {
        posthog?.captureException(new Error(result.error ?? 'Profile save failed'), { context: 'profile_save' })
        posthog?.capture('profile_save_failed', { error: result.error ?? 'unknown' })
      } catch { /* observability */ }
      throw new Error(result.error ?? 'save_profile_failed')
    } else {
      try {
        posthog?.capture('profile_saved', { change_count: changeCount })
      } catch { /* observability */ }
    }
  }

  // Update form when profile data is loaded
  useEffect(() => {
    if (profileData && !isInitialized) {
      setInitialData(profileData)
      setIsInitialized(true)
    }
  }, [profileData, isInitialized, setInitialData])

  // Handle browser-level navigation warning (beforeunload)
  useUnsavedChangesWarning(hasChanges)

  const handleNavigationAttempt = (href: string) => {
    if (hasChanges) {
      setPendingNavigation(href)
      setShowUnsavedModal(true)
    } else {
      router.push(href)
    }
  }

  const handleSaveAndLeave = async () => {
    const result = await saveForm()
    if (result.success) {
      try {
        posthog?.capture('profile_saved', { change_count: changeCount })
      } catch { /* observability */ }
      setShowUnsavedModal(false)
      if (pendingNavigation) {
        router.push(pendingNavigation)
      }
    } else {
      console.error('Save profile failed:', result.error)
      try {
        posthog?.captureException(new Error(result.error ?? 'Profile save failed'), { context: 'profile_save' })
        posthog?.capture('profile_save_failed', { error: result.error ?? 'unknown' })
      } catch { /* observability */ }
      toast.error(toUserMessage(result.error, { action: 'save your profile' }))
    }
  }

  const handleDiscardAndLeave = () => {
    resetForm()
    setShowUnsavedModal(false)
    if (pendingNavigation) {
      router.push(pendingNavigation)
    }
  }

  const handleStay = () => {
    setShowUnsavedModal(false)
    setPendingNavigation(null)
  }

  const displayName = `${profileData?.firstName ?? ''} ${profileData?.lastName ?? ''}`.trim()

  if (isLoading) {
    return <ProfilePageSkeleton />
  }

  return (
    <ProfileModeProvider isEditable={true}>
      <div className="flex min-h-screen flex-col bg-background">
      {/* Main Content. Phones get 44px tap targets on the controls the sections
          render (inputs, selects, comboboxes) and on the skill chips. */}
      <main
        className={[
          'flex-1 px-4 pb-28 pt-[max(1rem,env(safe-area-inset-top))] sm:px-6 sm:pt-8',
          'max-sm:[&_input:not([type=checkbox])]:h-11',
          'max-sm:[&_[role=combobox]]:min-h-11',
          'max-sm:[&_div:has(>button[aria-pressed])]:gap-y-3',
          'max-sm:[&_div:has(>button[aria-pressed])>button]:-my-1.5',
          'max-sm:[&_div:has(>button[aria-pressed])>button]:py-1.5',
        ].join(' ')}
      >
        <div className="mx-auto max-w-2xl space-y-12">
          <div className="space-y-6">
            {/* Not PageHeader's `back` link: leaving with edits has to go through
                the unsaved-changes guard, which a plain link would bypass. */}
            <button
              type="button"
              onClick={() => handleNavigationAttempt('/home')}
              className="-ml-1 inline-flex min-h-11 w-fit items-center gap-1 rounded-md pr-2 text-sm font-medium text-muted-foreground transition-colors duration-200 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <ArrowLeft className="size-4" aria-hidden="true" />
              Home
            </button>

            <PageHeader title="My Profile" description="Manage your personal information" />

            <div className="flex items-center gap-4 rounded-2xl border bg-card p-6">
              {/* Your own avatar follows your theme, so no side is passed */}
              <MemberAvatar
                name={displayName || 'Your profile'}
                src={profileData?.avatarUrl}
                size="lg"
              />
              <div className="min-w-0">
                <p className="truncate text-lg font-bold">{displayName || 'Your profile'}</p>
                {formData.googleEmail && (
                  <p className="truncate text-sm text-muted-foreground">{formData.googleEmail}</p>
                )}
              </div>
            </div>
          </div>

          {/* Error State */}
          {error && (
            <div className="rounded-2xl border border-destructive/50 bg-destructive/10 p-6 text-center">
              <p className="text-sm text-destructive">{error}</p>
              <Button
                variant="outline"
                size="sm"
                className="mt-4 min-h-11"
                onClick={() => window.location.reload()}
              >
                Try Again
              </Button>
            </div>
          )}

          {/* Profile Sections - only show when loaded */}
          {!error && isInitialized && (
            <>
              <div
                className="animate-in fade-in slide-in-from-bottom-4 duration-200"
                style={{ animationDelay: '0ms' }}
              >
                <PersonalInfoSection
                  phoneNumber={formData.phoneNumber}
                  personalEmail={formData.personalEmail}
                  googleEmail={formData.googleEmail}
                  side={formData.side}
                  ethnicity={formData.ethnicity}
                  dateOfBirth={formData.dateOfBirth}
                  onPhoneChange={(v) => updateField('phoneNumber', v)}
                  onPersonalEmailChange={(v) => updateField('personalEmail', v)}
                  onEthnicityChange={(v) => updateField('ethnicity', v)}
                  onDateOfBirthChange={(v) => updateField('dateOfBirth', v)}
                />
              </div>

              <div
                className="animate-in fade-in slide-in-from-bottom-4 duration-200"
                style={{ animationDelay: '100ms' }}
              >
                <YMRolesSection
                  roles={formData.ymRoles ?? []}
                  onUpdateRole={updateRole}
                  onAddRole={addRole}
                  onRemoveRole={removeRole}
                />
              </div>

              <div
                className="animate-in fade-in slide-in-from-bottom-4 duration-200"
                style={{ animationDelay: '200ms' }}
              >
                <YMProjectsSection
                  projects={formData.ymProjects ?? []}
                  onUpdateProject={updateProject}
                  onAddProject={addProject}
                  onRemoveProject={removeProject}
                />
              </div>

              <div
                className="animate-in fade-in slide-in-from-bottom-4 duration-200"
                style={{ animationDelay: '300ms' }}
              >
                <EducationSection
                  education={formData.education ?? []}
                  onUpdateEducation={updateEducation}
                  onAddEducation={addEducation}
                  onRemoveEducation={removeEducation}
                />
              </div>

              <div
                className="animate-in fade-in slide-in-from-bottom-4 duration-200"
                style={{ animationDelay: '400ms' }}
              >
                <SkillsChipSelector
                  selectedSkills={formData.skills ?? []}
                  onToggle={toggleSkill}
                />
              </div>
            </>
          )}
        </div>
      </main>

      {/* Floating Save Button */}
      <SaveButton
        hasChanges={hasChanges}
        changeCount={changeCount}
        onSave={handleSave}
      />

      {/* Unsaved Changes Modal */}
      <UnsavedChangesModal
        isOpen={showUnsavedModal}
        onSaveAndLeave={handleSaveAndLeave}
        onDiscardAndLeave={handleDiscardAndLeave}
        onStay={handleStay}
        changeCount={changeCount}
      />
      </div>
    </ProfileModeProvider>
  )
}
