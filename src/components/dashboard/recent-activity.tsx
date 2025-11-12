
'use client';
import { useState, useEffect } from 'react';
import { useFirestore } from '@/firebase';
import { collection, onSnapshot, query, orderBy, limit } from 'firebase/firestore';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { GateActivity } from '@/lib/types';
import { formatDistanceToNow } from 'date-fns';
import { Skeleton } from '@/components/ui/skeleton';
import { User } from 'lucide-react';

export function RecentActivity() {
    const [recentActivity, setRecentActivity] = useState<GateActivity[]>([]);
    const [loading, setLoading] = useState(true);
    const firestore = useFirestore();

    useEffect(() => {
        if (!firestore) return;
        setLoading(true);
        const activityQuery = query(collection(firestore, "gateActivity"), orderBy("timestamp", "desc"), limit(10));

        const unsubscribe = onSnapshot(activityQuery, (snapshot) => {
            const activities = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
                timestamp: doc.data().timestamp?.toDate().toISOString()
            } as GateActivity));
            setRecentActivity(activities);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [firestore]);

    const getInitials = (name: string) => {
      return name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase();
    }


  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Gate Activity</CardTitle>
        <CardDescription>A real-time log of the latest check-ins and check-outs across all sites.</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>User</TableHead>
              <TableHead>Gate</TableHead>
              <TableHead>Type</TableHead>
              <TableHead className="text-right">Time</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
                 [...Array(5)].map((_, i) => (
                    <TableRow key={i}>
                        <TableCell><div className="flex items-center gap-3"><Skeleton className="h-9 w-9 rounded-full" /><Skeleton className="h-5 w-24" /></div></TableCell>
                        <TableCell><Skeleton className="h-5 w-20" /></TableCell>
                        <TableCell><Skeleton className="h-6 w-20 rounded-full" /></TableCell>
                        <TableCell className="text-right"><Skeleton className="h-5 w-24" /></TableCell>
                    </TableRow>
                ))
            ) : (
                recentActivity.map((activity) => (
                <TableRow key={activity.id}>
                    <TableCell>
                    <div className="flex items-center gap-3">
                        <div className="h-9 w-9 flex items-center justify-center rounded-full bg-muted text-muted-foreground font-semibold">
                          {getInitials(activity.userName)}
                        </div>
                        <div className="font-medium">{activity.userName}</div>
                      </div>
                    </TableCell>
                    <TableCell>{activity.gate}</TableCell>
                    <TableCell>
                    <Badge variant={activity.type === 'Check-in' ? 'default' : 'secondary'} className={activity.type === 'Check-in' ? 'bg-green-500/20 text-green-700 border-transparent hover:bg-green-500/30' : 'bg-red-500/20 text-red-700 border-transparent hover:bg-red-500/30'}>
                        {activity.type}
                    </Badge>
                    </TableCell>
                    <TableCell className="text-right text-muted-foreground">
                    {activity.timestamp ? formatDistanceToNow(new Date(activity.timestamp), { addSuffix: true }) : 'Just now'}
                    </TableCell>
                </TableRow>
                ))
            )}
             {!loading && recentActivity.length === 0 && (
                <TableRow>
                    <TableCell colSpan={4} className="h-24 text-center">
                        No activity recorded yet.
                    </TableCell>
                </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
