import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'

import { DateRangeInput } from './date-range-input'

// Capture the props each MonthYearPicker receives without rendering the Radix
// Select (which needs pointer polyfills jsdom lacks).
vi.mock('@/components/month-year-picker', () => ({
  MonthYearPicker: ({ maxYear }: { maxYear?: number }) => (
    <div data-testid="month-year-picker" data-max-year={String(maxYear)} />
  ),
}))

describe('DateRangeInput — no future dates', () => {
  it('caps the start-date year at the current year', () => {
    render(<DateRangeInput isCurrent onChange={vi.fn()} />)
    const pickers = screen.getAllByTestId('month-year-picker')
    // isCurrent hides the end picker, so only the start picker renders
    expect(pickers).toHaveLength(1)
    expect(pickers[0]).toHaveAttribute('data-max-year', String(new Date().getFullYear()))
  })

  it('caps both start and end year when the entry is not current', () => {
    render(<DateRangeInput isCurrent={false} onChange={vi.fn()} />)
    const pickers = screen.getAllByTestId('month-year-picker')
    expect(pickers).toHaveLength(2)
    for (const p of pickers) {
      expect(p).toHaveAttribute('data-max-year', String(new Date().getFullYear()))
    }
  })
})
