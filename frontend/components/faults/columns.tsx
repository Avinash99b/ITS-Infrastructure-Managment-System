
'use client';

import { ColumnDef } from '@tanstack/react-table';
import { Fault, User } from '@/types';
import { MoreHorizontal, ArrowUpDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuPortal,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import React, { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { assignTechnician, updateFaultStatus, handleApiError } from '@/lib/api';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';

const statusVariantMap: {
  [key: string]: 'default' | 'secondary' | 'destructive';
} = {
  pending: 'destructive',
  in_progress: 'secondary',
  resolved: 'default',
};

const statusLabelMap: { [key: string]: string } = {
  pending: 'Pending',
  in_progress: 'Progress',
  resolved: 'Resolved',
};

const UserDisplay = ({
  name,
  imageUrl,
  fallback,
}: {
  name: string;
  imageUrl: string | null;
  fallback: string;
}) => {
  return (
    <div className="flex items-center gap-2">
      <Avatar className="h-6 w-6">
        <AvatarImage src={imageUrl ?? undefined} alt={name} />
        <AvatarFallback>{fallback}</AvatarFallback>
      </Avatar>
      <span>{name}</span>
    </div>
  );
};

const ActionsCell = ({
  row,
  technicians,
  onUpdateSuccess,
}: {
  row: any;
  technicians: User[];
  onUpdateSuccess: () => void;
}) => {
  const fault = row.original as Fault;
  const { toast } = useToast();

  const handleStatusUpdate = async (status: string) => {
    try {
      await updateFaultStatus(fault.id, status);
      toast({
        title: 'Status Updated',
        description: `Fault status changed to ${statusLabelMap[status]}.`,
      });
      onUpdateSuccess();
    } catch (error) {
      handleApiError(error, toast, 'Failed to update status');
    }
  };

  const handleAssignTechnician = async (technicianId: number) => {
    try {
      await assignTechnician(String(fault.id), technicianId);
      toast({
        title: 'Technician Assigned',
        description: `Technician has been assigned to the fault.`,
      });
      onUpdateSuccess();
    } catch (error) {
      handleApiError(error, toast, 'Failed to assign technician');
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="h-8 w-8 p-0">
          <span className="sr-only">Open menu</span>
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>Actions</DropdownMenuLabel>
        <DropdownMenuItem
          onClick={() => {
            navigator.clipboard.writeText(String(fault.id));
            toast({
              title: 'Copied!',
              description: 'Fault ID copied to clipboard.',
            });
          }}
        >
          Copy fault ID
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuSub>
          <DropdownMenuSubTrigger>Update status</DropdownMenuSubTrigger>
          <DropdownMenuPortal>
            <DropdownMenuSubContent>
              <DropdownMenuItem onClick={() => handleStatusUpdate('pending')}>
                Pending
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleStatusUpdate('in_progress')}>
                In Progress
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleStatusUpdate('resolved')}>
                Resolved
              </DropdownMenuItem>
            </DropdownMenuSubContent>
          </DropdownMenuPortal>
        </DropdownMenuSub>
        <DropdownMenuSub>
          <DropdownMenuSubTrigger>Assign Technician</DropdownMenuSubTrigger>
          <DropdownMenuPortal>
            <DropdownMenuSubContent>
              {technicians.length > 0 ? (
                technicians.map((tech) => (
                  <DropdownMenuItem
                    key={tech.id}
                    onClick={() => handleAssignTechnician(tech.id)}
                  >
                    {tech.name}
                  </DropdownMenuItem>
                ))
              ) : (
                <DropdownMenuItem disabled>No technicians found</DropdownMenuItem>
              )}
            </DropdownMenuSubContent>
          </DropdownMenuPortal>
        </DropdownMenuSub>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export const generateColumns = ({
  technicians,
  onUpdateSuccess,
}: {
  technicians: User[];
  onUpdateSuccess: () => void;
}): ColumnDef<Fault>[] => [
  {
    id: 'select',
    header: ({ table }) => (
      <Checkbox
        checked={
          table.getIsAllPageRowsSelected() ||
          (table.getIsSomePageRowsSelected() && 'indeterminate')
        }
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label="Select all"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label="Select row"
      />
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: 'fault_name',
    header: 'Fault Type',
  },
  {
    accessorKey: 'description',
    header: 'Description',
    cell: ({ row }) => (
      <div className="max-w-[300px] truncate">
        {row.getValue('description')}
      </div>
    ),
  },
  {
    accessorKey: 'reporter_name',
    header: 'Reported By',
    cell: ({ row }) => (
      <UserDisplay
        name={row.original.reporter_name}
        imageUrl={row.original.reporter_image_url}
        fallback={row.original.reporter_name.charAt(0)}
      />
    ),
  },
  {
    accessorKey: 'technician_name',
    header: 'Assigned To',
    cell: ({ row }) =>
      row.original.technician_name ? (
        <UserDisplay
          name={row.original.technician_name}
          imageUrl={row.original.technician_image_url || null}
          fallback={row.original.technician_name.charAt(0)}
        />
      ) : (
        <span className="text-muted-foreground">Unassigned</span>
      ),
  },
  {
    accessorKey: 'created_at',
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        >
          Date
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => new Date(row.original.created_at).toLocaleDateString(),
  },
  {
    accessorKey: 'status',
    header: 'Status',
    cell: ({ row }) => {
      const status = row.getValue('status') as string;
      return (
        <Badge variant={statusVariantMap[status] || 'default'}>
          {statusLabelMap[status] || status}
        </Badge>
      );
    },
  },
  {
    id: 'actions',
    cell: ({ row }) => (
      <ActionsCell
        row={row}
        technicians={technicians}
        onUpdateSuccess={onUpdateSuccess}
      />
    ),
  },
];
