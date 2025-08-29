
'use client';
import FaultTable from '@/components/faults/fault-table';
import PageHeader from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { PlusCircle, Search } from 'lucide-react';
import React from 'react';
import { getFaults, getUsers, handleApiError } from '@/lib/api';
import type { Fault, User } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { FaultForm } from '@/components/faults/fault-form';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useDebounce } from '@/hooks/use-debounce';

export default function FaultsPage() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { toast } = useToast();

  const [faults, setFaults] = React.useState<Fault[]>([]);
  const [technicians, setTechnicians] = React.useState<User[]>([]);
  const [pageCount, setPageCount] = React.useState(0);
  const [loading, setLoading] = React.useState(true);
  const [isFormOpen, setIsFormOpen] = React.useState(false);

  const [serialNoSearch, setSerialNoSearch] = React.useState(searchParams.get('system_disk_serial_no') || '');
  const debouncedSerialNo = useDebounce(serialNoSearch, 500);

  const [reporterSearch, setReporterSearch] = React.useState(searchParams.get('reporter_name') || '');
  const debouncedReporter = useDebounce(reporterSearch, 500);

  const createQueryString = React.useCallback(
    (params: Record<string, string | number | null>) => {
      const newSearchParams = new URLSearchParams(searchParams.toString());
      for (const [key, value] of Object.entries(params)) {
        if (value === null || value === '') {
          newSearchParams.delete(key);
        } else {
          newSearchParams.set(key, String(value));
        }
      }
      return newSearchParams.toString();
    },
    [searchParams]
  );
  
  const fetchFaultsAndTechnicians = React.useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams(searchParams.toString());
      const [{ data, total, limit }, { users }] = await Promise.all([
        getFaults(params),
        getUsers(new URLSearchParams({ permissions: 'fix_faults' })),
      ]);
      setFaults(data);
      setPageCount(Math.ceil(total / limit));
      setTechnicians(users);
    } catch (error) {
      handleApiError(error, toast, 'Failed to fetch data');
    } finally {
      setLoading(false);
    }
  }, [searchParams, toast]);

  React.useEffect(() => {
    fetchFaultsAndTechnicians();
  }, [fetchFaultsAndTechnicians]);
  
  React.useEffect(() => {
    const newQuery = createQueryString({
      system_disk_serial_no: debouncedSerialNo,
      reporter_name: debouncedReporter,
      page: 1, // Reset to page 1 on search
    });
  
    // Only push if the search part of the query actually changes
    const currentSearch = new URLSearchParams(searchParams.toString());
    const newSearch = new URLSearchParams(newQuery);
    currentSearch.delete('page');
    currentSearch.delete('limit');
    newSearch.delete('page');
    newSearch.delete('limit');
  
    if (currentSearch.toString() !== newSearch.toString()) {
      router.push(`${pathname}?${newQuery}`, { scroll: false });
    }
  }, [debouncedSerialNo, debouncedReporter, pathname, router, createQueryString, searchParams]);


  const handleStatusChange = (value: string) => {
    const newStatus = value === 'all' ? null : value;
    router.push(`${pathname}?${createQueryString({ status: newStatus, page: '1' })}`, {
      scroll: false,
    });
  };


  const handleFormSuccess = () => {
    fetchFaultsAndTechnicians();
    setIsFormOpen(false);
  };

  return (
    <>
      <FaultForm
        isOpen={isFormOpen}
        onOpenChange={setIsFormOpen}
        onSuccess={handleFormSuccess}
      />
      <div className="flex flex-1 flex-col gap-4 md:gap-8">
        <PageHeader
          title="Fault Reporting"
          description="Track and manage all reported system faults."
        >
          <Button onClick={() => setIsFormOpen(true)}>
            <PlusCircle className="mr-2 h-4 w-4" />
            Report Fault
          </Button>
        </PageHeader>
        
        <div className="flex flex-col md:flex-row items-center gap-4">
          <div className="relative w-full md:flex-1">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search by serial number..."
              className="w-full rounded-lg bg-background pl-8"
              value={serialNoSearch}
              onChange={(e) => setSerialNoSearch(e.target.value)}
            />
          </div>
          <div className="relative w-full md:flex-1">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
             <Input
              type="search"
              placeholder="Search by reporter name..."
              className="w-full rounded-lg bg-background pl-8"
              value={reporterSearch}
              onChange={(e) => setReporterSearch(e.target.value)}
            />
          </div>
          <div className="w-full md:w-auto">
            <Select
                value={searchParams.get('status') || 'all'}
                onValueChange={handleStatusChange}
            >
                <SelectTrigger className="w-full md:w-[180px]">
                <SelectValue placeholder="Filter by Status" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="resolved">Resolved</SelectItem>
                </SelectContent>
            </Select>
          </div>
        </div>

        <FaultTable
          data={faults}
          pageCount={pageCount}
          loading={loading}
          technicians={technicians}
          onUpdateSuccess={fetchFaultsAndTechnicians}
        />
      </div>
    </>
  );
}
