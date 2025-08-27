"use client"

import { ColumnDef } from "@tanstack/react-table"
import { Block } from "@/types"
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
import React from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { deleteBlock, handleApiError } from "@/lib/api";
import { Label } from "../ui/label"

const ActionsCell = ({ row, onEdit, onDeleteSuccess }: { row: any, onEdit: (block: Block) => void, onDeleteSuccess: () => void }) => {
    const block = row.original as Block;
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = React.useState(false);
    const [isDeleteAuthorized, setIsDeleteAuthorized] = React.useState(false);
    const { toast } = useToast();
  
    const handleDelete = async () => {
      try {
        await deleteBlock(String(block.id));
        toast({
          title: "Block Deleted",
          description: `Block "${block.name}" has been deleted successfully.`,
        });
        onDeleteSuccess();
      } catch (error) {
        handleApiError(error, toast, 'Failed to delete block');
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
                block "{block.name}" and all associated rooms.
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
              onClick={() => navigator.clipboard.writeText(String(block.id))}
            >
              Copy block ID
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => onEdit(block)}>Edit block</DropdownMenuItem>
            <DropdownMenuItem
              className="text-destructive"
              onClick={() => setIsDeleteDialogOpen(true)}
            >
              Delete block
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </>
    );
  };
  

export const generateColumns = ({ onEdit, onDeleteSuccess }: { onEdit: (block: Block) => void; onDeleteSuccess: () => void; }): ColumnDef<Block>[] => [
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
            Block Name
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
    id: "actions",
    cell: ({ row }) => <ActionsCell row={row} onEdit={onEdit} onDeleteSuccess={onDeleteSuccess} />,
  },
]
