# YM App — UI/UX Design Audit & Recommendations

**Date:** 2026-02-16
**Status:** In progress (login page redesign implemented)

---

## 1. Accessibility Review (WCAG 2.1)

### Critical (3 issues)

**[A11Y] `src/app/onboarding/components/OnboardingLayout.tsx:72` — Icon-only button missing accessible name**
```tsx
<button onClick={handleRetry} className="shrink-0 rounded-sm p-1 hover:bg-destructive/10">
  <RotateCw className="h-3.5 w-3.5" />
</button>
```
- Fix: Add `aria-label="Retry saving"`
- WCAG: 4.1.2

**[A11Y] Dark mode is non-functional — `prefers-color-scheme` is ignored**
- Tailwind config has `darkMode: ["class"]` but no mechanism adds the `dark` class to `<html>`
- Users who prefer dark themes get pure white regardless
- Fix: Add a system preference detector or theme toggle
- WCAG: 1.4.11 (Non-text Contrast)

**[A11Y] `src/app/people/constants.ts:7-15` — Color-only role categorization with hardcoded colors** ✅ FIXED
- ~~Uses arbitrary Tailwind colors (violates design system rule)~~
- ~~Colors are the only visual distinction between role categories — no icons or prefixes~~
- ~~No dark mode variants — will clash once dark mode works~~
- **FIXED** — `ROLE_CATEGORY_STYLES` replaced with `ROLE_CATEGORY_ICONS`. All 7 categories now share a single neutral `Badge variant="outline"` chrome and are differentiated by per-category Lucide icons (`Landmark`, `Users`, `Map`, `MapPin`, `Network`, `Briefcase`, `Cloud`). Color is no longer a category signal.
- WCAG: 1.4.1

### Serious (2 issues)

**[A11Y] `src/components/auth/YMLoginForm.tsx:18` — Logo icon had no semantic meaning**
- ~~`GalleryVerticalEnd` was a generic Lucide icon unrelated to YM brand~~
- **FIXED** — Replaced with actual YM logo via `next/image` with `alt="Young Muslims"`

**[A11Y] `src/app/onboarding/step1-personal-info.tsx:188-189` — Select trigger icon overlap**
- Globe icon overlaps Select trigger at `left-3` using absolute positioning and `z-10`
- Can cause touch target issues on mobile
- Fix: Add `pointer-events-none` to the icon or move inside the trigger

### Moderate (2 issues)

**[A11Y] `src/components/home/QuickActionCard.tsx:28` — Focus ring on wrong element**
- `focus-visible:ring-2` is on the Card, but the Link wrapper is the actual focusable element

**[A11Y] `src/app/people/components/PersonCard.tsx:40-46` — `role="link"` on a div**
- Properly handled with `tabIndex`, `onKeyDown`, and `aria-label`
- A real `<a>` tag would be better for native semantics and right-click behavior

---

## 2. Visual Design Problems — Why It Feels Boring

### A. Typography — Flat and Undifferentiated

| Issue | Where | Impact |
|-------|-------|--------|
| Single font family (Geist Sans) everywhere | `layout.tsx` | No typographic hierarchy — headings, body, labels all feel the same |
| No display font for hero moments | Login, Onboarding, Home | `text-4xl font-semibold` onboarding headings are clean but forgettable |
| `tracking-tight` everywhere | Multiple files | When everything is tight-tracked, nothing feels special |
| No text size scale beyond defaults | All pages | `text-sm`, `text-lg`, `text-xl`, `text-2xl` — very flat hierarchy |

### B. Color & Atmosphere — Clinical Monochrome

| Issue | Where | Impact |
|-------|-------|--------|
| Pure white backgrounds | All pages (light mode) | `--background: 1 0 0` and `--card: 1 0 0` are identical — no depth between layers |
| Single accent color (blue) used for everything | Brand, links, badges, icons, hover states | Blue fatigue — no secondary accent |
| No background texture or atmosphere | Login, Home, Onboarding | Flat white/dark with no gradients, patterns, or grain |
| PersonalContextCard gradient nearly invisible | Home page | `from-primary/5 to-primary/10` is a 5%→10% opacity gradient — barely visible |
| Muted foreground too subtle | `--muted-foreground: 0.556 0 0` | Secondary text disappears into white |

### C. Layout & Spatial Composition — Everything is Centered

| Issue | Where | Impact |
|-------|-------|--------|
| Every page is `flex items-center justify-center` | Login, Home, Onboarding | Feels like a loading screen, not a destination |
| Uniform `max-w-2xl` or `max-w-md` | All pages | No breakout moments, no full-bleed elements |
| No visual anchoring on login page | Login | ~70% of viewport is empty white space |
| QuickActionCards are tiny | Home page | 3 small cards feel like a placeholder |
| Home page is a card + 3 links | Home | Less content than most 404 pages |

### D. Components & Interactions — Stock shadcn

| Issue | Where | Impact |
|-------|-------|--------|
| Cards are all identical | Everywhere | PersonCard, QuickActionCard, ExpandableCard — same white box |
| Only interaction is hover-lift | QuickActionCard, PersonCard | `hover:-translate-y-1 hover:shadow-lg` gets repetitive |
| No micro-interactions | Buttons, toggles, transitions | Everything feels mechanical |
| Empty avatar is just initials | PersonCard, Sidebar | No interesting generative avatar |
| PageLoader is a pulsing favicon | `page-loader.tsx` | Functional but forgettable |

### E. Mobile Experience

| Issue | Where | Impact |
|-------|-------|--------|
| Login page wastes 60%+ of mobile viewport | Login (375px) | Content starts at center, top half is blank |
| No mobile-specific layout adaptations | Home, Profile | Same centered layout, just narrower |
| Hamburger menu opens generic shadcn Sheet | AppShell | No branding in mobile nav experience |

---

## 3. Design Recommendations

### HIGH IMPACT — Transforms the feel immediately

#### 1. Login page — identity and warmth ✅ IMPLEMENTED

- ~~Replace `GalleryVerticalEnd` icon with actual YM logo~~ Done
- ~~Add geometric pattern background with ambient depth~~ Done
- ~~Frosted glass card treatment~~ Done
- ~~Staggered entry animations~~ Done
- ~~Logo glow ring~~ Done

#### 2. Home page — make it a real dashboard (partial ✅)

- ~~PersonalContextCard should be larger and more prominent~~ Replaced — identity now renders as plain editorial typography under a "Who you are" eyebrow; the gradient card wrapper is gone. The home page no longer has any card chrome at all (D direction).
- ~~Add time-of-day greeting ("Assalamu alaykum, Omar")~~ Done — `Greeting` component renders "Assalamu alaykum, {firstName}." with the name in cobalt. No time/date subtitle (intentionally simpler than the audit's literal suggestion).
- ~~QuickActionCards need more visual weight — larger icons, category-specific tints~~ Replaced — `QuickActionList` is a typographic list, not separate cards. "Category-specific tints" remains deferred to the brand-direction conversation (would need secondary accent decision).
- "Add a 'recent activity' or 'upcoming' section" — _partially addressed via `StatsStrip` (Active members / NeighborNets / New this week)._ A full activity feed remains unresolved; the conditional `ConferenceAttendanceSection` (lands once `feature/conferences` reaches `main`) covers the most important "upcoming" case for attendees.

#### 3. Surface depth — differentiate layers (partial ✅)

- ~~Make `--card` slightly different from `--background` (e.g., `0.99 0 0` vs `1 0 0`, or a very slight warm tint)~~ Done — `--card` light mode now `0.99 0 0` (1% darker, neutral). Dark mode already differentiated.
- Add subtle shadows to cards by default (not just on hover) — _deferred, separate decision_
- Consider a faint sidebar/page-level background distinction — _deferred, separate decision_

#### 4. Add a secondary accent color

- Blue alone creates a one-note palette
- A warm accent (amber/gold for Islamic motifs, or teal/green for growth) would add visual interest
- Use for badges, highlights, or specific categories

### MEDIUM IMPACT — Elevates quality

#### 5. Typography pairing

- Add a display font for hero headings (login title, onboarding step titles, page headers)
- Even a weight variant of Geist (Black/Ultra) would help
- Consider a serif or decorative font for the "Young Muslims" brand name in sidebar

#### 6. Animations & transitions (partial ✅)

- Page transitions between onboarding steps (slide left/right) — _deferred, separate decision_
- ~~Staggered card reveals on People page as they load~~ Done — `PersonCardGrid` wraps each card in `animate-in fade-in slide-in-from-bottom-2 duration-200` with `animationDelay: ${Math.min(index * 50, 300)}ms`.
- ~~Button press feedback (subtle scale on active)~~ Done — picked color-darken (`active:bg-*/80`) over scale for restraint; aligns with the existing `hover:bg-*/90` pattern. All `Button` CVA variants except `link` got an `active:` darken state.
- Skeleton loading states should shimmer, not be static gray — _deferred (cheesiness risk in a calm/utilitarian brand; existing `animate-pulse` stays)_

#### 7. PersonCard avatars

- Generate colorful gradient backgrounds from user initials (hash the name to pick from a palette)
- This alone would make the People directory feel more alive

#### 8. Fix ROLE_CATEGORY_STYLES ✅ IMPLEMENTED

- ~~Replace arbitrary Tailwind colors with design-token-based styles~~ Done (no per-category color at all — single neutral chrome)
- ~~Add icon prefixes per category so color isn't the only differentiator~~ Done (`ROLE_CATEGORY_ICONS` map)
- ~~Create dark mode variants~~ Not needed — neutral outline badge inherits from `--foreground` / `--border` tokens which already have dark values

### POLISH — Details that matter

#### 9. Implement dark mode

- Infrastructure is there (`darkMode: ["class"]`), just needs connection
- Add system preference detection or a manual toggle

#### 10. Add empty state illustrations

- Lucide-icon-in-circle pattern is fine but visually flat
- Simple SVG illustrations would add personality

#### 11. Branded loading states

- PageLoader (pulsing favicon) should feel branded
- Consider a brief animation or brand-colored spinner

---

## 4. Summary Scores

| Category | Score | Notes |
|----------|-------|-------|
| Accessibility | 68/100 | 3 critical, 2 serious, 2 moderate |
| Visual Design | 45/100 | Stock shadcn with no creative direction |
| Code Quality | 90/100 | Clean architecture, solid patterns |
| Design Token System | 85/100 | Well-architected OKLCH system, ready for theming |

### What's actually good

- Clean component architecture (server components, proper patterns)
- Solid accessibility foundations (sr-only labels, keyboard handlers)
- Design token system well-architected for theming
- PWA support with safe-area insets
- Consistent spacing and sizing standards

### What makes it boring

- Zero brand personality — could be any app
- Monochrome palette with invisible accent usage
- Every page is centered single-column max-w-2xl
- No textures, patterns, illustrations, or atmosphere
- Home page has almost no content
- Single font doing everything
- Dark mode configured but non-functional
