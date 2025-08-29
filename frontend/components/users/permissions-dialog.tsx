
'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { getPermissions, updateUserPermissions, handleApiError } from '@/lib/api';
import type { User, Permission } from '@/types';
import { Skeleton } from '../ui/skeleton';

interface PermissionsDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onSuccess: () => void;
  user: User;
}

export function PermissionsDialog({
  isOpen,
  onOpenChange,
  onSuccess,
  user,
}: PermissionsDialogProps) {
  const { toast } = useToast();
  const [permissions, setPermissions] = React.useState<Permission[]>([]);
  const [selectedPermissions, setSelectedPermissions] = React.useState<string[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  React.useEffect(() => {
    async function fetchPermissions() {
      if (isOpen) {
        setLoading(true);
        try {
          const availablePermissions = await getPermissions();
          setPermissions(availablePermissions);
          setSelectedPermissions(user.permissions || []);
        } catch (error) {
          handleApiError(error, toast, 'Failed to fetch permissions');
        } finally {
          setLoading(false);
        }
      }
    }
    fetchPermissions();
  }, [isOpen, user, toast]);

  const handlePermissionChange = (permissionName: string, checked: boolean) => {
    setSelectedPermissions((prev) =>
      checked
        ? [...prev, permissionName]
        : prev.filter((p) => p !== permissionName)
    );
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      await updateUserPermissions(user.id, selectedPermissions);
      toast({
        title: 'Permissions Updated',
        description: `Permissions for ${user.name} have been updated successfully.`,
      });
      onSuccess();
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
        toast({
            variant: 'destructive',
            title: 'Failed to Update Permissions',
            description: errorMessage,
        });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Manage Permissions for {user.name}</DialogTitle>
          <DialogDescription>
            Select the permissions to grant to this user.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto">
          {loading ? (
             Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-8 w-full" />)
          ) : (
            permissions.map((permission) => (
              <div key={permission.name} className="flex items-center space-x-3">
                <Checkbox
                  id={`perm-${permission.name}`}
                  checked={selectedPermissions.includes(permission.name)}
                  onCheckedChange={(checked) =>
                    handlePermissionChange(permission.name, !!checked)
                  }
                />
                <Label
                  htmlFor={`perm-${permission.name}`}
                  className="flex flex-col gap-1 cursor-pointer"
                >
                  <span className='font-medium'>{permission.name.replace(/_/g, ' ')}</span>
                  <span className='text-xs text-muted-foreground'>{permission.description}</span>
                </Label>
              </div>
            ))
          )}
        </div>
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting || loading}>
            {isSubmitting ? 'Saving...' : 'Save Changes'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
