
'use client';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Users, Building, AlertTriangle, Cpu, HardDrive, DoorOpen } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { getRooms, getUsers, getFaults, getSystems, handleApiError } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { Button } from '../ui/button';
import Link from 'next/link';
import { Skeleton } from '../ui/skeleton';

const StatCard = ({ title, value, icon: Icon, change }: { title: string, value: string, icon: React.ElementType, change: string }) => (
    <div className="flex items-center gap-4 py-2">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Icon className="h-6 w-6" />
        </div>
        <div className="grid gap-1">
            <p className="text-sm text-muted-foreground">{title}</p>
            <div className="flex items-baseline gap-2">
                <h3 className="text-xl font-bold tracking-tight">{value}</h3>
                {change && <p className="text-xs text-muted-foreground">{change}</p>}
            </div>
        </div>
    </div>
);


export default function StatsCards() {
  const { toast } = useToast();
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalRooms: 0,
    totalSystems: 0,
    activeFaults: 0,
  });
  const [loading, setLoading] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [canViewFaults, setCanViewFaults] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    setIsLoggedIn(!!token);
  }, []);

  useEffect(() => {
    if (!isLoggedIn) {
        setLoading(false);
        return;
    };

    const fetchStats = async () => {
        setLoading(true);
        try {
            const [usersData, roomsData, systemsData, faultsData] = await Promise.allSettled([
                getUsers(new URLSearchParams()),
                getRooms(new URLSearchParams()),
                getSystems(new URLSearchParams()),
                getFaults(new URLSearchParams({ status: 'pending' })),
            ]);

            const newStats = {
                totalUsers: usersData.status === 'fulfilled' ? usersData.value.total : 0,
                totalRooms: roomsData.status === 'fulfilled' ? roomsData.value.total : 0,
                totalSystems: systemsData.status === 'fulfilled' ? systemsData.value.total : 0,
                activeFaults: 0,
            };
            
            if (faultsData.status === 'fulfilled') {
                newStats.activeFaults = faultsData.value.total;
                setCanViewFaults(true);
            } else if (faultsData.status === 'rejected' && (faultsData.reason as Error).message.includes('403')) {
                setCanViewFaults(false);
            }

            setStats(newStats);

        } catch (error) {
            // This will catch any errors not handled by Promise.allSettled, though unlikely
            handleApiError(error, toast, 'Failed to fetch dashboard stats');
        } finally {
            setLoading(false);
        }
    };
    
    fetchStats();
  }, [isLoggedIn, toast]);

  const statItems = [
    { title: 'Total Users', value: String(stats.totalUsers), icon: Users, change: ''},
    { title: 'Total Rooms', value: String(stats.totalRooms), icon: DoorOpen, change: ''},
    { title: 'Total Systems', value: String(stats.totalSystems), icon: HardDrive, change: ''},
    ...(canViewFaults ? [{ title: 'Active Faults', value: String(stats.activeFaults), icon: AlertTriangle, change: ''}] : []),
  ];

  if (!isLoggedIn) {
      return (
           <div className="text-center text-muted-foreground p-4">
                <p>Please log in to view dashboard statistics.</p>
                <Button asChild className="mt-4">
                    <Link href="/login">Login</Link>
                </Button>
           </div>
      )
  }

  if (loading) {
    return (
        <div className='space-y-4'>
            {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}
        </div>
    );
  }

  return (
    <div className="space-y-4">
      {statItems.map((item, index) => (
        <StatCard key={index} {...item} />
      ))}
    </div>
  );
}
