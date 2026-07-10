import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'

import { ProfileNotFound } from './ProfileNotFound'

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
}))

describe('ProfileNotFound', () => {
  it('shows a "Not Found" header rather than a bare "Error"', () => {
    render(<ProfileNotFound />)
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Not Found')
    expect(screen.queryByText('Error')).not.toBeInTheDocument()
  })
})
