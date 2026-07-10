/**
 * Canonicalize a person's name for storage.
 *
 * "Fix only broken casing": a name that is ALL-UPPERCASE or all-lowercase is
 * rewritten in word-aware Title Case; a name that already carries intentional
 * mixed case (McDonald, DeShawn, O'Brien) is returned unchanged so we never
 * flatten a legitimately-cased name. Blank / whitespace-only input becomes null.
 *
 * Applied by the Google Workspace sync (route + script) at write time, so every
 * user inserted or backfilled from the Directory is stored correctly cased
 * regardless of how Google happens to case the source record.
 *
 * DELIBERATE LIMITATION — case is judged over the WHOLE string, not per word.
 * A multi-word value where only one token is broken ('Abdul RAHMAN', 'MUHAMMAD
 * ali') reads as mixed-case and is left untouched. This is intentional: fixing
 * such names per-word would title-case lowercase nobiliary/patronymic particles
 * that are correct as-is ('bin Salman' -> 'Bin Salman', 'van der Berg' -> 'Van
 * Der Berg'), which is a worse failure — especially for this org's names. We
 * only rewrite names we cannot possibly get wrong.
 *
 * Examples:
 *   'ABDUL AZIZ'   -> 'Abdul Aziz'
 *   'mary jane'    -> 'Mary Jane'
 *   "O'BRIEN"      -> "O'Brien"
 *   'McDonald'     -> 'McDonald'      (mixed case preserved)
 *   'John'         -> 'John'          (already correct, unchanged)
 *   'Abdul RAHMAN' -> 'Abdul RAHMAN'  (partial caps — left as-is, see above)
 *   ''             -> null
 */
export function normalizeName(name: string | null): string | null {
  if (name === null || name.trim() === '') return null

  const isAllUpper = name === name.toUpperCase()
  const isAllLower = name === name.toLowerCase()
  // Mixed case is assumed intentional — leave it exactly as-is.
  if (!isAllUpper && !isAllLower) return name

  // Word-aware Title Case, mirroring Postgres initcap(): each run of letters or
  // digits gets its first character uppercased and the rest lowercased, while
  // separators (spaces, hyphens, apostrophes) are preserved. Uses the
  // locale-independent case methods to match the detection above and initcap().
  return name.replace(
    /[\p{L}\p{N}]+/gu,
    (word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase(),
  )
}

/**
 * Resolve a display name from a Supabase-embedded users row. PostgREST returns
 * a single-FK embed as either an object (one row) or a length-1 array; the
 * narrowing handles both shapes. Falls back to a stable placeholder so callers
 * can render a single string regardless of missing/hidden name data.
 */
export type EmbeddedUserName = {
  first_name: string | null
  last_name: string | null
}

export function resolveEmbeddedName(
  embedded: EmbeddedUserName | EmbeddedUserName[] | null,
): string {
  const row = Array.isArray(embedded) ? embedded[0] : embedded
  const first = row?.first_name ?? ''
  const last = row?.last_name ?? ''
  return `${first} ${last}`.trim() || 'Unknown attendee'
}
