'use client'

import type { KeyboardEvent } from 'react'
import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getPaginationRowModel,
  flexRender,
  type ColumnDef,
  type SortingState,
} from '@tanstack/react-table'
import { ArrowUpDown, ArrowUp, ArrowDown, Search } from 'lucide-react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import type { PersonListItem } from '../types'
import { ROLE_CATEGORY_STYLES } from '../constants'

// Column ids managed by this component. `hiddenColumns` accepts any of these.
type DefaultColumnId = 'name' | 'roles' | 'region' | 'subregion' | 'skills'

export interface PeopleTableSelection {
  // Set of selected person ids — managed externally so "select all" can mean
  // "all filtered rows" rather than "all rows on this paginated page".
  selected: Set<string>
  onToggle: (id: string) => void
  // Header checkbox state, also externally computed.
  allSelected: boolean
  someSelected: boolean
  onToggleAll: () => void
}

interface PeopleTableProps {
  people: PersonListItem[]
  // When provided, the table renders in selection mode: prepends a checkbox
  // column, replaces row-click navigation with selection toggle, and shades
  // selected rows. Caller owns the state.
  selection?: PeopleTableSelection
  // Drop default columns the caller doesn't need (e.g. the attendee picker
  // hides roles + skills to keep rows scannable).
  hiddenColumns?: DefaultColumnId[]
  // Optional column appended after the defaults — for context-specific cells
  // like the "Invited" pill on the attendee picker.
  trailingColumn?: ColumnDef<PersonListItem>
}

export function PeopleTable({
  people,
  selection,
  hiddenColumns,
  trailingColumn,
}: PeopleTableProps) {
  const router = useRouter()
  const [sorting, setSorting] = useState<SortingState>([
    { id: 'name', desc: false },
  ])

  const columns = useMemo<ColumnDef<PersonListItem>[]>(() => {
    const hidden = new Set(hiddenColumns ?? [])
    const defaults: ColumnDef<PersonListItem>[] = [
      {
        id: 'name',
        accessorFn: (row) => `${row.firstName} ${row.lastName}`,
        header: ({ column }) => {
          const isSorted = column.getIsSorted()
          return (
            <Button
              variant="ghost"
              className="-ml-3 h-8 font-medium"
              onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
            >
              Name
              {isSorted === 'asc' ? (
                <ArrowUp className="ml-2 h-3.5 w-3.5" />
              ) : isSorted === 'desc' ? (
                <ArrowDown className="ml-2 h-3.5 w-3.5" />
              ) : (
                <ArrowUpDown className="ml-2 h-3.5 w-3.5 opacity-50" />
              )}
            </Button>
          )
        },
        cell: ({ row }) => {
          const person = row.original
          const initials = `${person.firstName.charAt(0)}${person.lastName.charAt(0)}`
          return (
            <div className="flex items-center gap-3">
              {person.avatarUrl ? (
                <img
                  src={person.avatarUrl}
                  alt=""
                  className="h-8 w-8 rounded-full object-cover"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-medium text-primary/70">
                  {initials}
                </div>
              )}
              <div>
                <span className="font-medium">
                  {person.firstName} {person.lastName}
                </span>
                {!person.isClaimed && (
                  <span className="ml-2 text-xs text-muted-foreground/60 italic">
                    Not yet joined
                  </span>
                )}
              </div>
            </div>
          )
        },
      },
      {
        id: 'roles',
        accessorFn: (row) => row.roles.map((r) => r.name).join(', '),
        header: 'Roles',
        cell: ({ row }) => (
          <div className="flex flex-wrap gap-1 max-w-[280px]">
            {row.original.roles.map((role) => (
              <Badge
                key={role.id}
                variant="outline"
                className={`text-[11px] font-medium px-2 py-0.5 ${ROLE_CATEGORY_STYLES[role.category] ?? 'bg-secondary'}`}
              >
                {role.name}
              </Badge>
            ))}
          </div>
        ),
        enableSorting: false,
      },
      {
        id: 'region',
        accessorFn: (row) => row.region?.name ?? '',
        header: ({ column }) => {
          const isSorted = column.getIsSorted()
          return (
            <Button
              variant="ghost"
              className="-ml-3 h-8 font-medium"
              onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
            >
              Region
              {isSorted === 'asc' ? (
                <ArrowUp className="ml-2 h-3.5 w-3.5" />
              ) : isSorted === 'desc' ? (
                <ArrowDown className="ml-2 h-3.5 w-3.5" />
              ) : (
                <ArrowUpDown className="ml-2 h-3.5 w-3.5 opacity-50" />
              )}
            </Button>
          )
        },
        cell: ({ row }) => row.original.region?.name ?? '—',
      },
      {
        id: 'subregion',
        accessorFn: (row) => row.subregion?.name ?? '',
        header: ({ column }) => {
          const isSorted = column.getIsSorted()
          return (
            <Button
              variant="ghost"
              className="-ml-3 h-8 font-medium"
              onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
            >
              Subregion
              {isSorted === 'asc' ? (
                <ArrowUp className="ml-2 h-3.5 w-3.5" />
              ) : isSorted === 'desc' ? (
                <ArrowDown className="ml-2 h-3.5 w-3.5" />
              ) : (
                <ArrowUpDown className="ml-2 h-3.5 w-3.5 opacity-50" />
              )}
            </Button>
          )
        },
        cell: ({ row }) => row.original.subregion?.name ?? '—',
      },
      {
        id: 'skills',
        accessorFn: (row) => row.skills.join(', '),
        header: 'Skills',
        cell: ({ row }) => (
          <span className="text-sm text-muted-foreground">
            {row.original.skills.slice(0, 3).join(' • ') || '—'}
          </span>
        ),
        enableSorting: false,
      },
    ]
    const result = defaults.filter(
      (c) => !hidden.has(c.id as DefaultColumnId)
    )
    if (selection) {
      result.unshift({
        id: 'select',
        header: () => (
          <Checkbox
            checked={
              selection.allSelected
                ? true
                : selection.someSelected
                  ? 'indeterminate'
                  : false
            }
            onCheckedChange={selection.onToggleAll}
            aria-label={
              selection.allSelected ? 'Deselect all' : 'Select all'
            }
          />
        ),
        cell: ({ row }) => (
          <Checkbox
            checked={selection.selected.has(row.original.id)}
            onCheckedChange={() => selection.onToggle(row.original.id)}
            onClick={(e) => e.stopPropagation()}
            aria-label={`Select ${row.original.firstName} ${row.original.lastName}`}
          />
        ),
        enableSorting: false,
      })
    }
    if (trailingColumn) result.push(trailingColumn)
    return result
  }, [hiddenColumns, selection, trailingColumn])

  const table = useReactTable({
    data: people,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: {
      pagination: { pageSize: 20 },
    },
  })

  if (people.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="mb-4 rounded-full bg-muted/50 p-4">
          <Search className="h-8 w-8 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-medium text-foreground mb-1">No people found</h3>
        <p className="text-sm text-muted-foreground max-w-xs">
          Try adjusting your search or filters to find what you&apos;re looking for.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="rounded-lg border bg-card">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.map((row) => {
              const isClaimed = row.original.isClaimed
              const isSelected = selection?.selected.has(row.original.id) ?? false
              // In selection mode: row click toggles selection (always, even
              // for unclaimed users — they're valid invite targets).
              // In navigation mode: row click navigates to the profile page,
              // but only for claimed users.
              const handleRowClick = () => {
                if (selection) selection.onToggle(row.original.id)
                else if (isClaimed) router.push(`/people/${row.original.id}`)
              }
              const handleRowKeyDown = (e: KeyboardEvent<HTMLTableRowElement>) => {
                if ((e.key === 'Enter' || (selection && e.key === ' ')) && (selection || isClaimed)) {
                  e.preventDefault()
                  handleRowClick()
                }
              }
              const interactive = selection ? true : isClaimed
              const className = selection
                ? `cursor-pointer focus:outline-none focus-visible:bg-muted/50 ${
                    isSelected ? 'bg-primary/5 hover:bg-primary/10' : ''
                  }`
                : isClaimed
                  ? 'cursor-pointer focus:outline-none focus-visible:bg-muted/50'
                  : 'opacity-60'
              return (
                <TableRow
                  key={row.id}
                  onClick={interactive ? handleRowClick : undefined}
                  onKeyDown={interactive ? handleRowKeyDown : undefined}
                  tabIndex={interactive ? 0 : -1}
                  role={interactive ? (selection ? 'button' : 'link') : undefined}
                  aria-label={
                    selection
                      ? `Toggle ${row.original.firstName} ${row.original.lastName}`
                      : isClaimed
                        ? `View profile of ${row.original.firstName} ${row.original.lastName}`
                        : undefined
                  }
                  aria-pressed={selection ? isSelected : undefined}
                  className={className}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {table.getPageCount() > 1 && (
        <div className="flex items-center justify-between px-2">
          <p className="text-sm text-muted-foreground">
            Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount()}
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
