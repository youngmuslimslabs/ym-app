import type { Conference, AdminSession } from '../../types'

export function makeConference(overrides: Partial<Conference> = {}): Conference {
  return {
    id: 'c1',
    name: 'Test Conf',
    tagline: null,
    description: null,
    location: 'Boston',
    timezone: 'America/New_York',
    start_date: '2026-06-01',
    end_date: '2026-06-03',
    status: 'published',
    published_at: '2026-05-01T00:00:00Z',
    created_at: '2026-05-01T00:00:00Z',
    updated_at: '2026-05-01T00:00:00Z',
    ...overrides,
  }
}

export function makeSession(overrides: Partial<AdminSession> = {}): AdminSession {
  return {
    id: 's1',
    conference_id: 'c1',
    start_at: '2026-06-01T13:00:00Z',
    end_at: '2026-06-01T14:00:00Z',
    title: 'Opening Keynote',
    description: null,
    speaker: 'Dr. Ansari',
    room: 'Ballroom A',
    is_break: false,
    capacity: 80,
    check_in_code: null,
    created_at: '2026-05-01T00:00:00Z',
    updated_at: '2026-05-01T00:00:00Z',
    ...overrides,
  }
}
