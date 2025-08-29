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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { createFault, getFaultTypes, handleApiError } from '@/lib/api';
import type { FaultType } from '@/types';

const faultFormSchema = z.object({
  fault_name: z.string().min(1, 'Please select a fault type.'),
  system_disk_serial_no: z
    .string()
    .min(1, 'System disk serial number is required.'),
  description: z.string().optional(),
});

type FaultFormValues = z.infer<typeof faultFormSchema>;

interface FaultFormProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onSuccess: () => void;
}

export function FaultForm({
  isOpen,
  onOpenChange,
  onSuccess,
}: FaultFormProps) {
  const { toast } = useToast();
  const [faultTypes, setFaultTypes] = React.useState<FaultType[]>([]);

  const form = useForm<FaultFormValues>({
    resolver: zodResolver(faultFormSchema),
    defaultValues: {
      fault_name: '',
      system_disk_serial_no: '',
      description: '',
    },
  });

  React.useEffect(() => {
    const fetchFaultTypes = async () => {
      try {
        const types = await getFaultTypes();
        setFaultTypes(types);
      } catch (error) {
        handleApiError(error, toast, 'Failed to load fault types');
      }
    };
    if (isOpen) {
      fetchFaultTypes();
    }
  }, [isOpen, toast]);

  React.useEffect(() => {
    if (!isOpen) {
      form.reset();
    }
  }, [isOpen, form]);

  const onSubmit = async (data: FaultFormValues) => {
    try {
      await createFault(data);
      toast({
        title: 'Fault Reported',
        description: 'Your fault report has been submitted successfully.',
      });
      onSuccess();
    } catch (error) {
      handleApiError(error, toast, 'Failed to report fault');
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Report a New Fault</DialogTitle>
          <DialogDescription>
            Provide details about the issue you are experiencing.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="fault_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Fault Type</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a fault type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {faultTypes.map((type) => (
                        <SelectItem key={type.name} value={type.name}>
                          {type.description}
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
              name="system_disk_serial_no"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>System Disk Serial Number</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="e.g. S123456789"
                      {...field}
                    />
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
                  <FormLabel>Additional Description (Optional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Provide any extra details about the fault"
                      rows={4}
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
                  ? 'Submitting...'
                  : 'Submit Report'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
