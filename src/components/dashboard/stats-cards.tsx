
'use client';
import { useState, useEffect } from 'react';
import { useFirestore } from '@/firebase';
import { collection, onSnapshot } from 'firebase/firestore';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Users, Hourglass, LogIn, Building } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import type { User, AccessRequest, GateActivity } from '@/lib/types';


export function StatsCards() {
    const firestore = useFirestore();
    const [stats, setStats] = useState({
        totalUsers: 0,
        pendingRequests: 0,
        checkedIn: 0,
        totalVisitors: 0,
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!firestore) return;

        const unsubs: (() => void)[] = [];

        const usersUnsub = onSnapshot(collection(firestore, 'users'), (snapshot) => {
            const users = snapshot.docs.map(doc => doc.data() as User);
            setStats(prev => ({
                ...prev,
                totalUsers: users.length,
                totalVisitors: users.filter(u => u.role === 'Visitor' || u.role === 'Worker').length
            }));
            setLoading(false);
        });
        unsubs.push(usersUnsub);

        const requestsUnsub = onSnapshot(collection(firestore, 'accessRequests'), (snapshot) => {
            const requests = snapshot.docs.map(doc => doc.data() as AccessRequest);
            setStats(prev => ({
                ...prev,
                pendingRequests: requests.filter(r => r.status === 'Pending').length
            }));
        });
        unsubs.push(requestsUnsub);

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

        return () => unsubs.forEach(unsub => unsub());

    }, [firestore]);


    if (loading) {
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

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
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
          <CardTitle className="text-sm font-medium">Pending Requests</CardTitle>
          <Hourglass className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.pendingRequests}</div>
          <p className="text-xs text-muted-foreground">Awaiting manager approval</p>
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
    </div>
  );
}
