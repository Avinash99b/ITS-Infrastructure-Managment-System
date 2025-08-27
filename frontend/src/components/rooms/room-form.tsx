'use client';

import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { createRoom, updateRoom, getBlocks, handleApiError } from '@/lib/api';
import type { Room, Block } from '@/types';

const roomFormSchema = z.object({
  name: z.string().min(1, 'Room name is required'),
  blockId: z.coerce.number({
    required_error: 'Please select a block.',
    invalid_type_error: 'Please select a block.',
  }).min(1, 'Please select a block.'),
  floor: z.coerce.number({
    required_error: 'Please enter a floor number.',
    invalid_type_error: 'Floor must be a number.',
  }),
});

type RoomFormValues = z.infer<typeof roomFormSchema>;

interface RoomFormProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onSuccess: () => void;
  room?: Room | null;
}

export function RoomForm({
  isOpen,
  onOpenChange,
  onSuccess,
  room,
}: RoomFormProps) {
  const { toast } = useToast();
  const [blocks, setBlocks] = React.useState<Block[]>([]);
  const isEditing = !!room;

  const form = useForm<RoomFormValues>({
    resolver: zodResolver(roomFormSchema),
  });

  React.useEffect(() => {
    async function fetchBlocks() {
      try {
        const blockData = await getBlocks();
        setBlocks(blockData);
      } catch (error) {
        handleApiError(error, toast, 'Failed to fetch blocks');
      }
    }
    if (isOpen) {
      fetchBlocks();
    }
  }, [isOpen, toast]);

  React.useEffect(() => {
    if (isOpen) {
      if (room) {
        form.reset({
          name: room.name,
          blockId: room.block_id,
          floor: room.floor ?? undefined,
        });
      } else {
        form.reset({
          name: '',
          floor: undefined,
        });
      }
    }
  }, [room, form, isOpen]);

  const onSubmit = async (data: RoomFormValues) => {
    try {
      if (isEditing && room) {
        await updateRoom(room.id, data);
        toast({
          title: 'Room Updated',
          description: `Room "${data.name}" has been updated successfully.`,
        });
      } else {
        await createRoom(data);
        toast({
          title: 'Room Created',
          description: `Room "${data.name}" has been created successfully.`,
        });
      }
      onSuccess();
    } catch (error) {
      handleApiError(error, toast, `Failed to ${isEditing ? 'update' : 'create'} room`);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Edit Room' : 'Add New Room'}</DialogTitle>
          <DialogDescription>
            {isEditing
              ? 'Update the details for this room.'
              : 'Fill in the details to create a new room.'}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Room Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. Conference Room A" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="blockId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Block</FormLabel>
                     <Select onValueChange={field.onChange} defaultValue={String(field.value)}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a block" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {blocks.map((block) => (
                          <SelectItem key={block.id} value={String(block.id)}>
                            {block.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
               <FormField
                control={form.control}
                name="floor"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Floor</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="e.g. 1" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting
                  ? 'Saving...'
                  : isEditing
                  ? 'Save Changes'
                  : 'Create Room'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
