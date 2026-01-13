# Code Cleanup and Amir Dropdown Implementation

**Date:** 2026-01-13
**Status:** Approved for implementation

---

## Summary

Clean up obsolete TODO comments and dead code, then replace hardcoded amir dropdowns with real Supabase data.

---

## Problem

The codebase contains:
1. **Dead code:** `src/app/people/mock-data.ts` (200+ lines) - not used anywhere
2. **Obsolete TODOs:** Comments for work already completed by middleware/migrations
3. **Placeholder data:** `YMRolesSection` and `YMProjectsSection` use hardcoded amir names instead of fetching from Supabase

---

## Solution

### Part 1: Cleanup
- Delete `src/app/people/mock-data.ts` (people directory uses real Supabase data)
- Remove TODO comments in `src/app/login/page.tsx` (middleware handles onboarding redirects)
- Fix remaining TODOs by implementing proper Supabase queries

### Part 2: Amir Dropdown Implementation

**Fetch all users from Supabase:**
- Query: `SELECT id, first_name, last_name FROM users ORDER BY first_name, last_name`
- Transform to `ComboboxOption[]` format
- Fetch once on component mount, cache in React state

**Why fetch all users:**
- Historical accuracy: Anyone could have been in any position historically
- Small dataset: ~5,000 users max = ~100-200KB
- Client-side filtering: `SearchableCombobox` (cmdk) handles thousands of items instantly
- Prevents data loss when people change roles

**Update behavior:**
- Updates on page load/refresh (standard web app pattern)
- No real-time subscriptions needed (data changes infrequently)

---

## Implementation

### 1. Create User Query Function

**File:** `src/lib/supabase/queries/users.ts` (new)

```typescript
import { createClient } from '@/lib/supabase/client'
import type { ComboboxOption } from '@/components/searchable-combobox'

/**
 * Fetch all users for amir selection dropdowns
 * Returns sorted list with full names
 */
export async function fetchAllUsersForSelection(): Promise<{
  data: ComboboxOption[] | null
  error: string | null
}> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('users')
    .select('id, first_name, last_name')
    .order('first_name', { ascending: true })
    .order('last_name', { ascending: true })

  if (error) {
    return { data: null, error: error.message }
  }

  const options: ComboboxOption[] = data.map(user => ({
    value: user.id,
    label: `${user.first_name} ${user.last_name}`,
  }))

  return { data: options, error: null }
}
```

### 2. Update YMRolesSection

**File:** `src/app/profile/components/YMRolesSection.tsx`

**Remove:**
```typescript
// TODO: Fetch from Supabase users table
const PLACEHOLDER_AMIRS: ComboboxOption[] = [
  { value: 'user-1', label: 'Ahmed Hassan' },
  // ... hardcoded data
]
```

**Add imports:**
```typescript
import { useEffect } from 'react'
import { fetchAllUsersForSelection } from '@/lib/supabase/queries/users'
```

**Add state (after existing useState declarations):**
```typescript
const [amirOptions, setAmirOptions] = useState<ComboboxOption[]>([])
const [isLoadingAmirs, setIsLoadingAmirs] = useState(true)
```

**Add fetch effect (after existing useEffects):**
```typescript
useEffect(() => {
  async function loadAmirs() {
    const { data, error } = await fetchAllUsersForSelection()
    if (data) {
      setAmirOptions(data)
    }
    setIsLoadingAmirs(false)
  }
  loadAmirs()
}, [])
```

**Update SearchableCombobox (replace PLACEHOLDER_AMIRS):**
```typescript
<SearchableCombobox
  options={amirOptions}
  // ... rest of props unchanged
/>
```

### 3. Update YMProjectsSection

**File:** `src/app/profile/components/YMProjectsSection.tsx`

Same changes as YMRolesSection:
- Remove `PLACEHOLDER_AMIRS`
- Add imports
- Add state
- Add fetch effect
- Update `SearchableCombobox` to use `amirOptions`

### 4. Remove Obsolete TODOs

**File:** `src/app/login/page.tsx`

Remove TODO comments on lines 16 and 36 (middleware already handles this logic).

### 5. Delete Dead Code

**File:** `src/app/people/mock-data.ts`

Delete entire file (not imported anywhere, people directory uses real Supabase data).

---

## Files Changed

| Action | File |
|--------|------|
| Create | `src/lib/supabase/queries/users.ts` |
| Modify | `src/app/profile/components/YMRolesSection.tsx` |
| Modify | `src/app/profile/components/YMProjectsSection.tsx` |
| Modify | `src/app/login/page.tsx` |
| Delete | `src/app/people/mock-data.ts` |

---

## Verification

### Build & Tests
```bash
bun run build       # No TypeScript errors
bun test            # All tests pass
```

### Manual Testing (Chrome DevTools MCP)
1. Navigate to `/profile`
2. Expand "YM Roles" section
3. Click "Add Role"
4. Click amir dropdown → verify real user names appear (not placeholder data)
5. Verify dropdown is searchable and filters work
6. Repeat for "YM Projects" section
7. Check Network tab: verify single query to `users` table on component mount
8. Navigate away and back → verify fresh data fetch

### Success Criteria
- ✅ No TypeScript errors
- ✅ All tests pass
- ✅ Amir dropdowns show real users from Supabase
- ✅ Dropdowns are searchable/filterable
- ✅ No console errors
- ✅ No hardcoded placeholder data remains
- ✅ TODO comments removed from code
