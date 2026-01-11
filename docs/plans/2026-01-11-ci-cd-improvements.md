# CI/CD Improvements Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Improve CI/CD reliability by adding TypeScript checking, ensuring consistency between GitHub Actions and Netlify, and cleaning up unused workflow files.

**Architecture:** GitHub Actions handles quality gates (lint, type-check, test, build). Netlify handles deployment. Both use identical Bun versions via explicit configuration.

**Tech Stack:** GitHub Actions, Netlify, Bun 1.2, Next.js

---

## Task 1: Update CI Workflow

**Files:**
- Modify: `.github/workflows/ci.yml`

**Step 1: Add environment variable and TypeScript check**

Replace the entire file with:

```yaml
name: CI

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

env:
  BUN_VERSION: "1.2"

jobs:
  ci:
    runs-on: ubuntu-latest

    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup Bun
        uses: oven-sh/setup-bun@v2
        with:
          bun-version: ${{ env.BUN_VERSION }}

      - name: Install dependencies
        run: bun install --frozen-lockfile

      - name: Run linter
        run: bun run lint

      - name: Type check
        run: bunx tsc --noEmit

      - name: Run tests
        run: bun run test

      - name: Build
        run: bun run build
```

**Step 2: Verify the changes**

Run: `cat .github/workflows/ci.yml`
Expected: File contains `BUN_VERSION: "1.2"` and `bunx tsc --noEmit` step

---

## Task 2: Create Netlify Configuration

**Files:**
- Create: `netlify.toml`

**Step 1: Create the configuration file**

Create `netlify.toml` with:

```toml
[build]
  command = "bun run build"
  publish = ".next"

[build.environment]
  NODE_VERSION = "20"
  BUN_VERSION = "1.2"

# Deploy Preview settings (for PRs)
[context.deploy-preview]
  command = "bun run build"

# Production settings
[context.production]
  command = "bun run build"

# Local development with Netlify Dev CLI
[dev]
  command = "bun run dev"
  port = 3000
```

**Step 2: Verify the file exists**

Run: `cat netlify.toml`
Expected: File contains `command = "bun run build"` and `BUN_VERSION = "1.2"`

---

## Task 3: Delete Unused Workflow Files

**Files:**
- Delete: `.github/workflows/blank.yml`
- Delete: `.github/workflows/github-actions-demo.yml`

**Step 1: Delete blank.yml**

Run: `rm .github/workflows/blank.yml`

**Step 2: Delete github-actions-demo.yml**

Run: `rm .github/workflows/github-actions-demo.yml`

**Step 3: Verify deletion**

Run: `ls .github/workflows/`
Expected: Only `ci.yml` remains

---

## Task 4: Add Future CI/CD Todos

**Files:**
- Modify: `docs/project-todos.md`

**Step 1: Add CI/CD section**

Add the following section after the "Testing" section (around line 183, before "Technical Debt / Cleanup"):

```markdown
## CI/CD Enhancements (Future)

- [ ] Add test coverage threshold (fail CI if coverage drops below 80%)
- [ ] Add bundle size check (warn if build output grows significantly)
- [ ] Add E2E tests with Playwright to CI
- [ ] Add accessibility checks (axe-core) to CI
- [ ] Add security scanning (dependency audit) to CI

---
```

**Step 2: Verify the addition**

Run: `grep -A 6 "CI/CD Enhancements" docs/project-todos.md`
Expected: Shows the new section with 5 todo items

---

## Task 5: Verify CI Locally

**Step 1: Run lint**

Run: `bun run lint`
Expected: No errors

**Step 2: Run type check**

Run: `bunx tsc --noEmit`
Expected: No errors

**Step 3: Run tests**

Run: `bun run test`
Expected: All tests pass

**Step 4: Run build**

Run: `bun run build`
Expected: Build succeeds

---

## Task 6: Commit All Changes

**Step 1: Stage all changes**

Run: `git add -A`

**Step 2: Verify staged changes**

Run: `git status`
Expected: Shows modified `ci.yml`, `project-todos.md`, new `netlify.toml`, deleted `blank.yml` and `github-actions-demo.yml`

**Step 3: Commit**

```bash
git commit -m "$(cat <<'EOF'
feat(ci): add TypeScript checking and Netlify config

- Add TypeScript type checking to CI pipeline (bunx tsc --noEmit)
- Create netlify.toml to ensure Netlify uses Bun (matching CI)
- Delete unused workflow files (blank.yml, github-actions-demo.yml)
- Add future CI/CD enhancement todos to project-todos.md
EOF
)"
```

**Step 4: Verify commit**

Run: `git log -1 --oneline`
Expected: Shows the new commit
