
"use client"

import { ColumnDef } from "@tanstack/react-table"
import { User } from "@/types"
import { MoreHorizontal, ArrowUpDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuPortal,
  DropdownMenuSubContent
} from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar"
import { useToast } from "@/hooks/use-toast"
import { updateUserStatus, handleApiError } from "@/lib/api"
import React from "react"

const statusVariantMap: { [key: string]: "default" | "secondary" | "destructive" } = {
  active: "default",
  inactive: "secondary",
  suspended: "destructive",
};

const statusLabelMap: { [key: string]: string } = {
    active: "Active",
    inactive: "Inactive",
    suspended: "Suspended",
};

const ActionsCell = ({ row, onUpdateSuccess, onManagePermissions }: { row: any, onUpdateSuccess: () => void, onManagePermissions: (user: User) => void }) => {
    const user = row.original as User;
    const { toast } = useToast();
  
    const handleStatusUpdate = async (status: string) => {
      try {
        await updateUserStatus(user.id, status);
        toast({
          title: "Status Updated",
          description: `${user.name}'s status changed to ${statusLabelMap[status]}.`,
        });
        onUpdateSuccess();
      } catch (error) {
        handleApiError(error, toast, 'Failed to update status');
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
            onClick={() => navigator.clipboard.writeText(String(user.id))}
          >
            Copy user ID
          </DropdownMenuItem>
          <DropdownMenuSeparator />
           <DropdownMenuSub>
            <DropdownMenuSubTrigger>Update status</DropdownMenuSubTrigger>
            <DropdownMenuPortal>
              <DropdownMenuSubContent>
                <DropdownMenuItem onClick={() => handleStatusUpdate('active')}>
                  Active
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleStatusUpdate('inactive')}>
                  Inactive
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleStatusUpdate('suspended')}>
                  Suspended
                </DropdownMenuItem>
              </DropdownMenuSubContent>
            </DropdownMenuPortal>
          </DropdownMenuSub>
          <DropdownMenuItem onClick={() => onManagePermissions(user)}>Manage Permissions</DropdownMenuItem>
          <DropdownMenuItem className="text-destructive">Delete user</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  };

export const generateColumns = ({ onUpdateSuccess, onManagePermissions }: { onUpdateSuccess: () => void; onManagePermissions: (user: User) => void; }): ColumnDef<User>[] => [
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
    header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Name
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        )
      },
    cell: ({ row }) => {
      const user = row.original;
      return (
        <div className="flex items-center gap-2">
          <Avatar className="h-8 w-8">
            <AvatarImage src={user.image_url} alt={user.name} />
            <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
          </Avatar>
          <span className="font-medium">{user.name}</span>
        </div>
      )
    }
  },
  {
    accessorKey: "email",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Email
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
  },
  {
    accessorKey: "permissions",
    header: "Permissions",
    cell: ({ row }) => {
      const permissions = row.original.permissions;
      if (!permissions || permissions.length === 0) {
        return <span className="text-muted-foreground">No permissions</span>;
      }
      return (
        <div className="flex flex-wrap gap-1">
          {permissions.map((permission, index) => (
            <Badge key={`${permission}-${index}`} variant="secondary" className="font-normal">
              {permission}
            </Badge>
          ))}
        </div>
      );
    },
    enableSorting: false,
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const status = row.getValue("status") as string;
      return <Badge variant={statusVariantMap[status] || "default"} className="capitalize">{status}</Badge>
    },
    enableSorting: false,
  },
    {
    accessorKey: "created_at",
    header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Created At
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        )
      },
      cell: ({ row }) => {
        const date = new Date(row.getValue("created_at"))
        return date.toLocaleDateString()
      }
  },
  {
    id: "actions",
    cell: ({ row }) => <ActionsCell row={row} onUpdateSuccess={onUpdateSuccess} onManagePermissions={onManagePermissions} />,
  },
]
