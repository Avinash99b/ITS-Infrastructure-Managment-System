
'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { getMetrics, handleApiError } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '../ui/skeleton';
import { AreaChart, Timer, RefreshCw } from 'lucide-react';
import { Button } from '../ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { cn } from '@/lib/utils';


const StatItem = ({
  icon: Icon,
  label,
  value,
  unit,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  unit: string;
}) => (
  <div className="flex items-center gap-4">
    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
      <Icon className="h-6 w-6" />
    </div>
    <div className="grid gap-1">
      <p className="text-sm text-muted-foreground">{label}</p>
      <div className="flex items-baseline gap-2">
        <h3 className="text-xl font-bold tracking-tight">{value}</h3>
        <p className="text-xs text-muted-foreground">{unit}</p>
      </div>
    </div>
  </div>
);

export default function ApiMetricsStats() {
  const { toast } = useToast();
  const [metrics, setMetrics] = useState<{
    totalRequests: number;
    averageDuration: number;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchMetrics = useCallback(async () => {
    try {
      const data = await getMetrics();
      setMetrics(data);
    } catch (error) {
      handleApiError(error, toast, 'Failed to fetch API metrics');
    }
  }, [toast]);

  useEffect(() => {
    const initialFetch = async () => {
      setLoading(true);
      await fetchMetrics();
      setLoading(false);
    }
    initialFetch();
  }, [fetchMetrics]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchMetrics();
    setRefreshing(false);
  };

  const renderContent = () => {
    if (loading) {
      return (
        <div className="space-y-6">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
        </div>
      );
    }

    if (!metrics) {
      return <p className="text-muted-foreground">Could not load API metrics.</p>;
    }

    return (
      <div className="space-y-6">
        <StatItem
          icon={AreaChart}
          label="Total Requests"
          value={metrics.totalRequests.toString()}
          unit="requests"
        />
        <StatItem
          icon={Timer}
          label="Average Duration"
          value={metrics.averageDuration.toFixed(2)}
          unit="ms"
        />
      </div>
    );
  }

  return (
     <Card>
          <CardHeader className='flex-row items-center justify-between'>
            <div>
                <CardTitle className="font-headline">
                API Metrics
                </CardTitle>
                <CardDescription>
                Overall statistics of API requests from the system.
                </CardDescription>
            </div>
            <Button variant="outline" size="icon" onClick={handleRefresh} disabled={refreshing}>
              <RefreshCw className={cn("h-4 w-4", refreshing && "animate-spin")} />
            </Button>
          </CardHeader>
          <CardContent>
            {renderContent()}
          </CardContent>
        </Card>
  );
}
