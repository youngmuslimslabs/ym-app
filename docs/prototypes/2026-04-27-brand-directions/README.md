# YM App — Brand Direction Prototypes

**Date:** 2026-04-27
**Surface:** Home page (the weakest surface per the Feb visual audit, and the highest-component-variety canvas)
**Format:** Self-contained HTML files — open in any browser, no build step
**Goal:** Brand discovery, not implementation. Three deliberate departures from "stock shadcn" to surface what should become the brand kit.

---

## Open this first

```
open index.html
```

The index page shows all three directions side-by-side with thumbnails and lets you click into each. Each individual prototype is a standalone HTML file with embedded fonts (Google Fonts CDN) and CSS.

## File map

| File | Direction | Influence | Mood |
|---|---|---|---|
| `index.html` | Gallery / comparison | — | Neutral curatorial overview |
| `01-maghrib.html` | Modern Atmospheric | Spotify post + Giving Tuesday | Sleek, gradient, app-native |
| `02-diwan.html` | Editorial Serif | Testimonial + Eid Mubarak | Magazine-quality, ceremonial, slow |
| `03-mihrab.html` | Classical Islamic | Ramadan + Eid + Brothers | Lush, pattern-as-system, classical |

---

## What I pulled from the YM IG

The 6 Instagram posts you shared have a stronger brand DNA than the website. Three threads:

### Color
Three palettes recur across the posts:
- **Deep navy → forest green diagonal gradients** (Spotify post, Giving Tuesday, Eid)
- **Warm peach / cream gradients** (testimonial story)
- **Solid royal cobalt + gold + Islamic pattern** (Ramadan, Eid)

**Cobalt blue is the through-line** — it's also already your app's `--primary` (`#254FA0` / `oklch(0.445 0.14 261.872)`). Every direction below preserves cobalt as the anchor.

### Typography
Two consistent moves:
- **Tall editorial serif in big caps** for ceremonial moments ("YOUNG MUSLIMS", "EID MUBARAK") — magazine-quality
- **Arabic calligraphy in gold** for religious salutations — Eid, Ramadan posts
- Body copy is always clean sans-serif
- Italic serif for warmth ("is on Spotify" subhead)
- The Brothers Coordinators graphic is the outlier — bold italic geometric sans, sports-team energy

### Decorative
- Islamic geometric patterns appear as **corner frames** (testimonial, Eid) and **full backdrops** (Ramadan, faded)
- Mosque silhouettes are silhouettes, not illustrations
- Logo M letterform doubles as oversized watermark (Brothers Coordinators)

---

## The three directions

### 01 · Maghrib (المغرب) — Modern Atmospheric
**Inspired by:** Spotify post + Giving Tuesday

- Vertical sunset gradient (deep navy → twilight → forest green) as the **signature treatment**
- **Bricolage Grotesque** display (variable width + weight axes, characterful), **Geist Sans** body, **Amiri** for Arabic
- Warm gold accent only for emphasis
- Glass-morphism cards on a layered atmosphere with drifting orbs
- Massive M letterform as a low-contrast watermark
- **Best for:** A product that wants to feel like Spotify-meets-mosque — modern, app-native, atmospheric

**Tradeoff:** Strongest *modern* feel, but the gradient + dark mode is a bigger lift to retrofit across the existing app (which is currently light-mode-only).

### 02 · Diwan (ديوان) — Editorial Serif
**Inspired by:** Testimonial story + Eid Mubarak

- Cream paper background with subtle grain, deep cobalt + gilt gold accents
- **Fraunces** serif display in caps with the SOFT axis dialed up for warmth, **Geist Sans** body
- Asymmetric editorial layout — masthead, ruled-line TOC for actions, "feature article" for the conference
- Drop cap on the deck, magazine-style ornaments
- Geometric pattern in **corners only**, not edge-to-edge
- **Best for:** A product that wants to feel like a thoughtful magazine — slow, considered, ceremonial without being formal

**Tradeoff:** Most distinctive aesthetic, but editorial layouts are harder to scale to dense data screens (admin, people directory, schedule grids). Works beautifully on home/landing/conference detail; needs adaptation rules for tables.

### 03 · Mihrab (محراب) — Classical Islamic
**Inspired by:** Ramadan + Eid + Brothers Coordinators

- Solid royal cobalt with **full Islamic geometric tessellation** as the system, faded with vertical gradient so it doesn't overwhelm
- **Cinzel** lapidary Roman caps for display, **Big Shoulders Display Italic** for statistical numerals (the sports-team energy from your Brothers graphic), **Geist** for body, **Amiri** for Arabic
- Gold + cream on cobalt, never pure white
- Mihrab-arched quick-action cards, decree-frame for the conference, mosque silhouette as page-foot anchor
- **Best for:** Leaning fully into religious-cultural identity — for a community-of-faith app, not a generic tool

**Tradeoff:** Most committed/distinctive. Also the most polarizing — works for the YM-specific audience but would feel "too much" if the org pivots toward a more secular professional tool. Pattern fatigue is a real risk on long sessions.

---

## Principles applied

These prototypes lean on **Refactoring UI** principles (Adam Wathan + Steve Schoger):

- **Hierarchy via size + weight + color + spacing**, not just bold weight
- **Depth via layered backgrounds**, not borders alone (every direction has 2+ background layers)
- **Color**: a dominant + a single sharp accent, not 5 evenly-distributed colors
- **Typography**: a distinctive display + a refined body, never a single font doing everything
- **Spacing**: irregular > uniform — generous whitespace, asymmetric grids in Diwan, tight density in Mihrab arches

Plus **frontend-design** skill principles:
- Each direction commits to a clear conceptual flavor, doesn't hedge
- Atmosphere via gradient meshes, noise textures, geometric patterns — not solid colors
- Type pairings deliberately departed from generic AI defaults (no Inter, no Roboto, no Space Grotesk)

---

## How to evaluate

When opening each prototype, ask:

1. **First-glance reaction** — what feeling does this trigger? (Excited / cold / "fancy" / "not me")
2. **Audience fit** — would a 17-year-old YM member feel at home here? Would a 45-year-old NeighborNet coordinator?
3. **Surface scalability** — imagine the People directory in this language. The admin conference editor. The expense form. Does the language hold or break?
4. **Cultural read** — does it feel Muslim-American-modern (warm + identity-rooted) or Muslim-Arabic-formal (ceremonial + traditional) or secular-tool-with-Islamic-touches (neutral + accent)? All three are valid; pick the one the org is.
5. **Build cost** — what fonts, what tokens, what new component primitives would each require?

There's no wrong answer — and you can mix. Maghrib's gradient + Diwan's serif headlines + Mihrab's pattern frames could combine into a fourth language that's better than any single direction.

---

## What's next (if you pick a direction)

If one resonates clearly, the next steps:

1. **Codify tokens** — extract the chosen direction's palette + type into `globals.css` as new tokens (or replace the current ones). Add `--success`, `--warning`, `--accent-gold` if missing.
2. **Update font loading** — currently `layout.tsx` only loads Geist. Add the chosen display font.
3. **Adapt one secondary surface** — pick the conference detail page or login page and apply the language. This catches scalability issues before propagating system-wide.
4. **Pair with the action plan** — `docs/plans/2026-04-27-design-critique-action-plan.md` covers usability fixes; this covers visual direction. They run in parallel — visual work shouldn't block usability and vice versa.
5. **Test on a real device** — these prototypes are desktop-first. Open on iPhone (the actual YM app target) and verify the language survives the smaller canvas.

If none resonate, that's also useful information — it means the answer is something we haven't explored yet (e.g., illustration-heavy, photo-driven, type-only minimalist, etc.). Tell me what's missing and we can iterate.

---

## Notes & caveats

- **All three preserve cobalt** as anchor color — chosen specifically so any direction can ramp into the existing app without a brand-color migration.
- **Geist body in all three** — for the same reason. Body type is the highest-frequency surface; consistency there cushions the display-font departure.
- **No real avatars / images** — these prototypes use placeholders. Real photos of YM events would significantly elevate any of these directions.
- **Desktop-only layouts shown** — the mobile breakpoints exist in the CSS but are simplified. A real adoption would need full mobile design passes.
- **Fonts loaded from Google Fonts CDN** — fine for prototypes, but production would self-host (`localFont` like the existing Geist setup) for performance + offline-capable PWA behavior.
