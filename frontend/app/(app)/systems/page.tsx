
'use client';
import PageHeader from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { PlusCircle, Search } from 'lucide-react';
import React from 'react';
import { getSystems, handleApiError, getRooms, getBlocks } from '@/lib/api';
import type { System, Room, Block } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import SystemTable from '@/components/systems/system-table';
import { SystemForm } from '@/components/systems/system-form';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useDebounce } from '@/hooks/use-debounce';

export default function SystemsPage() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { toast } = useToast();

  const [systems, setSystems] = React.useState<System[]>([]);
  const [rooms, setRooms] = React.useState<Room[]>([]);
  const [filteredRooms, setFilteredRooms] = React.useState<Room[]>([]);
  const [blocks, setBlocks] = React.useState<Block[]>([]);
  const [floors, setFloors] = React.useState<number[]>([]);
  const [pageCount, setPageCount] = React.useState(0);
  const [loading, setLoading] = React.useState(true);
  const [isFormOpen, setIsFormOpen] = React.useState(false);

  const [searchTerm, setSearchTerm] = React.useState(searchParams.get('search') || '');
  const debouncedSearchTerm = useDebounce(searchTerm, 500);
  
  const selectedBlockId = searchParams.get('block_id');
  const selectedFloor = searchParams.get('floor');

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

  const fetchSystemsAndFilters = React.useCallback(async () => {
    setLoading(true);
    try {
      const systemParams = new URLSearchParams(searchParams.toString());
      const roomParams = new URLSearchParams({ limit: '9999' }); // Fetch all rooms
      
      const [{ data, total, limit }, roomsResponse, blocksResponse] = await Promise.all([
          getSystems(systemParams),
          getRooms(roomParams),
          getBlocks()
      ]);

      setSystems(data);
      setRooms(roomsResponse.data);
      setBlocks(blocksResponse);
      
      // Get unique floors from rooms
      const uniqueFloors = [...new Set(roomsResponse.data.map(r => r.floor).filter(f => f !== null))] as number[];
      setFloors(uniqueFloors.sort((a, b) => a - b));

      setPageCount(Math.ceil(total / limit));
    } catch (error) {
      handleApiError(error, toast, 'Failed to fetch page data');
    } finally {
      setLoading(false);
    }
  }, [searchParams, toast]);

  React.useEffect(() => {
    fetchSystemsAndFilters();
  }, [fetchSystemsAndFilters, searchParams]);

  React.useEffect(() => {
    if (rooms.length > 0) {
      let tempFilteredRooms = rooms;

      if (selectedBlockId) {
        tempFilteredRooms = tempFilteredRooms.filter(room => String(room.block_id) === selectedBlockId);
      }

      if (selectedFloor) {
        tempFilteredRooms = tempFilteredRooms.filter(room => String(room.floor) === selectedFloor);
      }
      
      if (!selectedBlockId) {
        setFilteredRooms([]);
      } else {
        setFilteredRooms(tempFilteredRooms);
      }

    } else {
      setFilteredRooms([]);
    }
  }, [selectedBlockId, selectedFloor, rooms]);

  React.useEffect(() => {
    const newQuery = createQueryString({ search: debouncedSearchTerm, page: '1' });
    const currentSearch = new URLSearchParams(searchParams.toString());
    const newSearch = new URLSearchParams(newQuery);
    currentSearch.delete('page');
    currentSearch.delete('limit');
    newSearch.delete('page');
    newSearch.delete('limit');
  
    if (currentSearch.toString() !== newSearch.toString()) {
      router.push(`${pathname}?${newQuery}`, { scroll: false });
    }
  }, [debouncedSearchTerm, pathname, router, createQueryString, searchParams]);

  const handleFilterChange = (key: string, value: string) => {
    const newQueryValue = value === 'all' ? null : value;
     const newParams: Record<string, string | number | null> = { [key]: newQueryValue, page: '1' };

    // If block is changed, reset room and floor
    if (key === 'block_id') {
      newParams['room_id'] = null;
      newParams['floor'] = null;
    }

    if (key === 'floor' && newQueryValue) {
        newParams['room_id'] = null;
    }
    
    router.push(`${pathname}?${createQueryString(newParams)}`, {
      scroll: false,
    });
  };

  const handleFormSuccess = () => {
    fetchSystemsAndFilters();
    setIsFormOpen(false);
  };

  return (
    <>
      <SystemForm
        isOpen={isFormOpen}
        onOpenChange={setIsFormOpen}
        onSuccess={handleFormSuccess}
      />
      <div className="flex flex-1 flex-col gap-4 md:gap-8">
        <PageHeader
          title="System Management"
          description="Manage all registered systems."
        >
          <Button onClick={() => setIsFormOpen(true)}>
            <PlusCircle className="mr-2 h-4 w-4" />
            Add System
          </Button>
        </PageHeader>

        <div className="flex flex-col md:flex-row items-center gap-4">
          <div className="relative w-full md:flex-1">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search by serial, type, or status..."
              className="w-full rounded-lg bg-background pl-8"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="grid w-full grid-cols-2 md:flex md:w-auto gap-4">
             <Select
                value={searchParams.get('block_id') || 'all'}
                onValueChange={(value) => handleFilterChange('block_id', value)}
            >
                <SelectTrigger className="w-full">
                <SelectValue placeholder="Filter by Block" />
                </SelectTrigger>
                <SelectContent>
                <SelectItem value="all">All Blocks</SelectItem>
                {blocks.map(block => (
                    <SelectItem key={block.id} value={String(block.id)}>{block.name}</SelectItem>
                ))}
                </SelectContent>
            </Select>
             <Select
                value={searchParams.get('floor') || 'all'}
                onValueChange={(value) => handleFilterChange('floor', value)}
                disabled={!selectedBlockId}
            >
                <SelectTrigger className="w-full">
                <SelectValue placeholder="Filter by Floor" />
                </SelectTrigger>
                <SelectContent>
                <SelectItem value="all">All Floors</SelectItem>
                {floors.map(floor => (
                    <SelectItem key={floor} value={String(floor)}>{floor}</SelectItem>
                ))}
                </SelectContent>
            </Select>
             <Select
                value={searchParams.get('room_id') || 'all'}
                onValueChange={(value) => handleFilterChange('room_id', value)}
                disabled={!selectedBlockId}
            >
                <SelectTrigger className="w-full">
                <SelectValue placeholder="Filter by Room" />
                </SelectTrigger>
                <SelectContent>
                <SelectItem value="all">All Rooms</SelectItem>
                {filteredRooms.map(room => (
                    <SelectItem key={room.id} value={String(room.id)}>{room.name}</SelectItem>
                ))}
                </SelectContent>
            </Select>
            <Select
                value={searchParams.get('type') || 'all'}
                onValueChange={(value) => handleFilterChange('type', value)}
            >
                <SelectTrigger className="w-full">
                <SelectValue placeholder="Filter by Type" />
                </SelectTrigger>
                <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="spare">Spare</SelectItem>
                <SelectItem value="using">Using</SelectItem>
                </SelectContent>
            </Select>
            <Select
                value={searchParams.get('status') || 'all'}
                onValueChange={(value) => handleFilterChange('status', value)}
            >
                <SelectTrigger className="w-full">
                <SelectValue placeholder="Filter by Status" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="green">Green</SelectItem>
                    <SelectItem value="orange">Orange</SelectItem>
                    <SelectItem value="red">Red</SelectItem>
                </SelectContent>
            </Select>
          </div>
        </div>

        <SystemTable
          data={systems}
          pageCount={pageCount}
          loading={loading}
          onSuccess={fetchSystemsAndFilters}
        />
      </div>
    </>
  );
}
