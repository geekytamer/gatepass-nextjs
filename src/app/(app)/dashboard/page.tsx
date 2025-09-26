
import { StatsCards } from '@/components/dashboard/stats-cards';
import { ActivityChart } from '@/components/dashboard/activity-chart';
import { RecentActivity } from '@/components/dashboard/recent-activity';

export default function DashboardPage() {
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
