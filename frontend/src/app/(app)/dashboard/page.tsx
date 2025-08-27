
'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import StatsCards from '@/components/dashboard/stats-cards';
import ApiMetricsStats from '@/components/dashboard/api-metrics-stats';
import RecentFaults from '@/components/dashboard/recent-faults';
import PageHeader from '@/components/page-header';
import React, { useEffect, useState } from 'react';

export default function DashboardPage() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    setIsLoggedIn(!!token);
    setLoading(false);
  }, []);

  if (loading) {
    return null; // Or a loading spinner
  }

  return (
    <div className="flex flex-1 flex-col gap-4 md:gap-8">
      <PageHeader
        title="Dashboard"
        description="Overview of your infrastructure"
      />
      <div className="grid flex-1 items-start gap-4 sm:px-6 md:gap-8 grid-cols-1 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="font-headline">System Overview</CardTitle>
            <CardDescription>
              High-level statistics about your infrastructure.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <StatsCards />
          </CardContent>
        </Card>
        
        <ApiMetricsStats />

        <Card>
          <CardHeader>
            <CardTitle className="font-headline">Recent Faults</CardTitle>
            <CardDescription>
              A list of the most recently reported faults.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <RecentFaults />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
