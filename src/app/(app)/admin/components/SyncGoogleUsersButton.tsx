'use client'

import { useState } from 'react'
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

  async function handleSync() {
    setState({ status: 'syncing' })
    try {
      const res = await fetch('/api/admin/sync-google-users', { method: 'POST' })
      const data = await res.json() as SyncResult & { error?: string }
      if (!res.ok) {
        setState({ status: 'error', message: data.error ?? 'Sync failed' })
        toast.error(data.error ?? 'Sync failed')
        return
      }
      setState({ status: 'done', result: data })
      if (data.errors > 0) {
        toast.error(`Sync finished with ${data.errors} error(s)`)
      }
    } catch {
      setState({ status: 'error', message: 'Network error — sync did not complete' })
      toast.error('Network error — sync did not complete')
    }
  }

  const syncing = state.status === 'syncing'

  return (
    <div className="flex flex-col items-end gap-3">
      <Button variant="outline" onClick={handleSync} disabled={syncing}>
        <RefreshCw className={`w-4 h-4 mr-2 ${syncing ? 'animate-spin' : ''}`} />
        {syncing ? 'Syncing...' : state.status === 'done' ? 'Sync Again' : 'Sync Google Users'}
      </Button>

      {state.status === 'syncing' && (
        <p className="text-xs text-muted-foreground animate-pulse">
          Fetching users from Google Workspace…
        </p>
      )}

      {state.status === 'done' && (
        <div className="flex items-center gap-3 text-xs">
          <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-medium">
            <UserPlus className="w-3.5 h-3.5" />
            {state.result.created} added
          </span>
          <span className="flex items-center gap-1 text-blue-600 dark:text-blue-400 font-medium">
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
