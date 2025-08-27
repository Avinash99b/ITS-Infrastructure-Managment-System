
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
import { generateColumns } from './columns';
import type { System } from '@/types';
import { Card, CardContent } from '../ui/card';
import { ChevronDown, ChevronsLeft, ChevronsRight, ChevronLeft, ChevronRight as ChevronRightIcon } from 'lucide-react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { Skeleton } from '../ui/skeleton';
import { SystemForm } from './system-form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';

interface SystemTableProps {
  data: System[];
  pageCount: number;
  loading?: boolean;
  onSuccess: () => void;
}

function SystemTable({
  data,
  pageCount,
  loading,
  onSuccess,
}: SystemTableProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [editingSystem, setEditingSystem] = React.useState<System | null>(null);

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
  

  const handleEdit = React.useCallback((system: System) => {
    setEditingSystem(system);
  }, []);

  const handleFormSuccess = React.useCallback(() => {
    setEditingSystem(null);
    onSuccess();
  }, [onSuccess]);

  const columns = React.useMemo(
    () => generateColumns({ onEdit: handleEdit, onSuccess: onSuccess }),
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
    getRowId: (row) => row.disk_serial_no,
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

  return (
    <>
    {editingSystem && (
        <SystemForm
            isOpen={!!editingSystem}
            onOpenChange={(isOpen) => !isOpen && setEditingSystem(null)}
            onSuccess={handleFormSuccess}
            system={editingSystem}
        />
    )}
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center justify-end py-4">
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
                      {column.id.replace(/_/g, ' ')}
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
                    key={row.original.disk_serial_no}
                    id={`row-${row.original.disk_serial_no}`}
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
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 py-4">
           <div className="text-sm text-muted-foreground">
            {table.getFilteredSelectedRowModel().rows.length} of{" "}
            {table.getRowCount()} row(s) selected.
          </div>

          <div className="flex flex-col md:flex-row items-center gap-4 md:gap-6">
            <div className="flex items-center gap-2">
                <p className="text-sm font-medium">Rows per page</p>
                 <Select
                    value={`${table.getState().pagination.pageSize}`}
                    onValueChange={(value) => {
                        table.setPageSize(Number(value))
                    }}
                    >
                    <SelectTrigger className="h-8 w-[70px]">
                        <SelectValue placeholder={table.getState().pagination.pageSize} />
                    </SelectTrigger>
                    <SelectContent side="top">
                        {[10, 20, 30, 40, 50].map((pageSize) => (
                        <SelectItem key={pageSize} value={`${pageSize}`}>
                            {pageSize}
                        </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>
             <div className="flex items-center justify-center text-sm font-medium">
                Page {table.getState().pagination.pageIndex + 1} of{" "}
                {table.getPageCount()}
            </div>

            <div className="flex items-center gap-2">
                 <Button
                    variant="outline"
                    className="hidden h-8 w-8 p-0 lg:flex"
                    onClick={() => table.setPageIndex(0)}
                    disabled={!table.getCanPreviousPage()}
                    >
                    <span className="sr-only">Go to first page</span>
                    <ChevronsLeft className="h-4 w-4" />
                </Button>
                <Button
                    variant="outline"
                    className="h-8 w-8 p-0"
                    onClick={() => table.previousPage()}
                    disabled={!table.getCanPreviousPage()}
                    >
                    <span className="sr-only">Go to previous page</span>
                    <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                    variant="outline"
                    className="h-8 w-8 p-0"
                    onClick={() => table.nextPage()}
                    disabled={!table.getCanNextPage()}
                    >
                    <span className="sr-only">Go to next page</span>
                    <ChevronRightIcon className="h-4 w-4" />
                </Button>
                <Button
                    variant="outline"
                    className="hidden h-8 w-8 p-0 lg:flex"
                    onClick={() => table.setPageIndex(table.getPageCount() - 1)}
                    disabled={!table.getCanNextPage()}
                    >
                    <span className="sr-only">Go to last page</span>
                    <ChevronsRight className="h-4 w-4" />
                </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
    </>
  );
}

export default React.memo(SystemTable);
    
