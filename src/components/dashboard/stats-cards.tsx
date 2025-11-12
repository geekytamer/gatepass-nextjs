
'use client';
import { useState, useEffect } from 'react';
import { useFirestore } from '@/firebase';
import { collection, onSnapshot, query, where, getDocs, Query } from 'firebase/firestore';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Users, Hourglass, LogIn, Building, Building2 } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import type { User, AccessRequest, GateActivity, Site } from '@/lib/types';
import { useAuthProtection } from '@/hooks/use-auth-protection';
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartConfig } from '@/components/ui/chart';
import * as RechartsPrimitive from 'recharts';

interface StatsCardsProps {
    siteId: string;
}

export function StatsCards({ siteId }: StatsCardsProps) {
    const { firestoreUser, loading: authLoading } = useAuthProtection(['Admin', 'Operator Admin', 'Manager']);
    const firestore = useFirestore();
    const [stats, setStats] = useState({
        totalUsers: 0,
        pendingRequests: 0,
        checkedIn: 0,
        totalVisitors: 0,
        totalSites: 0,
    });
    const [onSiteByCompany, setOnSiteByCompany] = useState<any[]>([]);
    const [chartConfig, setChartConfig] = useState<ChartConfig>({});
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!firestore || !firestoreUser) return;
        setLoading(true);

        const unsubs: (() => void)[] = [];
        const role = firestoreUser.role;
        const userId = firestoreUser.id;

        const isManager = role === 'Manager';


        const setupListeners = async (filterSiteIds?: string[]) => {
          // Global stats - only for admins with 'all sites' selected
          if (firestoreUser.role !== 'Manager' && siteId === 'all') {
            unsubs.push(onSnapshot(collection(firestore, 'users'), (snapshot) => {
                const users = snapshot.docs.map(doc => doc.data() as User);
                setStats(prev => ({
                    ...prev,
                    totalUsers: users.length,
                    totalVisitors: users.filter(u => u.role === 'Visitor' || u.role === 'Worker').length
                }));
            }));
             unsubs.push(onSnapshot(collection(firestore, 'sites'), (snapshot) => {
                setStats(prev => ({ ...prev, totalSites: snapshot.size }));
            }));
          }

          // Pending Requests
          let requestsQuery: Query = query(collection(firestore, 'accessRequests'), where('status', '==', 'Pending'));
          if (siteId !== 'all') {
            requestsQuery = query(requestsQuery, where('siteId', '==', siteId));
          } else if (filterSiteIds) {
            requestsQuery = query(requestsQuery, where('siteId', 'in', filterSiteIds));
          }
          unsubs.push(onSnapshot(requestsQuery, (snapshot) => {
              setStats(prev => ({ ...prev, pendingRequests: snapshot.size }));
          }));

          // Checked-in count and by-company breakdown
          let activityQuery: Query;
           if (siteId !== 'all') {
              activityQuery = query(collection(firestore, 'gateActivity'), where('siteId', '==', siteId));
          } else if (filterSiteIds) {
              activityQuery = query(collection(firestore, 'gateActivity'), where('siteId', 'in', filterSiteIds));
          } else {
              activityQuery = collection(firestore, 'gateActivity');
          }

          unsubs.push(onSnapshot(activityQuery, (activitySnap) => {
            onSnapshot(collection(firestore, 'users'), (usersSnap) => {
                const activities = activitySnap.docs.map(doc => ({...doc.data(), id: doc.id}) as GateActivity);
                const users = usersSnap.docs.map(doc => ({ ...doc.data(), id: doc.id }) as User);
                const { checkedInCount, onSiteByCompanyData } = processActivity(activities, users);
                
                const newChartConfig: ChartConfig = {};
                const colors = ['hsl(var(--chart-1))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))', 'hsl(var(--chart-5))'];

                onSiteByCompanyData.forEach((item, index) => {
                    newChartConfig[item.name] = {
                        label: item.name,
                        color: colors[index % colors.length],
                    };
                });
                
                setChartConfig(newChartConfig);
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
        } else { // Admin or Operator Admin
          setupListeners();
        }
        
        return () => unsubs.forEach(unsub => unsub());

    }, [firestore, firestoreUser, siteId]);
    
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

        const onSiteByCompanyData = Object.entries(companyCounts).map(([name, count]) => ({ name, count })).sort((a,b) => b.count - a.count);

        return { checkedInCount, onSiteByCompanyData };
    }


    if (authLoading || loading) {
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
  
  if (!firestoreUser) {
      return null;
  }

  const renderGlobalStats = firestoreUser.role !== 'Manager' && siteId === 'all';

  const renderCards = () => (
      <>
       {renderGlobalStats && (
        <>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Sites</CardTitle>
                <Building2 className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                <div className="text-2xl font-bold">{stats.totalSites}</div>
                <p className="text-xs text-muted-foreground">All operational sites</p>
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
          <p className="text-xs text-muted-foreground">{siteId === 'all' ? 'Awaiting approval' : 'For this site'}</p>
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
      <div className={`grid gap-4 ${renderGlobalStats ? 'md:grid-cols-2' : 'grid-cols-1 md:grid-cols-2'}`}>
        {renderCards()}
      </div>
      <Card>
        <CardHeader>
            <CardTitle>On-Site Personnel by Company</CardTitle>
            <CardDescription>{siteId === 'all' ? 'Breakdown across all sites.' : 'Breakdown for the selected site.'}</CardDescription>
        </CardHeader>
        <CardContent>
             {onSiteByCompany.length > 0 ? (
                <ChartContainer config={chartConfig} className="h-[200px] w-full">
                    <BarChart layout="vertical" data={onSiteByCompany} margin={{ left: 10, right: 30 }}>
                        <CartesianGrid horizontal={false} />
                        <YAxis dataKey="name" type="category" tickLine={false} axisLine={false} tickMargin={10} width={100} />
                        <XAxis type="number" hide />
                        <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
                        <Bar dataKey="count" radius={4}>
                            {onSiteByCompany.map((entry) => (
                                <Cell key={`cell-${entry.name}`} fill={chartConfig[entry.name]?.color} />
                            ))}
                            {onSiteByCompany.map((entry, index) => (
                                <RechartsPrimitive.Label
                                    key={`label-${index}`}
                                    position="right"
                                    offset={10}
                                    content={({ x, y, width, height, value }) => 
                                    <text x={x! + width!} y={y! + height!/2} dy={4} className="fill-foreground text-sm font-medium">{value}</text>
                                    }
                                />
                            ))}
                        </Bar>
                    </BarChart>
                </ChartContainer>
            ) : (
                <div className="h-[200px] flex items-center justify-center text-muted-foreground">
                    No personnel currently on-site.
                </div>
            )}
        </CardContent>
      </Card>
    </div>
  );
}
