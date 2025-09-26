
import { StatsCards } from '@/components/dashboard/stats-cards';
import { ActivityChart } from '@/components/dashboard/activity-chart';
import { RecentActivity } from '@/components/dashboard/recent-activity';
import { Suspense } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export default function DashboardPage() {
  return (
    <div className="space-y-4 md:space-y-6">
      <header>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">Live overview of gate activity and security status.</p>
      </header>

      <Suspense fallback={<StatsCardsSkeleton />}>
        <StatsCards />
      </Suspense>

      <div className="grid grid-cols-1 gap-4 md:gap-6 lg:grid-cols-5">
        <div className="lg:col-span-5">
          <Suspense fallback={<Card><CardContent className="p-6"><Skeleton className="h-[300px] w-full" /></CardContent></Card>}>
            <ActivityChart />
          </Suspense>
        </div>
      </div>
      
      <Suspense fallback={<Card><CardContent className="p-6"><Skeleton className="h-64 w-full" /></CardContent></Card>}>
        <RecentActivity />
      </Suspense>
    </div>
  );
}

function StatsCardsSkeleton() {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {[...Array(4)].map((_, i) => (
        <Card key={i}>
          <CardContent className="p-6">
            <Skeleton className="h-6 w-1/2 mb-2" />
            <Skeleton className="h-8 w-1/4" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
