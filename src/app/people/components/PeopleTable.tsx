'use client'

import type { KeyboardEvent } from 'react'
import { useMemo, useState } from 'react'
import Image from 'next/image'
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
import type { PersonListItem } from '../types'
import { ROLE_CATEGORY_ICONS } from '../constants'

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
                <Image
                  src={person.avatarUrl}
                  alt=""
                  width={32}
                  height={32}
                  className="h-8 w-8 rounded-full object-cover"
                  referrerPolicy="no-referrer"
                  unoptimized
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
            {row.original.roles.map((role) => {
              const Icon = ROLE_CATEGORY_ICONS[role.category]
              return (
                <Badge
                  key={role.id}
                  variant="outline"
                  className="gap-1 px-2 py-0.5 text-[11px] font-medium"
                >
                  {Icon && <Icon className="h-3 w-3 opacity-70" aria-hidden="true" />}
                  {role.name}
                </Badge>
              )
            })}
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
              const handleRowClick = () => {
                if (isClaimed) router.push(`/people/${row.original.id}`)
              }
              const handleRowKeyDown = (e: KeyboardEvent<HTMLTableRowElement>) => {
                if (e.key === 'Enter' && isClaimed) {
                  e.preventDefault()
                  handleRowClick()
                }
              }
              return (
                <TableRow
                  key={row.id}
                  onClick={isClaimed ? handleRowClick : undefined}
                  onKeyDown={isClaimed ? handleRowKeyDown : undefined}
                  tabIndex={isClaimed ? 0 : -1}
                  role={isClaimed ? 'link' : undefined}
                  aria-label={isClaimed ? `View profile of ${row.original.firstName} ${row.original.lastName}` : undefined}
                  className={isClaimed ? 'cursor-pointer focus:outline-none focus-visible:bg-muted/50' : 'opacity-60'}
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
