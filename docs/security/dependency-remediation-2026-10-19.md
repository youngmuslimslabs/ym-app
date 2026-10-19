# Dependency remediation (#82), 2026-10-19

The pre-update lockfile reported 90 advisories, including 46 high. This change
reduces the full scan to **one high advisory**; the production-dependency scan
reports **no advisories**, and the critical threshold passes. No advisory is
suppressed and the existing CI audit policy is unchanged.

## Updated dependencies

- Next.js and eslint-config-next: 15.5.24 → 15.5.27.
- Vitest and its coverage provider are aligned at 4.1.12.
- Compatible fixes cover sharp 0.35.5, ws 8.21.0, undici 7.29.1, Vite 7.3.5,
  Rollup and other affected transitive packages in the lockfile.
- Pin PostCSS 8.5.23 through overrides because Next's exact nested 8.4.31 otherwise
  retains vulnerable source-map behavior. Pin postcss-selector-parser 7.1.6 because
  the Tailwind/PostCSS dependency ranges retain the affected older parser. The
  parser crosses a major version; the production CSS build and app tests were
  checked after that override. Do not remove either override without rescanning
  all nested versions.

## Remaining advisory

`braces@3.0.3` is affected by
[GHSA-vfj7-8cjw-p6xm](https://github.com/advisories/GHSA-vfj7-8cjw-p6xm): deeply
nested patterns can exhaust the stack. No fixed published version is available as
of this scan. It is retained through Tailwind's micromatch/chokidar build tooling
and eslint's glob tooling. `bun audit --prod` does not include it. Do not interpret
that dependency classification as a guarantee that every build environment is
safe for untrusted patterns. Keep build inputs controlled and track the upstream
fix; do not silence this finding or upgrade the entire styling framework solely
to make the report appear clean.

The security issue stays open: this unpatched advisory and the separate live
database/identity review from PR #106 still need follow-up. This dependency PR
does not apply migration 00026, change RLS or modify Workspace accounts.

## Validation

- All 375 app tests pass with Node 20, including the coverage run; no threshold or
  coverage exclusion was relaxed.
- Production build passes with Next 15.5.27, including CSS processing through the
  overridden PostCSS/parser chain. Existing Next/PostHog and lint warnings remain.
- TypeScript passes; lint has no errors (five existing warnings).
- Native sharp smoke check: PNG decode, resize and JPEG/WebP/PNG encode/metadata.
- Local-only WebSocket smoke check: connect, send, echo, receive and close.
- `bun install --frozen-lockfile` succeeds with Bun 1.2.21, the CI/Netlify version.
- Full advisory scan: one high, zero critical. Production dependency scan: zero.

These are local compatibility and advisory checks, not a hosted authenticated
acceptance test. Scanner results can change as new advisories are published.
