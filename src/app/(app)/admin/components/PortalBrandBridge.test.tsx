import { render, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { PortalBrandBridge } from './PortalBrandBridge'

function addPortal(tag = 'div') {
  const el = document.createElement(tag)
  document.body.appendChild(el)
  return el
}

afterEach(() => {
  document.body.innerHTML = ''
})

describe('PortalBrandBridge', () => {
  it('stamps a portal added to body with the scope and the side', async () => {
    render(<PortalBrandBridge side="sisters" />)
    const portal = addPortal()
    await waitFor(() => expect(portal).toHaveAttribute('data-theme', 'ym'))
    expect(portal).toHaveAttribute('data-theme-side', 'sisters')
    expect(portal).toHaveClass('font-sans', 'tracking-brand')
  })

  it('sets no side attribute for General', async () => {
    render(<PortalBrandBridge side={null} />)
    const portal = addPortal()
    await waitFor(() => expect(portal).toHaveAttribute('data-theme', 'ym'))
    expect(portal).not.toHaveAttribute('data-theme-side')
  })

  it('ignores non-div nodes (Next route announcer, dev overlay)', async () => {
    render(<PortalBrandBridge side="brothers" />)
    const other = addPortal('next-route-announcer')
    const portal = addPortal()
    await waitFor(() => expect(portal).toHaveAttribute('data-theme', 'ym'))
    expect(other).not.toHaveAttribute('data-theme')
  })

  it('leaves body itself and portals added after unmount alone', async () => {
    const { unmount } = render(<PortalBrandBridge side="brothers" />)
    expect(document.body).not.toHaveAttribute('data-theme')
    unmount()
    const portal = addPortal()
    await new Promise((r) => setTimeout(r, 20))
    expect(portal).not.toHaveAttribute('data-theme')
  })
})
