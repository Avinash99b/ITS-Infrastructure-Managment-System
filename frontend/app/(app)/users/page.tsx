
'use client';
import UserTable from '@/components/users/user-table';
import PageHeader from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { PlusCircle, Search } from 'lucide-react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import React from 'react';
import { Input } from '@/components/ui/input';
import { useDebounce } from '@/hooks/use-debounce';
import type { User } from '@/types';
import { DateRangePicker } from '@/components/date-range-picker';
import { getUsers, handleApiError } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export default function UsersPage() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const searchInputRef = React.useRef<HTMLInputElement>(null);

  const [users, setUsers] = React.useState<User[]>([]);
  const [pageCount, setPageCount] = React.useState(0);
  const [loading, setLoading] = React.useState(true);

  const [searchTerm, setSearchTerm] = React.useState(
    searchParams.get('search') || ''
  );
  const debouncedSearchTerm = useDebounce(searchTerm, 500);

  const createQueryString = React.useCallback(
    (params: Record<string, string | number | null>) => {
      const newSearchParams = new URLSearchParams(searchParams.toString());
      for (const [key, value] of Object.entries(params)) {
        if (value === null || value === '' || value === 'all') {
          newSearchParams.delete(key);
        } else {
          newSearchParams.set(key, String(value));
        }
      }
      return newSearchParams.toString();
    },
    [searchParams]
  );

  const fetchUsers = React.useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams(searchParams.toString());
      const { users, total, limit } = await getUsers(params);
      setUsers(users);
      setPageCount(Math.ceil(total / limit));
    } catch (error) {
      handleApiError(error, toast, 'Failed to fetch users');
    } finally {
      setLoading(false);
    }
  }, [searchParams, toast]);

  React.useEffect(() => {
    const highlightId = searchParams.get('highlight');
    if (highlightId) {
      const element = document.getElementById(`row-${highlightId}`);
      if (element) {
        element.classList.add('animate-blink');
        setTimeout(() => {
          element.classList.remove('animate-blink');
          const newSearchParams = new URLSearchParams(window.location.search);
          newSearchParams.delete('highlight');
          router.replace(
            `${window.location.pathname}?${newSearchParams.toString()}`
          );
        }, 2000);
      }
    }
  }, [searchParams, router]);

  React.useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  React.useEffect(() => {
    router.push(
      `${pathname}?${createQueryString({ search: debouncedSearchTerm || null, page: '1' })}`,
      { scroll: false }
    );
  }, [debouncedSearchTerm, pathname, router, createQueryString]);

  const handleStatusChange = (status: string) => {
    router.push(`${pathname}?${createQueryString({ status, page: '1' })}`, {
      scroll: false,
    });
  };

  return (
    <div className="flex flex-1 flex-col gap-4 md:gap-8">
      <PageHeader
        title="User Management"
        description="Manage all user accounts and their permissions."
      >
        <Button>
          <PlusCircle className="mr-2 h-4 w-4" />
          Add User
        </Button>
      </PageHeader>

      <div className="flex flex-col md:flex-row items-center gap-4">
        <div className="relative w-full md:flex-1">
          <Search 
            className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground cursor-pointer"
            onClick={() => searchInputRef.current?.focus()}
          />
          <Input
            ref={searchInputRef}
            type="search"
            placeholder="Search by name, email..."
            className="w-full rounded-lg bg-background pl-8"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex w-full flex-col md:flex-row md:w-auto gap-4">
          <Select
            value={searchParams.get('status') || 'all'}
            onValueChange={handleStatusChange}
          >
            <SelectTrigger className="w-full md:w-[180px]">
              <SelectValue placeholder="Filter by Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
              <SelectItem value="suspended">Suspended</SelectItem>
            </SelectContent>
          </Select>
          <DateRangePicker
            onUpdate={({ range }) => {
              const rangeString =
                range.from && range.to
                  ? `${range.from.toISOString().split('T')[0]},${
                      range.to.toISOString().split('T')[0]
                    }`
                  : null;
              router.push(
                `${pathname}?${createQueryString({
                  range: rangeString,
                  page: '1',
                })}`
              );
            }}
            initialDateFrom={searchParams.get('range')?.split(',')[0]}
            initialDateTo={searchParams.get('range')?.split(',')[1]}
            align="end"
            className="w-full"
          />
        </div>
      </div>

      <UserTable data={users} loading={loading} pageCount={pageCount} onUpdateSuccess={fetchUsers} />
    </div>
  );
}
