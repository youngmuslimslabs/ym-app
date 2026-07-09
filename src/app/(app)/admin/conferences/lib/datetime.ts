import { addDays, format, parseISO } from 'date-fns'

// Compose an ISO TIMESTAMPTZ string from (date, time, timezone) where the
// wall clock should be interpreted as if in the given timezone. Returns a UTC
// ISO string (`...Z`) suitable for sending to Postgres TIMESTAMPTZ columns.
//
// Why we hand-roll this: the codebase has `date-fns` but not `date-fns-tz`,
// and adding a dep just for two functions is overkill. The trick uses the
// difference between an instant displayed in the target tz vs displayed in
// UTC to derive the offset for that exact wall-clock moment (handles DST).
//
// The offset is sampled twice — once at the input UTC instant and once at the
// candidate corrected instant — so DST spring-forward wall clocks resolve to
// the correct post-transition offset instead of the pre-transition one.
export function composeTzIso(
  date: string, // "YYYY-MM-DD"
  time: string, // "HH:mm"
  timezone: string
): string {
  const asUtcMs = Date.parse(`${date}T${time}:00Z`)
  if (Number.isNaN(asUtcMs)) {
    throw new Error(`Invalid date/time: ${date} ${time}`)
  }

  const tzOffsetMs = (atUtcMs: number): number => {
    const parts = new Intl.DateTimeFormat('en-US', {
      timeZone: timezone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    }).formatToParts(new Date(atUtcMs))
    const get = (type: string) =>
      parts.find((p) => p.type === type)?.value ?? '00'
    // Some locales render "24" for midnight; normalize to "00".
    const hour = get('hour') === '24' ? '00' : get('hour')
    const tzClockMs = Date.parse(
      `${get('year')}-${get('month')}-${get('day')}T${hour}:${get('minute')}:${get('second')}Z`
    )
    return tzClockMs - atUtcMs
  }

  // Two-pass offset resolution: the first sample uses the input UTC instant
  // (may hit the wrong side of a DST transition); the second samples at the
  // candidate corrected instant so DST spring-forward resolves correctly.
  const firstOffset = tzOffsetMs(asUtcMs)
  const candidateMs = asUtcMs - firstOffset
  const refinedOffset = tzOffsetMs(candidateMs)
  return new Date(asUtcMs - refinedOffset).toISOString()
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

// Compose a session's start + end TIMESTAMPTZ ISOs together. When
// `endsNextDay` is true, the end wall clock is interpreted on `date + 1` so
// callers can express midnight-crossing sessions (e.g. 23:00 → 01:00 next
// day) explicitly instead of inferring intent from `endTime < startTime` —
// the inferring form silently accepted reversed-time typos as valid.
export function composeSessionIsos(
  date: string,
  startTime: string,
  endTime: string,
  timezone: string,
  endsNextDay: boolean = false
): { startIso: string; endIso: string } {
  const startIso = composeTzIso(date, startTime, timezone)
  const endDate = endsNextDay ? nextDay(date) : date
  const endIso = composeTzIso(endDate, endTime, timezone)
  return { startIso, endIso }
}

export function nextDay(date: string): string {
  return format(addDays(parseISO(date), 1), 'yyyy-MM-dd')
}

// Range of YYYY-MM-DD strings between start and end inclusive. Used by the
// SessionEditor's day picker to limit choices to the conference's days.
// Returns `[]` if `endDate < startDate` (inverted range — caller's bug, not
// ours, but we don't throw because the picker just renders nothing).
export function dateRangeInclusive(startDate: string, endDate: string): string[] {
  const start = new Date(`${startDate}T00:00:00Z`)
  const end = new Date(`${endDate}T00:00:00Z`)
  const out: string[] = []
  for (let d = start.getTime(); d <= end.getTime(); d += 86400000) {
    out.push(new Date(d).toISOString().slice(0, 10))
  }
  return out
}
