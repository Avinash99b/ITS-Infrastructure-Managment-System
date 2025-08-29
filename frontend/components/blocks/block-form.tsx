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
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { createBlock, updateBlock, handleApiError } from '@/lib/api';
import type { Block } from '@/types';

const blockFormSchema = z.object({
  name: z.string().min(1, 'Block name is required'),
  description: z.string().optional(),
});

type BlockFormValues = z.infer<typeof blockFormSchema>;

interface BlockFormProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onSuccess: () => void;
  block?: Block | null;
}

export function BlockForm({
  isOpen,
  onOpenChange,
  onSuccess,
  block,
}: BlockFormProps) {
  const { toast } = useToast();
  const isEditing = !!block;

  const form = useForm<BlockFormValues>({
    resolver: zodResolver(blockFormSchema),
    defaultValues: {
      name: '',
      description: '',
    },
  });

  React.useEffect(() => {
    if (block) {
      form.reset({
        name: block.name,
        description: block.description || '',
      });
    } else {
      form.reset({
        name: '',
        description: '',
      });
    }
  }, [block, form, isOpen]);

  const onSubmit = async (data: BlockFormValues) => {
    try {
      if (isEditing && block) {
        await updateBlock(String(block.id), data);
        toast({
          title: 'Block Updated',
          description: `Block "${data.name}" has been updated successfully.`,
        });
      } else {
        await createBlock(data as Omit<Block, 'id' | 'created_at' | 'updated_at' | 'image_url'>);
        toast({
          title: 'Block Created',
          description: `Block "${data.name}" has been created successfully.`,
        });
      }
      onSuccess();
    } catch (error) {
      handleApiError(error, toast, `Failed to ${isEditing ? 'update' : 'create'} block`);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Edit Block' : 'Add New Block'}</DialogTitle>
          <DialogDescription>
            {isEditing
              ? 'Update the details for this block.'
              : 'Fill in the details to create a new block.'}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Block Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. Block A" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Enter a short description for the block"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
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
                  : 'Create Block'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
