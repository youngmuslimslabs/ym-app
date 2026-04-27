// Compose an ISO TIMESTAMPTZ string from (date, time, timezone) where the
// wall clock should be interpreted as if in the given timezone. Returns a UTC
// ISO string (`...Z`) suitable for sending to Postgres TIMESTAMPTZ columns.
//
// Why we hand-roll this: the codebase has `date-fns` but not `date-fns-tz`,
// and adding a dep just for two functions is overkill. The trick uses the
// difference between an instant displayed in the target tz vs displayed in
// UTC to derive the offset for that exact wall-clock moment (handles DST).
export function composeTzIso(
  date: string, // "YYYY-MM-DD"
  time: string, // "HH:mm"
  timezone: string
): string {
  const asUtcMs = Date.parse(`${date}T${time}:00Z`)
  if (Number.isNaN(asUtcMs)) {
    throw new Error(`Invalid date/time: ${date} ${time}`)
  }

  // What does asUtcMs display as in the target timezone?
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  }).formatToParts(new Date(asUtcMs))
  const get = (type: string) =>
    parts.find((p) => p.type === type)?.value ?? '00'
  // Some locales render "24" for midnight; normalize to "00".
  const hour = get('hour') === '24' ? '00' : get('hour')
  const tzClockMs = Date.parse(
    `${get('year')}-${get('month')}-${get('day')}T${hour}:${get('minute')}:${get('second')}Z`
  )

  // offset = tz - utc, in ms (e.g. -5h for EST). Subtract to find the UTC
  // instant whose tz wall clock matches our input.
  return new Date(2 * asUtcMs - tzClockMs).toISOString()
}

// Inverse: given a TIMESTAMPTZ ISO and a timezone, return { date, time } as
// wall-clock strings in that zone. Used to pre-fill the SessionEditor when
// editing an existing session.
export function decomposeTzIso(
  iso: string,
  timezone: string
): { date: string; time: string } {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).formatToParts(new Date(iso))
  const get = (type: string) =>
    parts.find((p) => p.type === type)?.value ?? '00'
  const hour = get('hour') === '24' ? '00' : get('hour')
  return {
    date: `${get('year')}-${get('month')}-${get('day')}`,
    time: `${hour}:${get('minute')}`,
  }
}

// Range of YYYY-MM-DD strings between start and end inclusive. Used by the
// SessionEditor's day picker to limit choices to the conference's days.
export function dateRangeInclusive(startDate: string, endDate: string): string[] {
  const start = new Date(`${startDate}T00:00:00Z`)
  const end = new Date(`${endDate}T00:00:00Z`)
  const out: string[] = []
  for (let d = start.getTime(); d <= end.getTime(); d += 86400000) {
    out.push(new Date(d).toISOString().slice(0, 10))
  }
  return out
}
