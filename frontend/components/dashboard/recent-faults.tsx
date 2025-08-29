
'use client';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '../ui/badge';
import React, { useEffect, useState } from 'react';
import type { Fault } from '@/types';
import { getFaults, handleApiError } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '../ui/skeleton';
import { Button } from '../ui/button';
import Link from 'next/link';

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

function FaultItem({ fault }: { fault: Fault }) {
  const reporterName = fault.reporter_name || `User ID: ${fault.reported_by}`;
  const reporterAvatar = fault.reporter_image_url
    ? `${fault.reporter_image_url.split('?')[0]}?t=${new Date().getTime()}`
    : `https://i.pravatar.cc/150?u=${fault.reported_by}`;
  const reporterFallback = fault.reporter_name
    ? fault.reporter_name.substring(0, 2).toUpperCase()
    : 'U';

  return (
    <div className="flex items-center gap-4">
      <Avatar className="hidden h-9 w-9 sm:flex">
        <>
          <AvatarImage src={reporterAvatar} alt="Avatar" />
          <AvatarFallback>{reporterFallback}</AvatarFallback>
        </>
      </Avatar>
      <div className="grid gap-1">
        <p className="text-sm font-medium leading-none">{fault.description}</p>
        {fault.reported_by > 0 && (
          <p className="text-sm text-muted-foreground">
            Reported by {reporterName}
          </p>
        )}
      </div>
      <div className="ml-auto font-medium">
        <Badge variant={statusVariantMap[fault.status] || 'default'}>
          {statusLabelMap[fault.status] || fault.status}
        </Badge>
      </div>
    </div>
  );
}

const BlurredCard = ({
  children,
  className,
  isLoggedIn,
  showContactAdmin,
}: {
  children: React.ReactNode;
  className?: string;
  isLoggedIn: boolean;
  showContactAdmin?: boolean;
}) => (
  <div className="relative">
    <div className="blur-sm">{children}</div>
    <div className="absolute inset-0 flex flex-col items-center justify-center gap-4">
      {!isLoggedIn ? (
        <Button asChild>
          <Link href="/login">Login to view details</Link>
        </Button>
      ) : showContactAdmin ? (
        <>
          <p className="text-sm font-medium text-destructive">
            You do not have access to this.
          </p>
          <Button asChild>
            <a href="mailto:bathulaavi@gmail.com?subject=InfraTrack%20Access%20Request">
              Contact Admin
            </a>
          </Button>
        </>
      ) : null}
    </div>
  </div>
);


export default function RecentFaults() {
  const { toast } = useToast();
  const [faults, setFaults] = useState<Fault[]>([]);
  const [loading, setLoading] = useState(true);
  const [canViewFaults, setCanViewFaults] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const loggedIn = !!token;
    setIsLoggedIn(loggedIn);

    const fetchFaults = async () => {
      setLoading(true);
      if (loggedIn) {
        try {
          const { data } = await getFaults(
            new URLSearchParams({ limit: '5', sort: 'created_at', order: 'desc' })
          );
          setFaults(data);
          setCanViewFaults(true);
        } catch (error) {
            if ((error as Error).message.includes('403')) {
                setCanViewFaults(false);
                const mockFaults: Fault[] = Array(5)
                .fill(null)
                .map((_, i) => ({
                    id: i,
                    description: 'You do not have permission to view faults',
                    reported_by: 0,
                    created_at: new Date().toISOString(),
                    status: 'pending',
                    reporter_name: 'System',
                    reporter_image_url: null,
                    system_disk_serial_no: '',
                    fault_name: 'permission_denied',
                }));
                setFaults(mockFaults);
            } else {
                handleApiError(error, toast, 'Failed to fetch recent faults');
            }
        }
      } else {
        const mockFaults: Fault[] = Array(5)
          .fill(null)
          .map((_, i) => ({
            id: i,
            description: 'Log in to see fault details',
            reported_by: 0,
            created_at: new Date().toISOString(),
            status: 'pending',
            reporter_name: 'System',
            reporter_image_url: null,
            system_disk_serial_no: '',
            fault_name: 'logged_out',
          }));
        setFaults(mockFaults);
      }
      setLoading(false);
    };
    fetchFaults();
  }, [toast]);

  if (loading) {
    return (
      <div className="space-y-6">
        {Array.from({ length: 5 }).map((_, index) => (
          <div className="flex items-center gap-4" key={index}>
            <Skeleton className="h-9 w-9 rounded-full" />
            <div className="grid gap-1 w-full">
              <Skeleton className="h-5 w-4/5" />
              <Skeleton className="h-4 w-2/5" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  const faultList = (
    <div className="space-y-6">
      {faults.map((fault, index) => (
        <FaultItem key={fault.id || index} fault={fault} />
      ))}
    </div>
  );

  if (!isLoggedIn || !canViewFaults) {
    return (
      <BlurredCard isLoggedIn={isLoggedIn} showContactAdmin={isLoggedIn && !canViewFaults}>
        {faultList}
      </BlurredCard>
    );
  }

  return faultList;
}
