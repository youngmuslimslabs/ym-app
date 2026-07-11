import { describe, it, expect } from 'vitest'
import {
  GRACE_MINUTES,
  canRemoveSignUp,
  canSignUp,
  getCheckInWindow,
  getSessionActionSlot,
  getSessionState,
  type SessionActionInput,
} from './checkInWindow'

// Session runs 14:00–15:00 UTC. Grace tail therefore ends at 15:15 UTC.
const START = '2025-06-27T14:00:00Z'
const END = '2025-06-27T15:00:00Z'
const at = (iso: string) => new Date(iso)

describe('GRACE_MINUTES', () => {
  it('is 15', () => {
    expect(GRACE_MINUTES).toBe(15)
  })
})

describe('getCheckInWindow', () => {
  it('before start: nothing open', () => {
    const w = getCheckInWindow(START, END, at('2025-06-27T13:30:00Z'))
    expect(w).toMatchObject({
      inProgress: false,
      ended: false,
      inGrace: false,
      graceEnded: false,
      checkInOpen: false,
    })
  })

  it('during the session: in progress, check-in open', () => {
    const w = getCheckInWindow(START, END, at('2025-06-27T14:30:00Z'))
    expect(w).toMatchObject({
      inProgress: true,
      ended: false,
      inGrace: false,
      graceEnded: false,
      checkInOpen: true,
    })
  })

  it('at exactly end: ended + in grace, check-in still open', () => {
    const w = getCheckInWindow(START, END, at('2025-06-27T15:00:00Z'))
    expect(w).toMatchObject({
      inProgress: false,
      ended: true,
      inGrace: true,
      graceEnded: false,
      checkInOpen: true,
    })
  })

  it('inside the grace tail: check-in open', () => {
    const w = getCheckInWindow(START, END, at('2025-06-27T15:10:00Z'))
    expect(w).toMatchObject({
      ended: true,
      inGrace: true,
      graceEnded: false,
      checkInOpen: true,
    })
  })

  it('at exactly end + 15min: grace closed (upper bound is exclusive)', () => {
    const w = getCheckInWindow(START, END, at('2025-06-27T15:15:00Z'))
    expect(w).toMatchObject({
      ended: true,
      inGrace: false,
      graceEnded: true,
      checkInOpen: false,
    })
  })

  it('one minute into the tail is open; one minute past close is shut', () => {
    expect(getCheckInWindow(START, END, at('2025-06-27T15:14:00Z')).checkInOpen).toBe(true)
    expect(getCheckInWindow(START, END, at('2025-06-27T15:16:00Z')).checkInOpen).toBe(false)
  })

  // ---- signUpOpen: RSVP closes at the same instant as check-in ----

  it('signUpOpen before start and during the session', () => {
    expect(getCheckInWindow(START, END, at('2025-06-27T13:30:00Z')).signUpOpen).toBe(true)
    expect(getCheckInWindow(START, END, at('2025-06-27T14:30:00Z')).signUpOpen).toBe(true)
  })

  it('signUpOpen through the grace tail', () => {
    expect(getCheckInWindow(START, END, at('2025-06-27T15:00:00Z')).signUpOpen).toBe(true)
    expect(getCheckInWindow(START, END, at('2025-06-27T15:14:00Z')).signUpOpen).toBe(true)
  })

  it('signUpOpen closes exactly at end + grace, in lockstep with checkInOpen', () => {
    const w = getCheckInWindow(START, END, at('2025-06-27T15:15:00Z'))
    expect(w.signUpOpen).toBe(false)
    expect(w.signUpOpen).toBe(w.checkInOpen)
  })
})

describe('getSessionActionSlot', () => {
  const base: Omit<SessionActionInput, 'now'> = {
    startAt: START,
    endAt: END,
    isBreak: false,
    signedUp: true,
    checkedIn: false,
    hasFeedback: false,
  }
  const slot = (over: Partial<SessionActionInput>) =>
    getSessionActionSlot({ ...base, now: at('2025-06-27T14:30:00Z'), ...over })

  // ---- The six states (signed up, coded session) ----

  it('state 1 — during session, not checked in → check-in form (not grace)', () => {
    expect(slot({ now: at('2025-06-27T14:30:00Z') })).toEqual({ kind: 'check-in', grace: false })
  })

  it('state 2 — during session, checked in → waiting card', () => {
    expect(slot({ checkedIn: true, now: at('2025-06-27T14:30:00Z') })).toEqual({ kind: 'checked-in' })
  })

  it('state 3 — grace tail, not checked in → check-in form (grace flag set)', () => {
    expect(slot({ now: at('2025-06-27T15:07:00Z') })).toEqual({ kind: 'check-in', grace: true })
  })

  it('state 4 — grace tail, checked in → feedback form', () => {
    expect(slot({ checkedIn: true, now: at('2025-06-27T15:07:00Z') })).toEqual({
      kind: 'feedback',
      edit: false,
    })
  })

  it('state 5 — past grace, never checked in → missed notice', () => {
    expect(slot({ now: at('2025-06-27T15:30:00Z') })).toEqual({ kind: 'missed' })
  })

  it('state 6 — past grace, checked in → feedback form', () => {
    expect(slot({ checkedIn: true, now: at('2025-06-27T15:30:00Z') })).toEqual({
      kind: 'feedback',
      edit: false,
    })
  })

  // ---- Feedback edit flag ----

  it('feedback slot reports edit=true when feedback already exists', () => {
    expect(slot({ checkedIn: true, hasFeedback: true, now: at('2025-06-27T15:30:00Z') })).toEqual({
      kind: 'feedback',
      edit: true,
    })
  })

  // ---- Exemptions / non-signed-up / break / upcoming ----

  it('upcoming (before start), signed up, not checked in → none (no early check-in)', () => {
    expect(slot({ now: at('2025-06-27T13:00:00Z') })).toEqual({ kind: 'none' })
  })

  it('not signed up + not checked in → none, even mid-session', () => {
    expect(slot({ signedUp: false, now: at('2025-06-27T14:30:00Z') })).toEqual({ kind: 'none' })
  })

  it('not signed up + not checked in, past grace → none (no missed notice)', () => {
    expect(slot({ signedUp: false, now: at('2025-06-27T15:30:00Z') })).toEqual({ kind: 'none' })
  })

  it('checked in without a signup still gets feedback after end', () => {
    expect(slot({ signedUp: false, checkedIn: true, now: at('2025-06-27T15:30:00Z') })).toEqual({
      kind: 'feedback',
      edit: false,
    })
  })

  it('checked in but session has not started → none (no premature waiting card)', () => {
    expect(slot({ checkedIn: true, now: at('2025-06-27T13:00:00Z') })).toEqual({ kind: 'none' })
  })

  it('break → always none', () => {
    expect(slot({ isBreak: true, now: at('2025-06-27T14:30:00Z') })).toEqual({ kind: 'none' })
    expect(slot({ isBreak: true, checkedIn: true, now: at('2025-06-27T15:30:00Z') })).toEqual({
      kind: 'none',
    })
  })

  // ---- Boundary: the exact grace edge flips missed vs check-in ----

  it('at end+15 exactly, not checked in → missed (window is closed)', () => {
    expect(slot({ now: at('2025-06-27T15:15:00Z') })).toEqual({ kind: 'missed' })
  })

  it('one minute before end+15, not checked in → still check-in (grace)', () => {
    expect(slot({ now: at('2025-06-27T15:14:00Z') })).toEqual({ kind: 'check-in', grace: true })
  })
})

describe('canSignUp (shared by card chrome and sheet footer)', () => {
  const w = (iso: string) => getCheckInWindow(START, END, at(iso))
  const open = { isBreak: false, signedUp: false, full: false }

  it('open before start, during the session, and through the grace tail', () => {
    expect(canSignUp(w('2025-06-27T13:00:00Z'), open)).toBe(true)
    expect(canSignUp(w('2025-06-27T14:30:00Z'), open)).toBe(true)
    expect(canSignUp(w('2025-06-27T15:07:00Z'), open)).toBe(true)
  })

  it('closed once the grace tail ends', () => {
    expect(canSignUp(w('2025-06-27T15:15:00Z'), open)).toBe(false)
  })

  it('never for breaks, full sessions, or already-signed-up attendees', () => {
    const g = w('2025-06-27T15:07:00Z')
    expect(canSignUp(g, { ...open, isBreak: true })).toBe(false)
    expect(canSignUp(g, { ...open, full: true })).toBe(false)
    expect(canSignUp(g, { ...open, signedUp: true })).toBe(false)
  })
})

describe('canRemoveSignUp (mirrors the sign-up window)', () => {
  const w = (iso: string) => getCheckInWindow(START, END, at(iso))
  const signed = { signedUp: true, checkedIn: false }

  it('allowed before start', () => {
    expect(canRemoveSignUp(w('2025-06-27T13:00:00Z'), signed)).toBe(true)
  })

  it('blocked while the session is running', () => {
    expect(canRemoveSignUp(w('2025-06-27T14:30:00Z'), signed)).toBe(false)
  })

  it('allowed during the grace tail (escape hatch for a mistapped signup)', () => {
    expect(canRemoveSignUp(w('2025-06-27T15:07:00Z'), signed)).toBe(true)
  })

  it('blocked once checked in, and once the grace tail ends', () => {
    expect(canRemoveSignUp(w('2025-06-27T15:07:00Z'), { ...signed, checkedIn: true })).toBe(false)
    expect(canRemoveSignUp(w('2025-06-27T15:15:00Z'), signed)).toBe(false)
  })

  it('never for a user who is not signed up', () => {
    expect(canRemoveSignUp(w('2025-06-27T13:00:00Z'), { ...signed, signedUp: false })).toBe(false)
  })
})

describe('getSessionState', () => {
  it('returns the window and slot from a single computation', () => {
    const state = getSessionState({
      startAt: START,
      endAt: END,
      isBreak: false,
      signedUp: true,
      checkedIn: false,
      hasFeedback: false,
      now: at('2025-06-27T15:07:00Z'),
    })
    expect(state.window.inGrace).toBe(true)
    expect(state.window.checkInOpen).toBe(true)
    expect(state.slot).toEqual({ kind: 'check-in', grace: true })
  })
})
