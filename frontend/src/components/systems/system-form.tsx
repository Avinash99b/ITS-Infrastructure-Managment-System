
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
import { useToast } from '@/hooks/use-toast';
import { createSystem, updateSystem, handleApiError } from '@/lib/api';
import type { System } from '@/types';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';

const systemFormSchema = z.object({
  name: z.string().min(1, 'System name is required'),
  disk_serial_no: z.string().min(1, 'Disk serial number is required'),
  type: z.enum(['spare', 'using'], {
    required_error: 'Please select a system type.',
  }),
  status: z.enum(['green', 'orange', 'red'], {
    required_error: 'Please select a system status.',
  }),
});

type SystemFormValues = z.infer<typeof systemFormSchema>;

interface SystemFormProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onSuccess: () => void;
  system?: System | null;
}

export function SystemForm({
  isOpen,
  onOpenChange,
  onSuccess,
  system,
}: SystemFormProps) {
  const { toast } = useToast();
  const isEditing = !!system;

  const form = useForm<SystemFormValues>({
    resolver: zodResolver(systemFormSchema),
    defaultValues: {
      name: '',
      disk_serial_no: '',
    },
  });

  React.useEffect(() => {
    if (system) {
      form.reset({
        name: system.name,
        disk_serial_no: system.disk_serial_no,
        type: system.type || undefined,
        status: system.status || undefined,
      });
    } else {
      form.reset({
        name: '',
        disk_serial_no: '',
        type: undefined,
        status: undefined,
      });
    }
  }, [system, form, isOpen]);

  const onSubmit = async (data: SystemFormValues) => {
    try {
      if (isEditing && system) {
        await updateSystem(system.disk_serial_no, { name: data.name });
        toast({
          title: 'System Updated',
          description: `System "${data.name}" has been updated successfully.`,
        });
      } else {
        await createSystem(data);
        toast({
          title: 'System Created',
          description: `System "${data.name}" has been created successfully.`,
        });
      }
      onSuccess();
      onOpenChange(false);
    } catch (error) {
      handleApiError(error, toast, `Failed to ${isEditing ? 'update' : 'create'} system`);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Edit System' : 'Add New System'}</DialogTitle>
          <DialogDescription>
            {isEditing
              ? 'Update the details for this system.'
              : 'Fill in the details to register a new system.'}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>System Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. Primary Server" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="disk_serial_no"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Disk Serial Number</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="e.g. S123456789"
                      {...field}
                      disabled={isEditing}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            {!isEditing && (
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Type</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="spare">Spare</SelectItem>
                          <SelectItem value="using">Using</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Status</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select status" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="green">Green</SelectItem>
                          <SelectItem value="orange">Orange</SelectItem>
                          <SelectItem value="red">Red</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            )}
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
                  : 'Create System'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
