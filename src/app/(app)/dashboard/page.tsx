
'use client';
import { StatsCards } from '@/components/dashboard/stats-cards';
import { ContractorAccessChart } from '@/components/dashboard/contractor-access-chart';
import { useAuthProtection } from '@/hooks/use-auth-protection';

export default function DashboardPage() {
    const { firestoreUser, loading, isAuthorized, UnauthorizedComponent } = useAuthProtection(['Admin', 'Operator Admin', 'Manager', 'Security', 'Supervisor']);
    
    if (loading) {
        return <div>Loading...</div>;
    }
    
    if (!isAuthorized) {
        return <UnauthorizedComponent />;
    }

  const showDashboard = firestoreUser && ['Admin', 'Operator Admin', 'Manager', 'Security', 'Supervisor'].includes(firestoreUser.role);

  if (!showDashboard) {
      return (
         <div className="space-y-4 md:space-y-6">
            <header>
                <h1 className="text-3xl font-bold tracking-tight">Welcome</h1>
                <p className="text-muted-foreground">Your role does not have a dashboard view.</p>
            </header>
         </div>
      );
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
          <ContractorAccessChart />
        </div>
      </div>
    </div>
  );
}
