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
import { ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react'
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
import type { PersonListItem } from '../types'
import { ROLE_CATEGORY_STYLES } from '../constants'

interface PeopleTableProps {
  people: PersonListItem[]
}

export function PeopleTable({ people }: PeopleTableProps) {
  const router = useRouter()
  const [sorting, setSorting] = useState<SortingState>([
    { id: 'name', desc: false },
  ])

  const columns = useMemo<ColumnDef<PersonListItem>[]>(
    () => [
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
                />
              ) : (
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-medium text-primary/70">
                  {initials}
                </div>
              )}
              <span className="font-medium">
                {person.firstName} {person.lastName}
              </span>
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
        accessorFn: (row) => row.region.name,
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
        cell: ({ row }) => row.original.region.name,
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
    ],
    []
  )

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
        <div className="text-4xl mb-3">🔍</div>
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
              const handleRowClick = () => router.push(`/people/${row.original.id}`)
              const handleRowKeyDown = (e: KeyboardEvent<HTMLTableRowElement>) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  handleRowClick()
                }
              }
              return (
                <TableRow
                  key={row.id}
                  onClick={handleRowClick}
                  onKeyDown={handleRowKeyDown}
                  tabIndex={0}
                  role="link"
                  aria-label={`View profile of ${row.original.firstName} ${row.original.lastName}`}
                  className="cursor-pointer focus:outline-none focus-visible:bg-muted/50"
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
