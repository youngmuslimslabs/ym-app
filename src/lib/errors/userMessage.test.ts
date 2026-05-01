import { describe, it, expect } from 'vitest'
import { toUserMessage } from './userMessage'

describe('toUserMessage', () => {
  describe('non-classifiable inputs fall back', () => {
    it('null with no action', () => {
      expect(toUserMessage(null)).toMatch(/went sideways/i)
    })
    it('undefined with no action', () => {
      expect(toUserMessage(undefined)).toMatch(/went sideways/i)
    })
    it('empty string with no action', () => {
      expect(toUserMessage('')).toMatch(/went sideways/i)
    })
    it('number with no action', () => {
      expect(toUserMessage(42)).toMatch(/went sideways/i)
    })
    it('plain Error with no signal, no action', () => {
      expect(toUserMessage(new Error('something weird'))).toMatch(/went sideways/i)
    })
    it('empty object with no action', () => {
      expect(toUserMessage({})).toMatch(/went sideways/i)
    })
    it('action context shifts fallback away from "your work is saved"', () => {
      // For non-data flows like sign-in, "your work is saved" is nonsensical.
      // The action-aware fallback names the action and points to recovery.
      const msg = toUserMessage(null, { action: 'sign in' })
      expect(msg).toMatch(/couldn't sign in/i)
      expect(msg).not.toMatch(/work is saved/i)
    })
    it('action context applies to plain Error fallthrough too', () => {
      const msg = toUserMessage(new Error('something weird'), {
        action: 'load conferences',
      })
      expect(msg).toMatch(/couldn't load conferences/i)
    })
  })

  describe('network failures', () => {
    it('classifies TypeError "Failed to fetch"', () => {
      expect(toUserMessage(new TypeError('Failed to fetch'))).toMatch(
        /couldn't reach our servers/i,
      )
    })
    it('classifies AbortError', () => {
      const err = Object.assign(new Error('aborted'), { name: 'AbortError' })
      expect(toUserMessage(err)).toMatch(/couldn't reach our servers/i)
    })
    it('classifies "network error" string', () => {
      expect(toUserMessage('A network error occurred')).toMatch(
        /couldn't reach our servers/i,
      )
    })
    it('classifies ENOTFOUND', () => {
      expect(toUserMessage(new Error('getaddrinfo ENOTFOUND supabase.co'))).toMatch(
        /couldn't reach our servers/i,
      )
    })
  })

  describe('permission failures', () => {
    it('classifies status 403', () => {
      expect(toUserMessage({ status: 403, message: 'Forbidden' })).toMatch(
        /don't have access/i,
      )
    })
    it('classifies status 401', () => {
      expect(toUserMessage({ status: 401, message: 'Unauthorized' })).toMatch(
        /don't have access/i,
      )
    })
    it('classifies Postgres code 42501', () => {
      expect(
        toUserMessage({ code: '42501', message: 'new row violates rls policy' }),
      ).toMatch(/don't have access/i)
    })
    it('classifies "row-level security" message without code', () => {
      // Real Supabase RLS rejection often arrives as a string-only message —
      // the regex must catch it independently of code 42501.
      expect(
        toUserMessage(
          'new row violates row-level security policy for table profiles',
        ),
      ).toMatch(/don't have access/i)
    })
    it('classifies "permission denied" message', () => {
      expect(toUserMessage('permission denied for table users')).toMatch(
        /don't have access/i,
      )
    })
  })

  describe('session expired (PGRST301)', () => {
    it('classifies PGRST301 as session expired', () => {
      expect(
        toUserMessage({ code: 'PGRST301', message: 'JWT expired' }),
      ).toMatch(/session expired/i)
    })
    it('takes precedence over permission classification', () => {
      // PGRST301 messages can mention "unauthorized" too — session-expired
      // copy is more actionable than "you don't have access".
      const msg = toUserMessage({
        code: 'PGRST301',
        message: 'JWT expired: unauthorized',
      })
      expect(msg).toMatch(/session expired/i)
      expect(msg).not.toMatch(/don't have access/i)
    })
  })

  describe('constraint violation (FK / check)', () => {
    it('classifies Postgres code 23503 (FK)', () => {
      expect(
        toUserMessage({
          code: '23503',
          message: 'violates foreign key constraint',
        }),
      ).toMatch(/some of the input doesn't fit/i)
    })
    it('classifies Postgres code 23514 (check)', () => {
      expect(
        toUserMessage({
          code: '23514',
          message: 'violates check constraint',
        }),
      ).toMatch(/some of the input doesn't fit/i)
    })
    it('classifies "invalid input value" message', () => {
      expect(
        toUserMessage('invalid input value for enum role_type: "ghost"'),
      ).toMatch(/some of the input doesn't fit/i)
    })
    it('uses action context when provided', () => {
      const msg = toUserMessage(
        { code: '23514' },
        { action: 'save your conference' },
      )
      expect(msg).toContain('save your conference')
    })
  })

  describe('conflict / unique violation', () => {
    it('classifies Postgres code 23505', () => {
      expect(toUserMessage({ code: '23505', message: 'duplicate key' })).toMatch(
        /already in use/i,
      )
    })
    it('classifies status 409', () => {
      expect(toUserMessage({ status: 409, message: 'Conflict' })).toMatch(
        /already in use/i,
      )
    })
    it('respects conflictMessage override', () => {
      const msg = toUserMessage(
        { code: '23505' },
        {
          conflictMessage:
            'Someone already used this email — try signing in instead.',
        },
      )
      expect(msg).toBe('Someone already used this email — try signing in instead.')
    })
  })

  describe('not found', () => {
    it('classifies status 404', () => {
      expect(toUserMessage({ status: 404, message: 'Not Found' })).toMatch(
        /couldn't find/i,
      )
    })
    it('classifies PGRST116 (Supabase no-rows)', () => {
      expect(
        toUserMessage({ code: 'PGRST116', message: 'No rows returned' }),
      ).toMatch(/couldn't find/i)
    })
    it('uses action context when provided', () => {
      const msg = toUserMessage({ status: 404 }, { action: 'load profile' })
      expect(msg).toContain('load profile')
    })
  })

  describe('server errors', () => {
    it('classifies status 500', () => {
      expect(
        toUserMessage({ status: 500, message: 'Internal Server Error' }),
      ).toMatch(/off on our end/i)
    })
    it('classifies status 503', () => {
      expect(toUserMessage({ status: 503 })).toMatch(/off on our end/i)
    })
    it('uses action context when provided', () => {
      const msg = toUserMessage({ status: 503 }, { action: 'save profile' })
      expect(msg).toContain('save profile')
    })
  })
})
