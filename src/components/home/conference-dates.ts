const MONTH_DAY = new Intl.DateTimeFormat('en-US', {
  month: 'long',
  day: 'numeric',
})

function parseDate(yyyymmdd: string): Date {
  return new Date(`${yyyymmdd}T00:00:00`)
}

export function formatConferenceDateRange(
  startDate: string,
  endDate: string
): string {
  const start = parseDate(startDate)
  const end = parseDate(endDate)
  if (startDate === endDate) return MONTH_DAY.format(start)
  if (
    start.getFullYear() === end.getFullYear() &&
    start.getMonth() === end.getMonth()
  ) {
    return `${MONTH_DAY.format(start)} – ${end.getDate()}`
  }
  return `${MONTH_DAY.format(start)} – ${MONTH_DAY.format(end)}`
}

const MONTH_SHORT = new Intl.DateTimeFormat('en-US', { month: 'short' })

/**
 * The date tile's two lines: the start month, and the day or day range
 * ("8–10"). A range that crosses months shows only its first day; the full
 * dates are in the line under the name.
 */
export function conferenceDateTile(startDate: string, endDate: string): { month: string; days: string } {
  const start = parseDate(startDate)
  const end = parseDate(endDate)
  const sameMonth =
    start.getFullYear() === end.getFullYear() && start.getMonth() === end.getMonth()
  const days =
    startDate === endDate || !sameMonth
      ? String(start.getDate())
      : `${start.getDate()}–${end.getDate()}`
  return { month: MONTH_SHORT.format(start), days }
}

