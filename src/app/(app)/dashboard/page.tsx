
'use client';
import { useState, useEffect } from 'react';
import { useFirestore } from '@/firebase';
import { collection, onSnapshot } from 'firebase/firestore';
import { StatsCards } from '@/components/dashboard/stats-cards';
import { ContractorAccessChart } from '@/components/dashboard/contractor-access-chart';
import { useAuthProtection } from '@/hooks/use-auth-protection';
import type { Site } from '@/lib/types';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';

export default function DashboardPage() {
    const { firestoreUser, loading, isAuthorized, UnauthorizedComponent } = useAuthProtection(['Admin', 'Operator Admin', 'Manager', 'Security', 'Supervisor']);
    const firestore = useFirestore();
    const [sites, setSites] = useState<Site[]>([]);
    const [loadingSites, setLoadingSites] = useState(true);
    const [selectedSiteId, setSelectedSiteId] = useState<string>('all');

    const canViewFullDashboard = firestoreUser && ['Admin', 'Operator Admin', 'Manager'].includes(firestoreUser.role);
    const canFilterBySite = firestoreUser && ['Admin', 'Operator Admin'].includes(firestoreUser.role);

     useEffect(() => {
        if (!firestore || !canFilterBySite) {
            setLoadingSites(false);
            return;
        }
        setLoadingSites(true);
        const sitesUnsub = onSnapshot(collection(firestore, "sites"), (snapshot) => {
            const sitesData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Site));
            setSites(sitesData);
            setLoadingSites(false);
        });
        return () => sitesUnsub();
    }, [firestore, canFilterBySite]);
    
    if (loading) {
        return <div>Loading...</div>;
    }
    
    if (!isAuthorized) {
        return <UnauthorizedComponent />;
    }

  if (!firestoreUser || !['Admin', 'Operator Admin', 'Manager', 'Security', 'Supervisor'].includes(firestoreUser.role)) {
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
      <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
            <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
            <p className="text-muted-foreground">Live overview of gate activity and security status.</p>
        </div>
        {canFilterBySite && (
            loadingSites ? (
                <Skeleton className="h-10 w-full md:w-[200px]" />
            ) : (
                <Select value={selectedSiteId} onValueChange={setSelectedSiteId}>
                    <SelectTrigger className="w-full md:w-[200px]">
                        <SelectValue placeholder="Select a site" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Sites</SelectItem>
                        {sites.map(site => (
                            <SelectItem key={site.id} value={site.id}>{site.name}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            )
        )}
      </header>

      {canViewFullDashboard && (
        <>
            <StatsCards siteId={selectedSiteId} />

            <div className="grid grid-cols-1 gap-4 md:gap-6 lg:grid-cols-5">
                <div className="lg:col-span-5">
                    <ContractorAccessChart siteId={selectedSiteId} />
                </div>
            </div>
        </>
      )}

       {!canViewFullDashboard && (
          <p className="text-muted-foreground">Dashboard view is not available for your role.</p>
       )}
    </div>
  );
}
