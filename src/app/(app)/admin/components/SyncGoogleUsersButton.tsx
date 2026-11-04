'use client'

import { useState } from 'react'
import { usePostHog } from 'posthog-js/react'
import { RefreshCw, UserPlus, UserCheck, Minus, AlertCircle } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'

interface SyncResult {
  created: number
  updated: number
  skipped: number
  errors: number
  total: number
}

type State =
  | { status: 'idle' }
  | { status: 'syncing' }
  | { status: 'done'; result: SyncResult }
  | { status: 'error'; message: string }

export function SyncGoogleUsersButton() {
  const [state, setState] = useState<State>({ status: 'idle' })
  const posthog = usePostHog()

  async function handleSync() {
    posthog?.capture('admin_google_sync_initiated', {})
    setState({ status: 'syncing' })
    try {
      const res = await fetch('/api/admin/sync-google-users', { method: 'POST' })
      const data = await res.json() as SyncResult & { error?: string }
      if (!res.ok) {
        const message = res.status === 409
          ? 'A sync is already running — try again in a moment'
          : (data.error ?? 'Sync failed')
        setState({ status: 'error', message })
        toast.error(message)
        return
      }
      setState({ status: 'done', result: data })
      if (data.errors > 0) {
        toast.error(`Sync finished with ${data.errors} error(s) — see details below`)
      } else {
        toast.success(`Sync complete — ${data.created} added, ${data.updated} updated`)
      }
    } catch {
      setState({ status: 'error', message: 'Network error — sync did not complete' })
      toast.error('Network error — sync did not complete')
    }
  }

  const syncing = state.status === 'syncing'

  return (
    <div className="flex shrink-0 flex-col items-stretch gap-3 sm:items-end">
      <Button variant="outline" onClick={handleSync} disabled={syncing} className="h-11 md:h-9">
        <RefreshCw className={`size-4 ${syncing ? 'animate-spin' : ''}`} />
        Sync Google Users
      </Button>

      {state.status === 'syncing' && (
        <p className="text-xs text-muted-foreground animate-pulse">
          Fetching users from Google Workspace…
        </p>
      )}

      {state.status === 'done' && (
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs sm:justify-end">
          <span className="flex items-center gap-1 text-primary font-medium">
            <UserPlus className="w-3.5 h-3.5" />
            {state.result.created} added
          </span>
          <span className="flex items-center gap-1 text-foreground font-medium">
            <UserCheck className="w-3.5 h-3.5" />
            {state.result.updated} updated
          </span>
          <span className="flex items-center gap-1 text-muted-foreground">
            <Minus className="w-3.5 h-3.5" />
            {state.result.skipped} unchanged
          </span>
          {state.result.errors > 0 && (
            <span className="flex items-center gap-1 text-destructive font-medium">
              <AlertCircle className="w-3.5 h-3.5" />
              {state.result.errors} errors
            </span>
          )}
          <span className="text-muted-foreground">
            of {state.result.total}
          </span>
        </div>
      )}

      {state.status === 'error' && (
        <p className="flex items-center gap-1 text-xs text-destructive">
          <AlertCircle className="w-3.5 h-3.5" />
          {state.message}
        </p>
      )}
    </div>
  )
}
