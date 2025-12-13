
'use client';
import { useState, useEffect, useMemo } from 'react';
import { useFirestore } from '@/firebase';
import { collection, onSnapshot, query, where, getDocs } from 'firebase/firestore';
import { StatsCards } from '@/components/dashboard/stats-cards';
import { ContractorAccessChart } from '@/components/dashboard/contractor-access-chart';
import { useAuthProtection } from '@/hooks/use-auth-protection';
import type { Site, GateActivity, User, Operator, Contractor } from '@/lib/types';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { RecentActivityTable } from '@/components/dashboard/recent-activity-table';

export default function DashboardPage() {
    const { firestoreUser, loading, isAuthorized, UnauthorizedComponent } = useAuthProtection(['Admin', 'Operator Admin', 'Manager', 'Security', 'Supervisor']);
    const firestore = useFirestore();
    const [sites, setSites] = useState<Site[]>([]);
    const [operators, setOperators] = useState<Operator[]>([]);
    const [contractors, setContractors] = useState<Contractor[]>([]);
    const [users, setUsers] = useState<User[]>([]);
    const [gateActivity, setGateActivity] = useState<GateActivity[]>([]);
    const [loadingData, setLoadingData] = useState(true);
    const [selectedSiteId, setSelectedSiteId] = useState<string>('all');
    const [selectedCompanyId, setSelectedCompanyId] = useState<string>('all');

    const canViewFullDashboard = firestoreUser && ['Admin', 'Operator Admin', 'Manager'].includes(firestoreUser.role);
    const isAdmin = firestoreUser?.role === 'Admin';


    const combinedCompanies = useMemo(() => {
        const allCompanies = [
            ...operators.map(o => ({ id: o.id, name: o.name, type: 'operator' })),
            ...contractors.map(c => ({ id: c.id, name: c.name, type: 'contractor' }))
        ];
        return allCompanies.sort((a,b) => a.name.localeCompare(b.name));
    }, [operators, contractors]);

    const filteredSites = useMemo(() => {
        if (selectedCompanyId === 'all') return sites;
        const selectedCompany = combinedCompanies.find(c => c.id === selectedCompanyId);
        if (selectedCompany?.type === 'operator') {
            return sites.filter(s => s.operatorId === selectedCompanyId);
        }
        return []; // Contractors don't own sites, so no sites to show.
    }, [sites, selectedCompanyId, combinedCompanies]);


     useEffect(() => {
        if (!firestore || !firestoreUser) {
            setLoadingData(false);
            return;
        }
        setLoadingData(true);
        const unsubs: (()=>void)[] = [];

        // Fetch all base data needed for filtering
        if (isAdmin) {
             unsubs.push(onSnapshot(collection(firestore, "operators"), snap => setOperators(snap.docs.map(d => ({id: d.id, ...d.data()} as Operator)))));
             unsubs.push(onSnapshot(collection(firestore, "contractors"), snap => setContractors(snap.docs.map(d => ({id: d.id, ...d.data()} as Contractor)))));
        }

        let sitesQuery;
        if (firestoreUser.role === 'Operator Admin') {
            sitesQuery = query(collection(firestore, "sites"), where('operatorId', '==', firestoreUser.operatorId));
        } else { // Admin or other roles
            sitesQuery = collection(firestore, "sites");
        }
        unsubs.push(onSnapshot(sitesQuery, (snapshot) => {
            const sitesData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Site));
            setSites(sitesData);
        }));
        
        // Fetch all users to map names to activity
        unsubs.push(onSnapshot(collection(firestore, 'users'), (snap) => {
            setUsers(snap.docs.map(doc => ({...doc.data(), id: doc.id} as User)));
        }));


        const setupActivityListener = async () => {
            let activityQuery;
            
            const selectedCompany = combinedCompanies.find(c => c.id === selectedCompanyId);

            if (selectedSiteId !== 'all') {
                activityQuery = query(collection(firestore, "gateActivity"), where('siteId', '==', selectedSiteId));
            } else if (isAdmin && selectedCompany) {
                if (selectedCompany.type === 'operator') {
                     const operatorSiteIds = sites.filter(s => s.operatorId === selectedCompany.id).map(s => s.id);
                     if(operatorSiteIds.length > 0) {
                         activityQuery = query(collection(firestore, 'gateActivity'), where('siteId', 'in', operatorSiteIds));
                     }
                } else { // contractor
                    const contractorUserIds = users.filter(u => u.contractorId === selectedCompany.id).map(u => u.id);
                    if(contractorUserIds.length > 0) {
                        activityQuery = query(collection(firestore, 'gateActivity'), where('userId', 'in', contractorUserIds));
                    }
                }
            } else {
                let siteIdsToFilter: string[] = [];
                if (firestoreUser.role === 'Manager') {
                    const sitesQuery = query(collection(firestore, 'sites'), where('managerIds', 'array-contains', firestoreUser.id));
                    const sitesSnapshot = await getDocs(sitesQuery);
                    siteIdsToFilter = sitesSnapshot.docs.map(doc => doc.id);
                } else if (firestoreUser.role === 'Operator Admin') {
                    const sitesQuery = query(collection(firestore, 'sites'), where('operatorId', '==', firestoreUser.operatorId));
                    const sitesSnapshot = await getDocs(sitesQuery);
                    siteIdsToFilter = sitesSnapshot.docs.map(doc => doc.id);
                }

                if (siteIdsToFilter.length > 0) {
                    activityQuery = query(collection(firestore, 'gateActivity'), where('siteId', 'in', siteIdsToFilter));
                } else if (firestoreUser.role === 'Admin') {
                    activityQuery = collection(firestore, "gateActivity");
                }
            }
            
            if (activityQuery) {
                unsubs.push(onSnapshot(activityQuery, (snapshot) => {
                    const activityData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as GateActivity));
                    setGateActivity(activityData);
                    setLoadingData(false);
                }));
            } else {
                setGateActivity([]);
                setLoadingData(false);
            }
        };

        setupActivityListener();

        return () => unsubs.forEach(unsub => unsub());
    }, [firestore, firestoreUser, selectedSiteId, selectedCompanyId, users, sites]); // Rerun when filters change
    
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
        <div className="flex flex-col sm:flex-row gap-2">
            {isAdmin && (
                 loadingData ? (
                    <Skeleton className="h-10 w-full md:w-[200px]" />
                ) : (
                    <Select value={selectedCompanyId} onValueChange={setSelectedCompanyId}>
                        <SelectTrigger className="w-full md:w-[200px]">
                            <SelectValue placeholder="Select a company" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Companies</SelectItem>
                            {combinedCompanies.map(company => (
                                <SelectItem key={company.id} value={company.id}>{company.name}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                )
            )}
            {canViewFullDashboard && (
                loadingData ? (
                    <Skeleton className="h-10 w-full md:w-[200px]" />
                ) : (
                    <Select value={selectedSiteId} onValueChange={setSelectedSiteId}>
                        <SelectTrigger className="w-full md:w-[200px]">
                            <SelectValue placeholder="Select a site" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Sites</SelectItem>
                            {filteredSites.map(site => (
                                <SelectItem key={site.id} value={site.id}>{site.name}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                )
            )}
        </div>
      </header>

      {canViewFullDashboard && (
        <>
            <StatsCards siteId={selectedSiteId} companyId={selectedCompanyId} />

            <div className="grid grid-cols-1 gap-4 md:gap-6 lg:grid-cols-5">
                <div className="lg:col-span-3">
                    <RecentActivityTable activity={gateActivity} users={users} sites={sites} isLoading={loadingData} />
                </div>
                 <div className="lg:col-span-2">
                    <ContractorAccessChart siteId={selectedSiteId} companyId={selectedCompanyId}/>
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
