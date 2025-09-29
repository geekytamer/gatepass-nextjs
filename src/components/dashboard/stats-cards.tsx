
'use client';
import { useState, useEffect } from 'react';
import { useFirestore } from '@/firebase';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Users, Hourglass, LogIn, Building } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import type { User, AccessRequest, GateActivity, Site } from '@/lib/types';
import { useAuthProtection } from '@/hooks/use-auth-protection';


export function StatsCards() {
    const { firestoreUser, loading: authLoading } = useAuthProtection(['Admin', 'Manager', 'Security', 'Worker']);
    const firestore = useFirestore();
    const [stats, setStats] = useState({
        totalUsers: 0,
        pendingRequests: 0,
        checkedIn: 0,
        totalVisitors: 0,
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!firestore || !firestoreUser) return;
        setLoading(true);

        const unsubs: (() => void)[] = [];
        const role = firestoreUser.role;
        const userId = firestoreUser.id;

        if (role === 'Admin') {
            const usersUnsub = onSnapshot(collection(firestore, 'users'), (snapshot) => {
                const users = snapshot.docs.map(doc => doc.data() as User);
                setStats(prev => ({
                    ...prev,
                    totalUsers: users.length,
                    totalVisitors: users.filter(u => u.role === 'Visitor' || u.role === 'Worker').length
                }));
                 if (loading) setLoading(false);
            });
            unsubs.push(usersUnsub);

            const requestsUnsub = onSnapshot(query(collection(firestore, 'accessRequests'), where('status', '==', 'Pending')), (snapshot) => {
                setStats(prev => ({
                    ...prev,
                    pendingRequests: snapshot.size
                }));
            });
            unsubs.push(requestsUnsub);
        }

        if (role === 'Manager') {
             const sitesQuery = query(collection(firestore, 'sites'), where('managerIds', 'array-contains', userId));
             const sitesUnsub = onSnapshot(sitesQuery, (sitesSnapshot) => {
                const managerSiteIds = sitesSnapshot.docs.map(doc => doc.id);
                if (managerSiteIds.length > 0) {
                    const requestsQuery = query(collection(firestore, 'accessRequests'), where('siteId', 'in', managerSiteIds), where('status', '==', 'Pending'));
                    const reqUnsub = onSnapshot(requestsQuery, (reqSnapshot) => {
                         setStats(prev => ({ ...prev, pendingRequests: reqSnapshot.size }));
                    });
                    unsubs.push(reqUnsub);
                } else {
                    setStats(prev => ({...prev, pendingRequests: 0}));
                }
                if (loading) setLoading(false);
             });
             unsubs.push(sitesUnsub);
        }

        // Common stats for Admin and Manager
        if (role === 'Admin' || role === 'Manager') {
            const activityUnsub = onSnapshot(collection(firestore, 'gateActivity'), (snapshot) => {
                const activity = snapshot.docs.map(doc => ({...doc.data(), id: doc.id}) as GateActivity);
                
                const checkIns = activity.filter(a => a.type === 'Check-in').reduce((acc, curr) => {
                    if (!acc[curr.userId] || new Date(curr.timestamp) > new Date(acc[curr.userId].timestamp)) {
                    acc[curr.userId] = curr;
                    }
                    return acc;
                }, {} as Record<string, any>);

                const checkOuts = activity.filter(a => a.type === 'Check-out').reduce((acc, curr) => {
                    if (!acc[curr.userId] || new Date(curr.timestamp) > new Date(acc[curr.userId].timestamp)) {
                    acc[curr.userId] = curr;
                    }
                    return acc;
                }, {} as Record<string, any>);

                let checkedInCount = 0;
                for (const userId in checkIns) {
                    if (!checkOuts[userId] || new Date(checkIns[userId].timestamp) > new Date(checkOuts[userId].timestamp)) {
                    checkedInCount++;
                    }
                }
                setStats(prev => ({ ...prev, checkedIn: checkedInCount }));
            });
            unsubs.push(activityUnsub);
        }

        if (role !== 'Admin' && role !== 'Manager') {
            setLoading(false);
        }
        
        return () => unsubs.forEach(unsub => unsub());

    }, [firestore, firestoreUser?.id, firestoreUser?.role]);


    if (authLoading || (loading && (firestoreUser?.role === 'Admin' || firestoreUser?.role === 'Manager'))) {
        return (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {[...Array(4)].map((_, i) => (
                    <Card key={i}>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <Skeleton className="h-4 w-[120px]" />
                        <Skeleton className="h-4 w-4" />
                    </CardHeader>
                    <CardContent>
                        <Skeleton className="h-7 w-8" />
                        <Skeleton className="h-3 w-[100px] mt-1" />
                    </CardContent>
                    </Card>
                ))}
            </div>
        );
    }
  
  if (!firestoreUser || (firestoreUser.role !== 'Admin' && firestoreUser.role !== 'Manager')) {
      return null;
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {firestoreUser.role === 'Admin' && (
        <>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                <div className="text-2xl font-bold">{stats.totalUsers}</div>
                <p className="text-xs text-muted-foreground">All roles included</p>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Visitors & Workers</CardTitle>
                <Building className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                <div className="text-2xl font-bold">{stats.totalVisitors}</div>
                <p className="text-xs text-muted-foreground">Registered external personnel</p>
                </CardContent>
            </Card>
        </>
      )}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Pending Requests</CardTitle>
          <Hourglass className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.pendingRequests}</div>
          <p className="text-xs text-muted-foreground">Awaiting your approval</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Currently Checked-In</CardTitle>
          <LogIn className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.checkedIn}</div>
          <p className="text-xs text-muted-foreground">Personnel on-site now</p>
        </CardContent>
      </Card>
    </div>
  );
}
