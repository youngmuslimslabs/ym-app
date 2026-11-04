import { act, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { FloatingSaveBar } from './floating-save-bar'

afterEach(() => { vi.useRealTimers(); vi.restoreAllMocks() })

describe('save recovery', () => {
  it('keeps a failure and one retry available until a successful retry', async () => {
    vi.useFakeTimers()
    vi.spyOn(console, 'error').mockImplementation(() => {})
    const onSave = vi.fn().mockRejectedValueOnce(new Error('offline')).mockResolvedValueOnce(undefined)
    render(<FloatingSaveBar hasChanges onSave={onSave} presentation="footer" />)
    await act(async () => { fireEvent.click(screen.getByRole('button', { name: 'Save' })) })
    act(() => { vi.advanceTimersByTime(30_000) })
    expect(screen.getByRole('alert')).toHaveTextContent("Couldn't save")
    expect(screen.getAllByRole('button', { name: 'Retry' })).toHaveLength(1)
    await act(async () => { fireEvent.click(screen.getByRole('button', { name: 'Retry' })) })
    expect(onSave).toHaveBeenCalledTimes(2)
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
    expect(screen.getByRole('status')).toHaveTextContent('Changes saved!')
    act(() => { vi.advanceTimersByTime(2000) })
    expect(screen.getByRole('button', { name: 'Save' })).toBeInTheDocument()
  })

  it('submits once while pending and exposes a visible saving label', async () => {
    let finish!: () => void
    const onSave = vi.fn(() => new Promise<void>(resolve => { finish = resolve }))
    render(<FloatingSaveBar hasChanges onSave={onSave} presentation="footer" />)
    const save = screen.getByRole('button', { name: 'Save' })
    fireEvent.click(save)
    fireEvent.click(save)
    expect(onSave).toHaveBeenCalledTimes(1)
    expect(screen.getByRole('button', { name: 'Saving…' })).toBeDisabled()
    expect(screen.getByRole('status')).toHaveTextContent('Saving changes…')
    await act(async () => { finish() })
  })

  it('keeps pending feedback visible if the parent clears dirty state before save resolves', async () => {
    let finish!: () => void
    const onSave = vi.fn(() => new Promise<void>(resolve => { finish = resolve }))
    const { rerender } = render(<FloatingSaveBar hasChanges onSave={onSave} />)
    fireEvent.click(screen.getByRole('button', { name: 'Save' }))
    rerender(<FloatingSaveBar hasChanges={false} onSave={onSave} />)
    expect(screen.getByRole('button', { name: 'Saving…' })).toBeDisabled()
    await act(async () => { finish() })
    expect(screen.getByRole('status')).toHaveTextContent('Changes saved!')
  })

  it('shows success even when the parent clears its dirty state during save', async () => {
    const onSave = vi.fn().mockResolvedValue(undefined)
    const { rerender } = render(<FloatingSaveBar hasChanges onSave={onSave} />)
    await act(async () => { fireEvent.click(screen.getByRole('button', { name: 'Save' })) })
    rerender(<FloatingSaveBar hasChanges={false} onSave={onSave} />)
    expect(screen.getByRole('status')).toHaveTextContent('Changes saved!')
  })
})
