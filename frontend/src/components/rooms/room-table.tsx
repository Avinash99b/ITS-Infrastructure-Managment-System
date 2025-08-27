'use client';

import * as React from 'react';
import {
  ColumnFiltersState,
  SortingState,
  VisibilityState,
  flexRender,
  getCoreRowModel,
  useReactTable,
  PaginationState,
} from '@tanstack/react-table';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { generateColumns } from './columns';
import type { Room } from '@/types';
import { Card, CardContent } from '../ui/card';
import { ChevronDown } from 'lucide-react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { Skeleton } from '../ui/skeleton';
import { useDebounce } from '@/hooks/use-debounce';
import { RoomForm } from './room-form';

interface RoomTableProps {
  data: Room[];
  pageCount: number;
  loading?: boolean;
  onSuccess: () => void;
}

function RoomTable({
  data,
  pageCount,
  loading,
  onSuccess,
}: RoomTableProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [editingRoom, setEditingRoom] = React.useState<Room | null>(null);

  const page = searchParams.get('page') ?? '1';
  const limit = searchParams.get('limit') ?? '10';

  const [{ pageIndex, pageSize }, setPagination] =
    React.useState<PaginationState>({
      pageIndex: Number(page) - 1,
      pageSize: Number(limit),
    });

  const pagination = React.useMemo(
    () => ({ pageIndex, pageSize }),
    [pageIndex, pageSize]
  );
  
  const createQueryString = React.useCallback(
    (params: Record<string, string | number | null>) => {
      const newSearchParams = new URLSearchParams(searchParams.toString());
      for (const [key, value] of Object.entries(params)) {
        if (value === null) {
          newSearchParams.delete(key);
        } else {
          newSearchParams.set(key, String(value));
        }
      }
      return newSearchParams.toString();
    },
    [searchParams]
  );

  React.useEffect(() => {
    router.push(
      `${pathname}?${createQueryString({
        page: pageIndex + 1,
        limit: pageSize,
      })}`,
      { scroll: false }
    );
  }, [pageIndex, pageSize, router, pathname, createQueryString]);

  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] =
    React.useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = React.useState({});
  
  const [filterValue, setFilterValue] = React.useState('');
  const debouncedFilterValue = useDebounce(filterValue, 500);

  const handleEdit = React.useCallback((room: Room) => {
    setEditingRoom(room);
  }, []);

  const handleFormSuccess = React.useCallback(() => {
    setEditingRoom(null);
    onSuccess();
  },[onSuccess]);

  const columns = React.useMemo(
    () => generateColumns({ onEdit: handleEdit, onDeleteSuccess: onSuccess }),
    [onSuccess, handleEdit]
  );

  const table = useReactTable({
    data,
    columns,
    pageCount: pageCount ?? -1,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getRowId: (row) => String(row.id),
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
      pagination,
    },
    manualPagination: true,
    manualFiltering: true,
    manualSorting: true,
  });
  
  React.useEffect(() => {
    table.getColumn('name')?.setFilterValue(debouncedFilterValue);
  }, [debouncedFilterValue, table]);

  return (
    <>
    {editingRoom && (
        <RoomForm
            isOpen={!!editingRoom}
            onOpenChange={(isOpen) => !isOpen && setEditingRoom(null)}
            onSuccess={handleFormSuccess}
            room={editingRoom}
        />
    )}
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center gap-4 py-4">
          <Input
            placeholder="Filter rooms by name..."
            value={filterValue}
            onChange={(event) => setFilterValue(event.target.value)}
            className="flex-1"
          />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="ml-auto">
                Columns <ChevronDown className="ml-2 h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {table
                .getAllColumns()
                .filter((column) => column.getCanHide())
                .map((column) => {
                  return (
                    <DropdownMenuCheckboxItem
                      key={column.id}
                      className="capitalize"
                      checked={column.getIsVisible()}
                      onCheckedChange={(value) =>
                        column.toggleVisibility(!!value)
                      }
                    >
                      {column.id}
                    </DropdownMenuCheckboxItem>
                  );
                })}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map((header) => {
                    return (
                      <TableHead key={header.id}>
                        {header.isPlaceholder
                          ? null
                          : flexRender(
                              header.column.columnDef.header,
                              header.getContext()
                            )}
                      </TableHead>
                    );
                  })}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {loading ? (
                Array.from({ length: pageSize }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell colSpan={columns.length}>
                      <Skeleton className="h-8 w-full" />
                    </TableCell>
                  </TableRow>
                ))
              ) : table.getRowModel().rows?.length ? (
                table.getRowModel().rows.map((row) => (
                  <TableRow
                    key={row.id}
                    id={`row-${row.id}`}
                    data-state={row.getIsSelected() && 'selected'}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id}>
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext()
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={columns.length}
                    className="h-24 text-center"
                  >
                    No results.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
        <div className="flex items-center justify-end space-x-2 py-4">
          <div className="flex-1 text-sm text-muted-foreground">
            {table.getFilteredSelectedRowModel().rows.length} of{' '}
            {table.getRowCount()} row(s) selected.
          </div>
          <div className="space-x-2">
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
      </CardContent>
    </Card>
    </>
  );
}


export default React.memo(RoomTable);
