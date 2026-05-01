import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'

import { StatsStrip } from './StatsStrip'

describe('StatsStrip', () => {
  it('renders all three labels and values', () => {
    render(
      <StatsStrip
        stats={[
          { label: 'Active members', value: 142 },
          { label: 'NeighborNets', value: 8 },
          { label: 'New this week', value: 3 },
        ]}
      />,
    )

    expect(screen.getByText('Active members')).toBeInTheDocument()
    expect(screen.getByText('NeighborNets')).toBeInTheDocument()
    expect(screen.getByText('New this week')).toBeInTheDocument()

    expect(screen.getByText('142')).toBeInTheDocument()
    expect(screen.getByText('8')).toBeInTheDocument()
    expect(screen.getByText('3')).toBeInTheDocument()
  })

  it('renders the meta line when meta is provided', () => {
    render(
      <StatsStrip
        stats={[
          { label: 'Active members', value: 100, meta: 'this month' },
          { label: 'NeighborNets', value: 1 },
          { label: 'New this week', value: 0 },
        ]}
      />,
    )
    expect(screen.getByText('this month')).toBeInTheDocument()
  })

  it('omits the meta line when no meta is provided', () => {
    render(
      <StatsStrip
        stats={[
          { label: 'Active members', value: 100 },
          { label: 'NeighborNets', value: 1 },
          { label: 'New this week', value: 0 },
        ]}
      />,
    )
    expect(screen.queryByText('this month')).not.toBeInTheDocument()
  })

  it('renders metaAccent in success color before the meta text', () => {
    render(
      <StatsStrip
        stats={[
          {
            label: 'Active members',
            value: 100,
            meta: 'this month',
            metaAccent: '+8',
          },
          { label: 'NeighborNets', value: 1 },
          { label: 'New this week', value: 8 },
        ]}
      />,
    )
    const accent = screen.getByText('+8', { exact: false })
    expect(accent).toHaveClass('text-success')
  })

  it('uses a 3-column grid layout', () => {
    const { container } = render(
      <StatsStrip
        stats={[
          { label: 'A', value: 1 },
          { label: 'B', value: 2 },
          { label: 'C', value: 3 },
        ]}
      />,
    )
    const grid = container.firstChild as HTMLElement
    expect(grid).toHaveClass('grid-cols-3')
  })
})
