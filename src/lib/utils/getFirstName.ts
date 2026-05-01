export function getFirstName(fullName: string, fallback = 'Member'): string {
  const trimmed = fullName.trim()
  if (!trimmed) return fallback
  return trimmed.split(/\s+/)[0]
}
