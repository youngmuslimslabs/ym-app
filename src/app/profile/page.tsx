'use client'

import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { User, ArrowLeft } from 'lucide-react'
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
      throw new Error(result.error ?? 'save_profile_failed')
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
      window.location.href = href
    }
  }

  const handleSaveAndLeave = async () => {
    const result = await saveForm()
    if (result.success) {
      setShowUnsavedModal(false)
      if (pendingNavigation) {
        window.location.href = pendingNavigation
      }
    } else {
      console.error('Save profile failed:', result.error)
      toast.error(toUserMessage(result.error, { action: 'save your profile' }))
    }
  }

  const handleDiscardAndLeave = () => {
    resetForm()
    setShowUnsavedModal(false)
    if (pendingNavigation) {
      window.location.href = pendingNavigation
    }
  }

  const handleStay = () => {
    setShowUnsavedModal(false)
    setPendingNavigation(null)
  }

  if (isLoading) {
    return <ProfilePageSkeleton />
  }

  return (
    <ProfileModeProvider isEditable={true}>
      <div className="flex min-h-screen flex-col bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex h-16 items-center gap-4 px-6">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => handleNavigationAttempt('/home')}
            className="shrink-0"
          >
            <ArrowLeft className="h-5 w-5" />
            <span className="sr-only">Back to home</span>
          </Button>

          <div className="flex items-center gap-3">
            {profileData?.avatarUrl ? (
              <img
                src={profileData.avatarUrl}
                alt={`${profileData.firstName ?? ''} ${profileData.lastName ?? ''}`}
                className="h-10 w-10 rounded-full object-cover"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                <User className="h-5 w-5 text-primary" />
              </div>
            )}
            <div>
              <h1 className="text-lg font-semibold tracking-tight">My Profile</h1>
              <p className="text-sm text-muted-foreground">
                Manage your personal information
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 px-6 py-8 pb-24">
        <div className="mx-auto max-w-2xl space-y-12">
          {/* Error State */}
          {error && (
            <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-6 text-center">
              <p className="text-sm text-destructive">{error}</p>
              <Button
                variant="outline"
                size="sm"
                className="mt-4"
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
