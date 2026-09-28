'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { MoreHorizontal, Search, Trash2, UserPlus, Users, X } from 'lucide-react'
import type { ColumnDef } from '@tanstack/react-table'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { TooltipProvider } from '@/components/ui/tooltip'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  PeopleSearch,
  PeopleFilters,
  PeopleTable,
} from '@/app/(app)/people/components'
import { usePeopleFilters } from '@/app/(app)/people/hooks/usePeopleFilters'
import { useIsMobile } from '@/hooks/use-mobile'
import { TypeToConfirmDialog } from '../../components/TypeToConfirmDialog'
import { inviteAttendees, removeAttendee } from '../../client-actions'
import type { PersonListItem } from '@/lib/supabase/queries/people'
import type { FilterCategory } from '@/app/(app)/people/types'

interface Props {
  conferenceId: string
  people: PersonListItem[]
  filterCategories: FilterCategory[]
  invitedUserIds: string[]
}

export function AttendeePicker({
  conferenceId,
  people,
  filterCategories,
  invitedUserIds,
}: Props) {
  const router = useRouter()
  const isMobile = useIsMobile()
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [pending, setPending] = useState(false)
  const [removeTarget, setRemoveTarget] = useState<PersonListItem | null>(null)
  // Two views instead of one mixed list (#54): who is attending, and a
  // separate picker of everyone else to add. The old single list showed every
  // member with an "Invited" tag, which read as if they were all attendees.
  const [mode, setMode] = useState<'attendees' | 'add'>('attendees')

  const invitedSet = useMemo(() => new Set(invitedUserIds), [invitedUserIds])
  const attendees = useMemo(
    () => people.filter((p) => invitedSet.has(p.id)),
    [people, invitedSet]
  )
  const candidates = useMemo(
    () => people.filter((p) => !invitedSet.has(p.id)),
    [people, invitedSet]
  )

  const {
    filters,
    setSearch,
    setFilterValues,
    clearCategory,
    clearAllFilters,
    filteredPeople,
    visiblePeople,
    hasMore,
    loadMore,
  } = usePeopleFilters(mode === 'attendees' ? attendees : candidates)

  function switchMode(next: 'attendees' | 'add') {
    if (next === mode) return
    setSelected(new Set())
    clearAllFilters()
    setMode(next)
  }

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function toggleAllFiltered() {
    const ids = filteredPeople.map((p) => p.id)
    const allSelected = ids.every((id) => selected.has(id))
    setSelected((prev) => {
      const next = new Set(prev)
      if (allSelected) for (const id of ids) next.delete(id)
      else for (const id of ids) next.add(id)
      return next
    })
  }

  // Only the add view selects, and it only lists people not yet attending.
  // The filter still guards a refresh landing mid-selection.
  const selectedNotInvited = useMemo(
    () => Array.from(selected).filter((id) => !invitedSet.has(id)),
    [selected, invitedSet]
  )

  async function handleInvite() {
    if (selectedNotInvited.length === 0 || pending) return
    setPending(true)
    try {
      const result = await inviteAttendees(conferenceId, selectedNotInvited)
      if (!result.success) {
        toast.error(result.error ?? 'Could not invite')
        return
      }
      toast.success(
        result.invited === 1
          ? '1 attendee added'
          : `${result.invited.toLocaleString()} attendees added`
      )
      setSelected(new Set())
      clearAllFilters()
      setMode('attendees')
      router.refresh()
    } finally {
      setPending(false)
    }
  }

  async function handleRemove() {
    if (!removeTarget || pending) return
    setPending(true)
    try {
      const result = await removeAttendee(conferenceId, removeTarget.id)
      if (!result.success) {
        toast.error(result.error ?? 'Could not remove')
        return
      }
      toast.success(
        `${removeTarget.firstName} ${removeTarget.lastName} removed`
      )
      setRemoveTarget(null)
      router.refresh()
    } finally {
      setPending(false)
    }
  }

  const allFilteredSelected =
    filteredPeople.length > 0 &&
    filteredPeople.every((p) => selected.has(p.id))
  const someFilteredSelected =
    !allFilteredSelected && filteredPeople.some((p) => selected.has(p.id))

  // Trailing row-actions column for the attendee list. Defined here (not in
  // PeopleTable) because it needs setRemoveTarget from this component's state.
  const actionsColumn = useMemo<ColumnDef<PersonListItem>>(
    () => ({
      id: 'actions',
      header: () => <span className="sr-only">Actions</span>,
      cell: ({ row }) => (
        <div className="flex justify-end">
          <RowActionsMenu onRemove={() => setRemoveTarget(row.original)} />
        </div>
      ),
      enableSorting: false,
    }),
    []
  )

  const adding = mode === 'add'

  return (
    <TooltipProvider>
      <div className="flex flex-col gap-4 pb-24">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div
            role="tablist"
            aria-label="Attendee views"
            className="inline-flex rounded-lg border bg-muted/40 p-1"
          >
            <ModeButton
              active={!adding}
              onClick={() => switchMode('attendees')}
              icon={<Users className="w-4 h-4" />}
              label="Attendees"
              count={attendees.length}
            />
            <ModeButton
              active={adding}
              onClick={() => switchMode('add')}
              icon={<UserPlus className="w-4 h-4" />}
              label="Add people"
            />
          </div>
          {adding && (
            <p className="text-sm text-muted-foreground">
              Members not attending yet. Select people, then add them.
            </p>
          )}
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex-1 min-w-[240px]">
            <PeopleSearch
              value={filters.search}
              onChange={setSearch}
              placeholder={adding ? 'Search members to add...' : 'Search attendees...'}
            />
          </div>
          {!isMobile && (
            <PeopleFilters
              filters={filters}
              filterCategories={filterCategories}
              onFilterChange={setFilterValues}
              onClearCategory={clearCategory}
              onClearAll={clearAllFilters}
            />
          )}
        </div>

        {filteredPeople.length === 0 ? (
          !adding && attendees.length === 0 ? (
            <NoAttendeesYet onAdd={() => switchMode('add')} />
          ) : (
            <EmptyState />
          )
        ) : isMobile ? (
          <CardList
            people={visiblePeople}
            selectable={adding}
            selected={selected}
            onToggle={toggle}
            onRemoveInvite={setRemoveTarget}
          />
        ) : adding ? (
          <PeopleTable
            people={filteredPeople}
            selection={{
              selected,
              onToggle: toggle,
              allSelected: allFilteredSelected,
              someSelected: someFilteredSelected,
              onToggleAll: toggleAllFiltered,
            }}
            hiddenColumns={['roles', 'skills']}
          />
        ) : (
          <PeopleTable
            people={filteredPeople}
            hiddenColumns={['roles', 'skills']}
            trailingColumn={actionsColumn}
          />
        )}

        {isMobile && hasMore && (
          <Button
            variant="outline"
            onClick={loadMore}
            className="self-center"
          >
            Load more
          </Button>
        )}
      </div>

      {adding && selected.size > 0 && (
        <ActionBar
          selectedCount={selected.size}
          inviteCount={selectedNotInvited.length}
          onClear={() => setSelected(new Set())}
          onInvite={handleInvite}
          pending={pending}
        />
      )}

      <TypeToConfirmDialog
        open={removeTarget !== null}
        onOpenChange={(next) => {
          if (!next) setRemoveTarget(null)
        }}
        title="Remove this attendee?"
        description={
          removeTarget && (
            <>
              Removes{' '}
              <span className="text-foreground font-medium">
                {removeTarget.firstName} {removeTarget.lastName}
              </span>{' '}
              from this conference. All their signups, check-ins, and feedback
              will also be removed. This cannot be undone.
            </>
          )
        }
        confirmText={
          removeTarget
            ? `${removeTarget.firstName} ${removeTarget.lastName}`
            : ''
        }
        confirmLabel="Remove attendee"
        pendingLabel="Removing…"
        tone="destructive"
        pending={pending}
        onConfirm={handleRemove}
      />
    </TooltipProvider>
  )
}

interface CardListProps {
  people: PersonListItem[]
  // Add view: rows toggle selection. Attendee view: rows carry a remove menu.
  selectable: boolean
  selected: Set<string>
  onToggle: (id: string) => void
  onRemoveInvite: (person: PersonListItem) => void
}

function CardList({
  people,
  selectable,
  selected,
  onToggle,
  onRemoveInvite,
}: CardListProps) {
  return (
    <ul className="rounded-xl border overflow-hidden divide-y">
      {people.map((person) => {
        const isSelected = selectable && selected.has(person.id)
        return (
          <li
            key={person.id}
            className={`flex items-center gap-3 px-4 py-3 transition-colors ${
              selectable ? 'cursor-pointer' : ''
            } ${isSelected ? 'bg-primary/5' : selectable ? 'active:bg-muted/30' : ''}`}
            onClick={selectable ? () => onToggle(person.id) : undefined}
          >
            {selectable && (
              <Checkbox
                checked={isSelected}
                onCheckedChange={() => onToggle(person.id)}
                onClick={(e) => e.stopPropagation()}
                aria-label={`Select ${person.firstName} ${person.lastName}`}
              />
            )}
            <div className="flex-1 min-w-0">
              <PersonNameCell person={person} />
              <div className="text-xs text-muted-foreground truncate">
                {person.region?.name ?? '—'}
                {person.subregion ? ` · ${person.subregion.name}` : ''}
              </div>
            </div>
            {!selectable && (
              <div className="shrink-0">
                <RowActionsMenu onRemove={() => onRemoveInvite(person)} />
              </div>
            )}
          </li>
        )
      })}
    </ul>
  )
}

function PersonNameCell({ person }: { person: PersonListItem }) {
  const initials = `${person.firstName.charAt(0)}${person.lastName.charAt(0)}`
  return (
    <div className="flex items-center gap-3 min-w-0">
      {person.avatarUrl ? (
        <img
          src={person.avatarUrl}
          alt=""
          className="h-8 w-8 rounded-full object-cover shrink-0"
          referrerPolicy="no-referrer"
        />
      ) : (
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-medium text-primary/70">
          {initials}
        </div>
      )}
      <div className="min-w-0">
        <div className="font-medium truncate">
          {person.firstName} {person.lastName}
          {!person.isClaimed && (
            <span className="ml-2 text-xs text-muted-foreground/60 italic">
              Not yet joined
            </span>
          )}
        </div>
      </div>
    </div>
  )
}

function ModeButton({
  active,
  onClick,
  icon,
  label,
  count,
}: {
  active: boolean
  onClick: () => void
  icon: React.ReactNode
  label: string
  count?: number
}) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
        active
          ? 'bg-background text-foreground shadow-sm'
          : 'text-muted-foreground hover:text-foreground'
      }`}
    >
      {icon}
      {label}
      {count !== undefined && (
        <span className="text-muted-foreground tabular-nums">{count.toLocaleString()}</span>
      )}
    </button>
  )
}

// Per-row actions menu, opened via the trailing "..." button. Currently just
// "Remove from conference"; future Stage 5 actions (resend invite, view
// signups, etc.) slot in here without a UI rework.
function RowActionsMenu({ onRemove }: { onRemove: () => void }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 text-muted-foreground"
          onClick={(e) => e.stopPropagation()}
          aria-label="Open row actions"
        >
          <MoreHorizontal className="w-4 h-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
        <DropdownMenuItem
          className="text-destructive focus:text-destructive"
          onSelect={onRemove}
        >
          <Trash2 className="w-4 h-4 mr-2" />
          Remove from conference
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

interface ActionBarProps {
  selectedCount: number
  inviteCount: number
  onClear: () => void
  onInvite: () => void
  pending: boolean
}

function ActionBar({
  selectedCount,
  inviteCount,
  onClear,
  onInvite,
  pending,
}: ActionBarProps) {
  return (
    <div className="fixed inset-x-0 bottom-0 z-40 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <div className="px-4 md:px-8 py-3 flex items-center justify-between gap-3 max-w-screen-2xl mx-auto">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={onClear} disabled={pending}>
            <X className="w-4 h-4 mr-1" />
            Clear
          </Button>
          <span className="text-sm text-muted-foreground">
            {selectedCount.toLocaleString()} selected
          </span>
        </div>
        <Button
          onClick={onInvite}
          disabled={pending || inviteCount === 0}
          size="sm"
        >
          {pending
            ? 'Adding…'
            : inviteCount === 0
              ? 'All selected already attending'
              : inviteCount === 1
                ? 'Add 1 attendee'
                : `Add ${inviteCount.toLocaleString()} attendees`}
        </Button>
      </div>
    </div>
  )
}

function NoAttendeesYet({ onAdd }: { onAdd: () => void }) {
  return (
    <div className="rounded-xl border bg-card p-10 text-center">
      <div className="mx-auto rounded-full bg-muted/50 p-4 w-fit mb-4">
        <Users className="w-6 h-6 text-muted-foreground" />
      </div>
      <h3 className="text-base font-semibold tracking-tight mb-1.5">
        No attendees yet
      </h3>
      <p className="text-sm text-muted-foreground max-w-md mx-auto leading-relaxed mb-4">
        Add the members who are coming. You can add more at any time, even
        once the conference has started.
      </p>
      <Button onClick={onAdd}>
        <UserPlus className="w-4 h-4 mr-1.5" />
        Add people
      </Button>
    </div>
  )
}

function EmptyState() {
  return (
    <div className="rounded-xl border bg-card p-10 text-center">
      <div className="mx-auto rounded-full bg-muted/50 p-4 w-fit mb-4">
        <Search className="w-6 h-6 text-muted-foreground" />
      </div>
      <h3 className="text-base font-semibold tracking-tight mb-1.5">
        No matching people
      </h3>
      <p className="text-sm text-muted-foreground max-w-md mx-auto leading-relaxed">
        Try adjusting your search or filters.
      </p>
    </div>
  )
}
