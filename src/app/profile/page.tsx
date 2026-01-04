'use client'

import { useState, useEffect } from 'react'
import { User, ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useProfileForm, type ProfileFormState } from './hooks/useProfileForm'
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
import type { EducationLevel } from '@/contexts/OnboardingContext'

// Mock data for development - in production, this would come from API
const MOCK_PROFILE_DATA: ProfileFormState = {
  googleEmail: 'omar.khan@youngmuslims.com',
  phoneNumber: '(555) 123-4567',
  personalEmail: 'omar.personal@gmail.com',
  ethnicity: 'pakistani',
  dateOfBirth: new Date(1995, 5, 15),
  subregionId: 'sr-1',
  neighborNetId: 'nn-1',
  ymRoles: [
    {
      id: '1',
      roleTypeId: 'nnc',
      amirUserId: 'user-1',
      startMonth: 3,
      startYear: 2023,
      isCurrent: true,
      description: 'Leading local community engagement initiatives',
    },
    {
      id: '2',
      roleTypeId: 'team_member',
      amirUserId: 'user-2',
      startMonth: 6,
      startYear: 2021,
      endMonth: 2,
      endYear: 2023,
      isCurrent: false,
    },
  ],
  ymProjects: [
    {
      id: '1',
      projectType: 'youth-camp',
      role: 'Volunteer Coordinator',
      startMonth: 7,
      startYear: 2024,
      isCurrent: false,
      endMonth: 8,
      endYear: 2024,
    },
  ],
  educationLevel: 'college' as EducationLevel,
  education: [
    {
      id: '1',
      schoolName: 'University of Texas at Austin',
      degreeType: 'bachelors',
      fieldOfStudy: 'Computer Science',
      graduationYear: 2018,
    },
  ],
  skills: ['leadership', 'project-management', 'public-speaking', 'mentoring'],
}

export default function ProfilePage() {
  const [isLoading, setIsLoading] = useState(true)
  const [showUnsavedModal, setShowUnsavedModal] = useState(false)
  const [pendingNavigation, setPendingNavigation] = useState<string | null>(null)

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
  } = useProfileForm(MOCK_PROFILE_DATA)

  // Handle browser-level navigation warning (beforeunload)
  useUnsavedChangesWarning(hasChanges)

  // Simulate loading
  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 500)
    return () => clearTimeout(timer)
  }, [])

  const handleNavigationAttempt = (href: string) => {
    if (hasChanges) {
      setPendingNavigation(href)
      setShowUnsavedModal(true)
    } else {
      window.location.href = href
    }
  }

  const handleSaveAndLeave = async () => {
    await saveForm()
    setShowUnsavedModal(false)
    if (pendingNavigation) {
      window.location.href = pendingNavigation
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
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-muted-foreground animate-pulse">Loading profile...</div>
      </div>
    )
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
          {/* Sections with staggered animation */}
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
        </div>
      </main>

      {/* Floating Save Button */}
      <SaveButton
        hasChanges={hasChanges}
        changeCount={changeCount}
        onSave={saveForm}
      />

      {/* Unsaved Changes Modal */}
      <UnsavedChangesModal
        isOpen={showUnsavedModal}
        onClose={handleStay}
        onSaveAndLeave={handleSaveAndLeave}
        onDiscardAndLeave={handleDiscardAndLeave}
        onStay={handleStay}
        changeCount={changeCount}
      />
    </div>
  )
}
