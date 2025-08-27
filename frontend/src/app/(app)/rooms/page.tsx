'use client';
import RoomTable from '@/components/rooms/room-table';
import PageHeader from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { PlusCircle } from 'lucide-react';
import { useSearchParams, useRouter } from 'next/navigation';
import React from 'react';
import { getRooms, handleApiError } from '@/lib/api';
import type { Room } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { RoomForm } from '@/components/rooms/room-form';

export default function RoomsPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { toast } = useToast();

  const [rooms, setRooms] = React.useState<Room[]>([]);
  const [pageCount, setPageCount] = React.useState(0);
  const [loading, setLoading] = React.useState(true);
  const [isFormOpen, setIsFormOpen] = React.useState(false);

  const fetchRooms = React.useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams(searchParams.toString());
      const { data, total, limit } = await getRooms(params);
      setRooms(data);
      setPageCount(Math.ceil(total / limit));
    } catch (error) {
      handleApiError(error, toast, 'Failed to fetch rooms');
    } finally {
      setLoading(false);
    }
  }, [searchParams, toast]);

  React.useEffect(() => {
    fetchRooms();
  }, [fetchRooms]);

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
  }, [searchParams, router, rooms]); // Depend on rooms to re-run after data is fetched

  const handleFormSuccess = () => {
    fetchRooms();
    setIsFormOpen(false);
  };

  return (
    <>
      <RoomForm
        isOpen={isFormOpen}
        onOpenChange={setIsFormOpen}
        onSuccess={handleFormSuccess}
      />
      <div className="flex flex-1 flex-col gap-4 md:gap-8">
        <PageHeader
          title="Room Management"
          description="Manage all rooms in your facility."
        >
          <Button onClick={() => setIsFormOpen(true)}>
            <PlusCircle className="mr-2 h-4 w-4" />
            Add Room
          </Button>
        </PageHeader>
        <RoomTable
          data={rooms}
          pageCount={pageCount}
          loading={loading}
          onSuccess={fetchRooms}
        />
      </div>
    </>
  );
}
