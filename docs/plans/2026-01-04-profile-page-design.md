# Profile Page Design

**Date:** 2026-01-04
**Status:** Ready for Implementation

## Overview

Build a profile page that displays all user information collected during onboarding. Users can view and edit their own profile with a seamless, frictionless experience that encourages keeping profiles up to date.

## Scope

- **In Scope:** Personal profile view and editing ("my profile")
- **Out of Scope:** Public-facing profile view (future consideration)
- **Out of Scope:** Navigation/access point from landing page (separate design)

## Data Model

The profile displays all data from `OnboardingData`:

### Simple Fields (Inline Editing)
| Field | Type | Editable | Notes |
|-------|------|----------|-------|
| Phone Number | string | ✅ | |
| Personal Email | string | ✅ | |
| Google Auth Email | string | ❌ | Read-only, @youngmuslims.com |
| Ethnicity | string | ✅ | Dropdown selection |
| Date of Birth | Date | ✅ | Date picker |
| Subregion | string | ✅ | Searchable dropdown |
| NeighborNet | string | ✅ | Searchable dropdown |

### Complex Sections (Expandable Cards)

#### YM Roles
```typescript
interface YMRoleEntry {
  id: string
  roleTypeId?: string
  roleTypeCustom?: string
  amirUserId?: string
  amirCustomName?: string
  startMonth?: number
  startYear?: number
  endMonth?: number
  endYear?: number
  isCurrent: boolean
  description?: string
}
```

#### YM Projects
```typescript
interface YMProjectEntry {
  id: string
  projectType?: string
  projectTypeCustom?: string
  role?: string
  amirUserId?: string
  amirCustomName?: string
  startMonth?: number
  startYear?: number
  endMonth?: number
  endYear?: number
  isCurrent: boolean
  description?: string
}
```

#### Education
```typescript
interface EducationEntry {
  id: string
  schoolName?: string
  schoolCustom?: string
  degreeType?: string
  fieldOfStudy?: string
  graduationYear?: number
}
```

### Skills (Chip Selector)
- Array of 3-5 selected skills from predefined list
- Toggle chips on/off to add/remove

## UX Patterns

### 1. Inline Editing (Simple Fields)
- Click any field to enter edit mode
- Field transforms into appropriate input (text, dropdown, date picker)
- Click away or press Enter to confirm
- Visual indicator on hover showing editability

### 2. Expandable Cards (Complex Sections)
- Each entry shown as collapsed card with summary
- Click card to expand full edit form
- Add new entry button at section bottom
- Delete entry via button within expanded card
- Drag-to-reorder (future enhancement)

### 3. Chip Selector (Skills)
- All available skills shown as chips
- Selected chips are highlighted/filled
- Click to toggle selection
- Counter shows "X of 5 selected"

### 4. Global Save
- Floating save button appears when changes exist
- Shows count of unsaved changes
- Single action saves all modifications
- Success toast on save completion

### 5. Unsaved Changes Warning
- Modal appears when navigating away with unsaved changes
- Options: "Save & Leave", "Discard Changes", "Stay"
- Prevents accidental data loss

## Component Architecture

```
src/app/profile/
├── page.tsx                    # Main profile page
├── components/
│   ├── ProfileHeader.tsx       # User name, avatar, email
│   ├── PersonalInfoSection.tsx # Simple inline-edit fields
│   ├── LocationSection.tsx     # Subregion, NeighborNet
│   ├── YMRolesSection.tsx      # Expandable role cards
│   ├── YMProjectsSection.tsx   # Expandable project cards
│   ├── EducationSection.tsx    # Education level + entries
│   ├── SkillsSection.tsx       # Chip selector
│   ├── InlineEditField.tsx     # Reusable inline edit component
│   ├── ExpandableCard.tsx      # Reusable expandable card
│   ├── SaveButton.tsx          # Floating save button
│   └── UnsavedChangesModal.tsx # Navigation warning modal
└── hooks/
    └── useProfileForm.ts       # Form state management
```

## Tech Stack

- **UI Components:** shadcn/ui
- **Form State:** React useState + custom hook
- **Animations:** Tailwind + CSS transitions
- **Icons:** Lucide React (included with shadcn)

## Visual Design

- Clean, card-based layout
- Subtle hover states indicating interactivity
- Consistent spacing using Tailwind's scale
- Mobile-responsive (single column on small screens)
- Follow existing app design language

## Implementation Phases

### Phase 1: Core Structure
- [ ] Profile page route and layout
- [ ] Section components with static display
- [ ] Data fetching from backend

### Phase 2: Inline Editing
- [ ] InlineEditField component
- [ ] Integration with simple fields
- [ ] Form state management hook

### Phase 3: Complex Sections
- [ ] ExpandableCard component
- [ ] YM Roles section
- [ ] YM Projects section
- [ ] Education section

### Phase 4: Skills & Save
- [ ] Chip selector for skills
- [ ] Global save button
- [ ] Unsaved changes modal
- [ ] API integration for save

## Open Questions (Resolved)

| Question | Decision |
|----------|----------|
| Edit pattern | Hybrid: inline + expandable cards + chips |
| Save pattern | Global save button |
| Unsaved changes | Warning modal |
| Non-editable fields | Google auth email only |
