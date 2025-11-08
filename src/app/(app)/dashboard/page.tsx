
'use client';
import { StatsCards } from '@/components/dashboard/stats-cards';
import { ActivityChart } from '@/components/dashboard/activity-chart';
import { RecentActivity } from '@/components/dashboard/recent-activity';
import { useAuthProtection } from '@/hooks/use-auth-protection';

export default function DashboardPage() {
    const { loading, isAuthorized, UnauthorizedComponent } = useAuthProtection(['System Admin', 'Operator Admin', 'Contractor Admin', 'Manager', 'Security', 'Worker', 'Visitor', 'Supervisor']);
    
    if (loading) {
        return <div>Loading...</div>;
    }
    
    if (!isAuthorized) {
        return <UnauthorizedComponent />;
    }

  return (
    <div className="space-y-4 md:space-y-6">
      <header>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">Live overview of gate activity and security status.</p>
      </header>

      <StatsCards />

      <div className="grid grid-cols-1 gap-4 md:gap-6 lg:grid-cols-5">
        <div className="lg:col-span-5">
          <ActivityChart />
        </div>
      </div>
      
      <RecentActivity />
    </div>
  );
}
