
'use client';

import * as React from 'react';
import {
  ColumnDef,
  ColumnFiltersState,
  SortingState,
  VisibilityState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
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
import type { User } from '@/types';
import { Card, CardContent } from '../ui/card';
import { ChevronDown } from 'lucide-react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { Skeleton } from '../ui/skeleton';
import { PermissionsDialog } from './permissions-dialog';

interface UserTableProps {
  data: User[];
  pageCount: number;
  loading?: boolean;
  onUpdateSuccess: () => void;
}

function UserTable({ data, pageCount, loading, onUpdateSuccess }: UserTableProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [isPermissionsDialogOpen, setIsPermissionsDialogOpen] = React.useState(false);
  const [selectedUser, setSelectedUser] = React.useState<User | null>(null);

  const page = searchParams.get('page') ?? '1';
  const limit = searchParams.get('limit') ?? '10';
  const sort = searchParams.get('sort');
  const order = searchParams.get('order');

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

  const [{ pageIndex, pageSize }, setPagination] =
    React.useState<PaginationState>({
      pageIndex: Number(page) - 1,
      pageSize: Number(limit),
    });

  const [sorting, setSorting] = React.useState<SortingState>(
    sort && order ? [{ id: sort, desc: order === 'desc' }] : []
  );

  const pagination = React.useMemo(
    () => ({ pageIndex, pageSize }),
    [pageIndex, pageSize]
  );

  React.useEffect(() => {
    setPagination({
        pageIndex: Number(page) - 1,
        pageSize: Number(limit),
    })
  }, [page, limit])

  React.useEffect(() => {
    const params = createQueryString({
      page: pageIndex + 1,
      limit: pageSize,
    });
    router.push(`${pathname}?${params}`, { scroll: false });
  }, [pageIndex, pageSize, router, pathname, createQueryString]);

  React.useEffect(() => {
    let params: Record<string, string | number | null>;
    if (sorting.length > 0) {
      const { id, desc } = sorting[0];
      params = { sort: id, order: desc ? 'desc' : 'asc' };
    } else {
      params = { sort: null, order: null };
    }
    router.push(`${pathname}?${createQueryString(params)}`, { scroll: false });
  }, [sorting, router, pathname, createQueryString]);

  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = React.useState({});
  
  const handleManagePermissions = React.useCallback((user: User) => {
    setSelectedUser(user);
    setIsPermissionsDialogOpen(true);
  }, []);

  const columns = React.useMemo(
    () => generateColumns({ onUpdateSuccess, onManagePermissions: handleManagePermissions }),
    [onUpdateSuccess, handleManagePermissions]
  );


  const table = useReactTable({
    data,
    columns,
    pageCount: pageCount ?? -1,
    state: {
      pagination,
      sorting,
      columnVisibility,
      rowSelection,
    },
    onPaginationChange: setPagination,
    onSortingChange: setSorting,
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    getCoreRowModel: getCoreRowModel(),
    getRowId: (row) => String(row.id),
    manualPagination: true,
    manualSorting: true,
  });

  return (
    <>
      {selectedUser && (
        <PermissionsDialog
          isOpen={isPermissionsDialogOpen}
          onOpenChange={setIsPermissionsDialogOpen}
          user={selectedUser}
          onSuccess={() => {
            onUpdateSuccess();
            setIsPermissionsDialogOpen(false);
          }}
        />
      )}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center py-4">
            <div className="flex-1 text-sm text-muted-foreground">
              {table.getFilteredSelectedRowModel().rows.length} of{' '}
              {table.getRowCount()} row(s) selected.
            </div>
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

export default React.memo(UserTable);
