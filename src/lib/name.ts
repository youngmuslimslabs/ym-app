/**
 * Canonicalize a person's name for storage.
 *
 * "Fix only broken casing": a name that is ALL-UPPERCASE or all-lowercase is
 * rewritten in word-aware Title Case; a name that already carries intentional
 * mixed case (McDonald, DeShawn, O'Brien) is returned unchanged so we never
 * flatten a legitimately-cased name.
 *
 * Applied by the Google Workspace sync (route + script) at write time, so every
 * user inserted or backfilled from the Directory is stored correctly cased
 * regardless of how Google happens to case the source record.
 *
 * Examples:
 *   'ABDUL AZIZ' -> 'Abdul Aziz'
 *   'mary jane'  -> 'Mary Jane'
 *   "O'BRIEN"    -> "O'Brien"
 *   'McDonald'   -> 'McDonald'   (mixed case preserved)
 *   'John'       -> 'John'       (already correct, unchanged)
 */
export function normalizeName(name: string | null): string | null {
  if (name === null) return null

  const isAllUpper = name === name.toUpperCase()
  const isAllLower = name === name.toLowerCase()
  // Mixed case is assumed intentional — leave it exactly as-is.
  if (!isAllUpper && !isAllLower) return name

  // Word-aware Title Case, mirroring Postgres initcap(): each run of letters or
  // digits gets its first character uppercased and the rest lowercased, while
  // separators (spaces, hyphens, apostrophes) are preserved.
  return name.replace(
    /[\p{L}\p{N}]+/gu,
    (word) => word.charAt(0).toLocaleUpperCase() + word.slice(1).toLocaleLowerCase(),
  )
}
