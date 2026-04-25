#!/usr/bin/env bun
/**
 * Bundle size guardrail.
 *
 * Reads `.next/app-build-manifest.json`, sums the on-disk size of every chunk
 * referenced by each route, and compares against `bundle-size-baseline.json`.
 *
 * Exits non-zero if any route grows beyond REGRESSION_THRESHOLD vs. its baseline.
 * Pass --update to overwrite the baseline with current sizes (run after intentional changes).
 */

import { readFileSync, statSync, writeFileSync, existsSync } from 'node:fs'
import { join } from 'node:path'

const REGRESSION_THRESHOLD = 0.1 // 10% allowed growth before failing
const ROOT = process.cwd()
const NEXT_DIR = join(ROOT, '.next')
const MANIFEST = join(NEXT_DIR, 'app-build-manifest.json')
const BASELINE_PATH = join(ROOT, 'bundle-size-baseline.json')

interface Manifest {
  pages: Record<string, string[]>
}

interface Baseline {
  generatedAt: string
  totalsByRoute: Record<string, number>
}

function loadManifest(): Manifest {
  if (!existsSync(MANIFEST)) {
    console.error(`No manifest at ${MANIFEST}. Run \`bun run build\` first.`)
    process.exit(1)
  }
  return JSON.parse(readFileSync(MANIFEST, 'utf-8')) as Manifest
}

function computeRouteSizes(manifest: Manifest): Record<string, number> {
  const result: Record<string, number> = {}
  for (const [route, chunks] of Object.entries(manifest.pages)) {
    let total = 0
    for (const chunk of chunks) {
      const p = join(NEXT_DIR, chunk)
      if (existsSync(p)) total += statSync(p).size
    }
    result[route] = total
  }
  return result
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} kB`
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`
}

function main() {
  const update = process.argv.includes('--update')
  const manifest = loadManifest()
  const current = computeRouteSizes(manifest)

  if (update || !existsSync(BASELINE_PATH)) {
    const baseline: Baseline = {
      generatedAt: new Date().toISOString(),
      totalsByRoute: current,
    }
    writeFileSync(BASELINE_PATH, JSON.stringify(baseline, null, 2) + '\n')
    console.log(`Wrote baseline for ${Object.keys(current).length} routes to ${BASELINE_PATH}`)
    return
  }

  const baseline = JSON.parse(readFileSync(BASELINE_PATH, 'utf-8')) as Baseline
  const regressions: string[] = []
  const additions: string[] = []
  const warnings: string[] = []

  for (const [route, size] of Object.entries(current)) {
    const baseSize = baseline.totalsByRoute[route]
    if (baseSize === undefined) {
      additions.push(`  + ${route}: ${formatBytes(size)} (new route)`)
      continue
    }
    const delta = size - baseSize
    const pct = baseSize === 0 ? 0 : delta / baseSize
    if (pct > REGRESSION_THRESHOLD) {
      regressions.push(
        `  ✗ ${route}: ${formatBytes(baseSize)} → ${formatBytes(size)} (+${(pct * 100).toFixed(1)}%)`,
      )
    } else if (pct > REGRESSION_THRESHOLD / 2) {
      warnings.push(
        `  ! ${route}: ${formatBytes(baseSize)} → ${formatBytes(size)} (+${(pct * 100).toFixed(1)}%)`,
      )
    }
  }

  for (const route of Object.keys(baseline.totalsByRoute)) {
    if (!(route in current)) {
      additions.push(`  - ${route}: removed`)
    }
  }

  if (additions.length > 0) {
    console.log('Route changes:')
    for (const line of additions) console.log(line)
  }
  if (warnings.length > 0) {
    console.log(`\nApproaching ${REGRESSION_THRESHOLD * 100}% growth:`)
    for (const line of warnings) console.log(line)
  }
  if (regressions.length > 0) {
    console.error(`\nBundle size regression (>${REGRESSION_THRESHOLD * 100}% over baseline):`)
    for (const line of regressions) console.error(line)
    console.error(
      '\nIf this growth is intentional, run `bun run scripts/check-bundle-size.ts --update` and commit the new baseline.',
    )
    process.exit(1)
  }

  console.log(
    `\nBundle size OK (${Object.keys(current).length} routes, threshold ${REGRESSION_THRESHOLD * 100}%).`,
  )
}

main()
