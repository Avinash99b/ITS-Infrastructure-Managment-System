'use client';
import BlockTable from '@/components/blocks/block-table';
import PageHeader from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { PlusCircle } from 'lucide-react';
import { useSearchParams, useRouter } from 'next/navigation';
import React from 'react';
import { getBlocks, handleApiError } from '@/lib/api';
import type { Block } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { BlockForm } from '@/components/blocks/block-form';

export default function BlocksPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { toast } = useToast();
  const [blocks, setBlocks] = React.useState<Block[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [isFormOpen, setIsFormOpen] = React.useState(false);

  const highlightId = searchParams.get('highlight');

  const fetchBlocks = React.useCallback(async () => {
    setLoading(true);
    try {
      const data = await getBlocks();
      setBlocks(data);
    } catch (error) {
      handleApiError(error, toast, 'Failed to fetch blocks');
    } finally {
      setLoading(false);
    }
  }, [toast]);

  React.useEffect(() => {
    fetchBlocks();
  }, [fetchBlocks]);

  React.useEffect(() => {
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
  }, [highlightId, router]);

  const handleFormSuccess = () => {
    fetchBlocks();
    setIsFormOpen(false);
  };

  return (
    <>
      <BlockForm
        isOpen={isFormOpen}
        onOpenChange={setIsFormOpen}
        onSuccess={handleFormSuccess}
      />
      <div className="flex flex-1 flex-col gap-4 md:gap-8">
        <PageHeader
          title="Block Management"
          description="Manage all building blocks and their locations."
        >
          <Button onClick={() => setIsFormOpen(true)}>
            <PlusCircle className="mr-2 h-4 w-4" />
            Add Block
          </Button>
        </PageHeader>
        <BlockTable
          data={blocks}
          loading={loading}
          onEdit={(block) => {
            // This is a placeholder for future edit functionality
            console.log('Editing block:', block);
          }}
          onDeleteSuccess={fetchBlocks}
        />
      </div>
    </>
  );
}
