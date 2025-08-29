"use client"

import { ColumnDef } from "@tanstack/react-table"
import { Room } from "@/types"
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
import { Checkbox } from "@/components/ui/checkbox"
import { useRouter } from "next/navigation"
import React from "react"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { useToast } from "@/hooks/use-toast"
import { deleteRoom, handleApiError } from "@/lib/api"
import { Label } from "../ui/label"


const ActionsCell = ({ row, onEdit, onDeleteSuccess }: { row: any, onEdit: (room: Room) => void, onDeleteSuccess: () => void }) => {
  const room = row.original as Room
  const router = useRouter()
  const { toast } = useToast()
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = React.useState(false)
  const [isDeleteAuthorized, setIsDeleteAuthorized] = React.useState(false);

  const handleViewBlock = () => {
    router.push(`/blocks?highlight=${room.block_id}`);
  };

  const handleViewIncharge = () => {
    if (room.incharge_id) {
      router.push(`/users?highlight=${room.incharge_id}`);
    }
  };

  const handleDelete = async () => {
    try {
      await deleteRoom(room.id);
      toast({
        title: "Room Deleted",
        description: `Room "${room.name}" has been deleted successfully.`,
      });
      onDeleteSuccess();
    } catch (error) {
      handleApiError(error, toast, 'Failed to delete room');
    } finally {
      setIsDeleteDialogOpen(false);
      setIsDeleteAuthorized(false);
    }
  };

  return (
    <>
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the
              room "{room.name}".
            </AlertDialogDescription>
          </AlertDialogHeader>
           <div className="flex items-center space-x-2 my-4">
              <Checkbox id="authorize-delete" checked={isDeleteAuthorized} onCheckedChange={(checked) => setIsDeleteAuthorized(checked as boolean)} />
              <Label htmlFor="authorize-delete" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                  I authorize this action and understand its consequences.
              </Label>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setIsDeleteAuthorized(false)}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={!isDeleteAuthorized}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

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
              navigator.clipboard.writeText(String(room.id));
              toast({
                title: 'Copied!',
                description: 'Room ID copied to clipboard.',
              });
            }}
          >
            Copy room ID
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handleViewBlock}>View block</DropdownMenuItem>
          {room.incharge_id && (
            <DropdownMenuItem onClick={handleViewIncharge}>View incharge</DropdownMenuItem>
          )}
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => onEdit(room)}>Edit room</DropdownMenuItem>
          <DropdownMenuItem className="text-destructive" onClick={() => setIsDeleteDialogOpen(true)}>
            Delete room
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  )
}

export const generateColumns = ({ onEdit, onDeleteSuccess }: { onEdit: (room: Room) => void; onDeleteSuccess: () => void; }): ColumnDef<Room>[] => [
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
            Room Name
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        )
      },
  },
  {
    accessorKey: "description",
    header: "Description",
  },
  {
    accessorKey: "block_id",
    header: "Block ID",
  },
  {
    accessorKey: "floor",
    header: "Floor",
  },
  {
    accessorKey: "incharge_id",
    header: "In-charge ID",
    cell: ({ row }) => {
      const inchargeId = row.original.incharge_id;
      return inchargeId ?? "N/A";
    }
  },
  {
    id: "actions",
    cell: ({ row }) => <ActionsCell row={row} onEdit={onEdit} onDeleteSuccess={onDeleteSuccess} />,
  },
]
