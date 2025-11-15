
'use client';
import { useState, useEffect } from 'react';
import { useFirestore } from '@/firebase';
import { collection, onSnapshot, query, where, getDocs } from 'firebase/firestore';
import { StatsCards } from '@/components/dashboard/stats-cards';
import { ContractorAccessChart } from '@/components/dashboard/contractor-access-chart';
import { useAuthProtection } from '@/hooks/use-auth-protection';
import type { Site, GateActivity, User } from '@/lib/types';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { RecentActivityTable } from '@/components/dashboard/recent-activity-table';

export default function DashboardPage() {
    const { firestoreUser, loading, isAuthorized, UnauthorizedComponent } = useAuthProtection(['Admin', 'Operator Admin', 'Manager', 'Security', 'Supervisor']);
    const firestore = useFirestore();
    const [sites, setSites] = useState<Site[]>([]);
    const [users, setUsers] = useState<User[]>([]);
    const [gateActivity, setGateActivity] = useState<GateActivity[]>([]);
    const [loadingData, setLoadingData] = useState(true);
    const [selectedSiteId, setSelectedSiteId] = useState<string>('all');

    const canViewFullDashboard = firestoreUser && ['Admin', 'Operator Admin', 'Manager'].includes(firestoreUser.role);
    const canFilterBySite = firestoreUser && ['Admin', 'Operator Admin'].includes(firestoreUser.role);

     useEffect(() => {
        if (!firestore || !firestoreUser) {
            setLoadingData(false);
            return;
        }
        setLoadingData(true);
        const unsubs: (()=>void)[] = [];

        // Fetch sites for the filter dropdown
        if (canFilterBySite) {
            unsubs.push(onSnapshot(collection(firestore, "sites"), (snapshot) => {
                const sitesData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Site));
                setSites(sitesData);
            }));
        }
        
        // Fetch all users to map names to activity
        unsubs.push(onSnapshot(collection(firestore, 'users'), (snap) => {
            setUsers(snap.docs.map(doc => ({...doc.data(), id: doc.id} as User)));
        }));


        const setupActivityListener = async () => {
            let activityQuery;
            if (selectedSiteId !== 'all') {
                activityQuery = query(collection(firestore, "gateActivity"), where('siteId', '==', selectedSiteId));
            } else if (firestoreUser.role === 'Manager') {
                // If manager selects "all", fetch for their managed sites
                const sitesQuery = query(collection(firestore, 'sites'), where('managerIds', 'array-contains', firestoreUser.id));
                const sitesSnapshot = await getDocs(sitesQuery);
                const managedSiteIds = sitesSnapshot.docs.map(doc => doc.id);
                if (managedSiteIds.length > 0) {
                    activityQuery = query(collection(firestore, 'gateActivity'), where('siteId', 'in', managedSiteIds));
                } else {
                    setGateActivity([]); // No sites, no activity
                    return;
                }
            } else {
                 activityQuery = collection(firestore, "gateActivity");
            }
            
             unsubs.push(onSnapshot(activityQuery, (snapshot) => {
                const activityData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as GateActivity));
                setGateActivity(activityData);
                setLoadingData(false);
             }));
        };

        setupActivityListener();

        return () => unsubs.forEach(unsub => unsub());
    }, [firestore, firestoreUser, canFilterBySite, selectedSiteId]);
    
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
            loadingData ? (
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
                <div className="lg:col-span-3">
                    <RecentActivityTable activity={gateActivity} users={users} isLoading={loadingData} />
                </div>
                 <div className="lg:col-span-2">
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
