
'use client';
import { useState, useEffect } from 'react';
import { useFirestore } from '@/firebase';
import { collection, onSnapshot, query, where, getDocs } from 'firebase/firestore';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Users, Hourglass, LogIn, Building } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import type { User, AccessRequest, GateActivity, Site } from '@/lib/types';
import { useAuthProtection } from '@/hooks/use-auth-protection';
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartConfig } from '@/components/ui/chart';
import * as RechartsPrimitive from 'recharts';


const chartConfig = {
  count: {
    label: "Personnel",
  },
} satisfies ChartConfig;


export function StatsCards() {
    const { firestoreUser, loading: authLoading } = useAuthProtection(['Admin', 'Operator Admin', 'Contractor Admin', 'Manager', 'Security', 'Worker', 'Supervisor']);
    const firestore = useFirestore();
    const [stats, setStats] = useState({
        totalUsers: 0,
        pendingRequests: 0,
        checkedIn: 0,
        totalVisitors: 0,
    });
    const [onSiteByCompany, setOnSiteByCompany] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!firestore || !firestoreUser) return;
        setLoading(true);

        const unsubs: (() => void)[] = [];
        const role = firestoreUser.role;
        const userId = firestoreUser.id;

        const canViewAllStats = role === 'Admin' || role === 'Operator Admin';
        const isManager = role === 'Manager';


        const setupListeners = async (siteIds?: string[]) => {
          // Total Users & Visitors
          if (canViewAllStats) {
            unsubs.push(onSnapshot(collection(firestore, 'users'), (snapshot) => {
                const users = snapshot.docs.map(doc => doc.data() as User);
                setStats(prev => ({
                    ...prev,
                    totalUsers: users.length,
                    totalVisitors: users.filter(u => u.role === 'Visitor' || u.role === 'Worker').length
                }));
            }));
          }

          // Pending Requests
          let requestsQuery = query(collection(firestore, 'accessRequests'), where('status', '==', 'Pending'));
          if (siteIds) {
            requestsQuery = query(requestsQuery, where('siteId', 'in', siteIds));
          }
          unsubs.push(onSnapshot(requestsQuery, (snapshot) => {
              setStats(prev => ({ ...prev, pendingRequests: snapshot.size }));
          }));

          // Checked-in count and by-company breakdown
          let activityQuery = collection(firestore, 'gateActivity');
          if (siteIds) {
            activityQuery = query(activityQuery, where('siteId', 'in', siteIds));
          }
          unsubs.push(onSnapshot(activityQuery, (activitySnap) => {
            onSnapshot(collection(firestore, 'users'), (usersSnap) => {
                const activities = activitySnap.docs.map(doc => ({...doc.data(), id: doc.id}) as GateActivity);
                const users = usersSnap.docs.map(doc => ({ ...doc.data(), id: doc.id }) as User);
                const { checkedInCount, onSiteByCompanyData } = processActivity(activities, users);
                
                setStats(prev => ({ ...prev, checkedIn: checkedInCount }));
                setOnSiteByCompany(onSiteByCompanyData);
                setLoading(false);
            })
          }));
        }


        if (isManager) {
             const sitesQuery = query(collection(firestore, 'sites'), where('managerIds', 'array-contains', userId));
             unsubs.push(onSnapshot(sitesQuery, (sitesSnapshot) => {
                const managerSiteIds = sitesSnapshot.docs.map(doc => doc.id);
                if (managerSiteIds.length > 0) {
                  setupListeners(managerSiteIds);
                } else {
                  setLoading(false);
                }
             }));
        } else if (canViewAllStats) {
          setupListeners();
        } else {
            setLoading(false);
        }
        
        return () => unsubs.forEach(unsub => unsub());

    }, [firestore, firestoreUser?.id, firestoreUser?.role]);
    
    function processActivity(activities: GateActivity[], users: User[]) {
        const userMap = new Map(users.map(u => [u.id, u]));

        const latestActivity: Record<string, any> = {};
        activities.forEach(activity => {
            if (!latestActivity[activity.userId] || new Date(activity.timestamp) > new Date(latestActivity[activity.userId].timestamp)) {
                latestActivity[activity.userId] = activity;
            }
        });

        const onSiteUsers: User[] = [];
        Object.values(latestActivity).forEach(activity => {
            if (activity.type === 'Check-in') {
                const user = userMap.get(activity.userId);
                if (user) {
                    onSiteUsers.push(user);
                }
            }
        });
        
        const checkedInCount = onSiteUsers.length;

        const companyCounts = onSiteUsers.reduce((acc, user) => {
            const companyName = user.company || 'Unknown';
            acc[companyName] = (acc[companyName] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);

        const onSiteByCompanyData = Object.entries(companyCounts).map(([name, count]) => ({ name, count }));

        return { checkedInCount, onSiteByCompanyData };
    }


    if (authLoading || (loading && (firestoreUser?.role === 'Admin' || firestoreUser?.role === 'Operator Admin' || firestoreUser?.role === 'Manager'))) {
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
  
  if (!firestoreUser || (firestoreUser.role !== 'Admin' && firestoreUser.role !== 'Operator Admin' && firestoreUser.role !== 'Manager')) {
      return null;
  }

  const renderCards = () => (
      <>
       {(firestoreUser.role === 'Admin' || firestoreUser.role === 'Operator Admin') && (
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
          <CardTitle className="text-sm font-medium">Currently On-Site</CardTitle>
          <LogIn className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.checkedIn}</div>
           <p className="text-xs text-muted-foreground">
            {firestoreUser.role === 'Manager' ? "Personnel on your sites" : "Personnel on-site now"}
          </p>
        </CardContent>
      </Card>
      </>
  )

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-2">
      <div className="grid gap-4 md:grid-cols-2">
        {renderCards()}
      </div>
      <Card>
        <CardHeader>
            <CardTitle>On-Site Personnel by Company</CardTitle>
        </CardHeader>
        <CardContent>
            <ChartContainer config={chartConfig} className="h-[200px] w-full">
                <BarChart layout="vertical" data={onSiteByCompany} margin={{ left: 10, right: 10 }}>
                    <CartesianGrid horizontal={false} />
                    <YAxis dataKey="name" type="category" tickLine={false} axisLine={false} tickMargin={10} width={80} />
                    <XAxis type="number" hide />
                    <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
                    <Bar dataKey="count" fill="var(--color-chart-1)" radius={4}>
                         {onSiteByCompany.map((entry, index) => (
                            <RechartsPrimitive.Label
                                key={`label-${index}`}
                                content={({ x, y, width, height, value }) => 
                                <text x={x! + width! + 5} y={y! + height!/2} dy={4} className="fill-foreground text-sm font-medium">{value}</text>
                                }
                            />
                        ))}
                    </Bar>
                </BarChart>
            </ChartContainer>
        </CardContent>
      </Card>
    </div>
  );
}
