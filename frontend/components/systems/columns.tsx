"use client"

import { ColumnDef } from "@tanstack/react-table"
import { System } from "@/types"
import { MoreHorizontal, ArrowUpDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Checkbox } from "../ui/checkbox"
import { Badge } from "../ui/badge"
import React from "react"
import { format } from "date-fns"
import { useToast } from "@/hooks/use-toast"

const statusVariantMap: {
  [key: string]: "default" | "secondary" | "destructive" | "outline";
} = {
  green: "default",
  orange: "secondary",
  red: "destructive",
};

const ActionsCell = ({ row, onEdit, onSuccess }: { row: any, onEdit: (system: System) => void, onSuccess: () => void }) => {
    const system = row.original as System;
    const { toast } = useToast();

    return (
      <>
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
                navigator.clipboard.writeText(String(system.disk_serial_no));
                toast({
                  title: 'Copied!',
                  description: 'Serial number copied to clipboard.',
                });
              }}
            >
              Copy Serial Number
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => onEdit(system)}>Edit System</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </>
    );
  };
  

export const generateColumns = ({ onEdit, onSuccess }: { onEdit: (system: System) => void; onSuccess: () => void; }): ColumnDef<System>[] => [
  {
    id: "select",
    header: ({ table }) => (
      <Checkbox
        checked={
          table.getIsAllPageRowsSelected() ||
          (table.getIsSomePageRowsSelected() && "indeterminate")
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
    accessorKey: "name",
    header: "Name",
  },
  {
    accessorKey: "disk_serial_no",
    header: "Disk Serial No",
  },
  {
    accessorKey: "room_id",
    header: "Room ID",
    cell: ({ row }) => row.original.room_id || "N/A",
  },
   {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
        const status = row.getValue("status") as string;
        if (!status) return 'N/A';
        return <Badge variant={statusVariantMap[status] || "default"} className="capitalize">{status}</Badge>
    },
  },
  {
    accessorKey: "type",
    header: "Type",
     cell: ({ row }) => {
        const type = row.getValue("type") as string;
        if (!type) return 'N/A';
        return <Badge variant="outline" className="capitalize">{type}</Badge>
    },
  },
  {
    accessorKey: "upload_speed_mbps",
    header: "Upload (Mbps)",
    cell: ({ row }) => row.original.upload_speed_mbps?.toFixed(2) || "N/A",
  },
  {
    accessorKey: "download_speed_mbps",
    header: "Download (Mbps)",
    cell: ({ row }) => row.original.download_speed_mbps?.toFixed(2) || "N/A",
  },
  {
    accessorKey: "ping_ms",
    header: "Ping (ms)",
    cell: ({ row }) => row.original.ping_ms?.toFixed(2) || "N/A",
  },
  {
    accessorKey: "last_reported_at",
    header: "Last Reported",
    cell: ({ row }) => {
      const date = row.original.last_reported_at;
      if (!date) return "N/A";
      return format(new Date(date), "PPpp");
    }
  },
  {
    id: "actions",
    cell: ({ row }) => <ActionsCell row={row} onEdit={onEdit} onSuccess={onSuccess} />,
  },
]
