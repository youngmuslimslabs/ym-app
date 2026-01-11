'use client'

import { useState, useEffect } from 'react'
import { User, ArrowLeft, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useProfileForm, type ProfileFormState } from './hooks/useProfileForm'
import { useProfileData } from './hooks/useProfileData'
import { PersonalInfoSection } from './components/PersonalInfoSection'
import { YMRolesSection } from './components/YMRolesSection'
import { YMProjectsSection } from './components/YMProjectsSection'
import { EducationSection } from './components/EducationSection'
import { SkillsChipSelector } from './components/SkillsChipSelector'
import { SaveButton } from './components/SaveButton'
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
  const [saveAndLeaveError, setSaveAndLeaveError] = useState<string | null>(null)

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
      throw new Error(result.error ?? 'Failed to save profile')
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
      setSaveAndLeaveError(null) // Clear any previous errors
      setShowUnsavedModal(true)
    } else {
      window.location.href = href
    }
  }

  const handleSaveAndLeave = async () => {
    setSaveAndLeaveError(null) // Clear error before attempting save
    const result = await saveForm()
    if (result.success) {
      setShowUnsavedModal(false)
      if (pendingNavigation) {
        window.location.href = pendingNavigation
      }
    } else {
      // Show error to user instead of silently failing
      setSaveAndLeaveError(result.error || 'Failed to save profile. Please try again.')
    }
  }

  const handleDiscardAndLeave = () => {
    resetForm()
    setShowUnsavedModal(false)
    setSaveAndLeaveError(null)
    if (pendingNavigation) {
      window.location.href = pendingNavigation
    }
  }

  const handleStay = () => {
    setShowUnsavedModal(false)
    setPendingNavigation(null)
    setSaveAndLeaveError(null)
  }

  return (
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
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
              <User className="h-5 w-5 text-primary" />
            </div>
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
          {/* Loading State */}
          {isLoading && (
            <div className="flex flex-col items-center justify-center py-16">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="mt-4 text-sm text-muted-foreground">Loading your profile...</p>
            </div>
          )}

          {/* Error State */}
          {error && !isLoading && (
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
          {!isLoading && !error && isInitialized && (
            <>
              <div
                className="animate-in fade-in slide-in-from-bottom-4 duration-500"
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
                className="animate-in fade-in slide-in-from-bottom-4 duration-500"
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
                className="animate-in fade-in slide-in-from-bottom-4 duration-500"
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
                className="animate-in fade-in slide-in-from-bottom-4 duration-500"
                style={{ animationDelay: '300ms' }}
              >
                <EducationSection
                  educationLevel={formData.educationLevel}
                  education={formData.education ?? []}
                  onEducationLevelChange={(v) => updateField('educationLevel', v)}
                  onUpdateEducation={updateEducation}
                  onAddEducation={addEducation}
                  onRemoveEducation={removeEducation}
                />
              </div>

              <div
                className="animate-in fade-in slide-in-from-bottom-4 duration-500"
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
        error={saveAndLeaveError}
      />
    </div>
  )
}
