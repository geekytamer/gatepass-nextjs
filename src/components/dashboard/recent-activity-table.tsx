
'use client';

import React from 'react';
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
import type { GateActivity, User, Site } from '@/lib/types';
import { formatDistanceToNow, format } from 'date-fns';
import { Loader2, LogIn, LogOut, Briefcase } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { Timestamp } from 'firebase/firestore';
import { useWorkerData } from '@/hooks/use-worker-data';

interface RecentActivityTableProps {
  activity: GateActivity[];
  users: User[];
  sites: Site[];
  isLoading?: boolean;
}

const ActivityTableRow = ({ activityItem, allUsers, allSites }: { activityItem: GateActivity, allUsers: User[], allSites: Site[] }) => {
    const user = allUsers.find(u => u.id === activityItem.userId);
    const { workerData, loading: workerLoading } = useWorkerData(user?.idNumber);

    const getInitials = (name: string) => {
        if (!name) return '';
        return name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase();
    }
    
    const toDate = (timestamp: string | Timestamp): Date => {
      if (typeof timestamp === 'object' && timestamp.toDate) {
        return timestamp.toDate();
      }
      return new Date(timestamp);
    }
    
    const activityDate = toDate(activityItem.timestamp);
    const siteName = allSites.find(s => s.id === activityItem.siteId)?.name || 'Unknown Site';

    return (
        <TableRow>
            <TableCell>
            <div className="flex items-center gap-3">
                <div className="h-9 w-9 flex items-center justify-center rounded-full bg-muted text-muted-foreground font-semibold">
                    {getInitials(activityItem.userName)}
                </div>
                <div>
                    <div className="font-medium whitespace-nowrap">{activityItem.userName}</div>
                     <div className="text-sm text-muted-foreground flex items-center gap-1.5">
                         <Briefcase className="h-3 w-3" />
                         <span>{workerLoading ? '...' : workerData?.jobTitle || 'N/A'}</span>
                    </div>
                </div>
            </div>
            </TableCell>
            <TableCell>
                <div className="flex flex-col">
                    <Badge variant={activityItem.type === 'Check-in' ? 'default' : 'secondary'} className={`flex items-center gap-1.5 w-fit ${activityItem.type === 'Check-in' ? 'bg-blue-500/20 text-blue-700 border-transparent hover:bg-blue-500/30' : 'bg-gray-500/20 text-gray-700 border-transparent hover:bg-gray-500/30'}`}>
                        {activityItem.type === 'Check-in' ? <LogIn className="h-3 w-3" /> : <LogOut className="h-3 w-3" />}
                        {activityItem.type}
                    </Badge>
                     <span className="text-xs text-muted-foreground mt-1">{siteName}</span>
                </div>
            </TableCell>
            <TableCell className="text-right whitespace-nowrap">
            <TooltipProvider>
                <Tooltip>
                    <TooltipTrigger>
                        <span className="text-muted-foreground">{formatDistanceToNow(activityDate, { addSuffix: true })}</span>
                    </TooltipTrigger>
                    <TooltipContent>
                        <p>{format(activityDate, 'PPP p')}</p>
                    </TooltipContent>
                </Tooltip>
            </TooltipProvider>
            </TableCell>
        </TableRow>
    )
}


export function RecentActivityTable({ activity, users, sites, isLoading = false }: RecentActivityTableProps) {
  
  const toDate = (timestamp: string | Timestamp): Date => {
    if (typeof timestamp === 'object' && timestamp.toDate) {
      return timestamp.toDate();
    }
    return new Date(timestamp);
  }

  const sortedActivity = activity.sort((a,b) => {
    const timeA = toDate(a.timestamp).getTime();
    const timeB = toDate(b.timestamp).getTime();
    return timeB - timeA;
  }).slice(0, 10); // Get latest 10 activities

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Gate Activity</CardTitle>
        <CardDescription>A log of the most recent check-ins and check-outs.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Personnel</TableHead>
                <TableHead>Action & Site</TableHead>
                <TableHead className="text-right">Time</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={3} className="h-56 text-center"><Loader2 className="mx-auto h-6 w-6 animate-spin text-muted-foreground" /></TableCell></TableRow>
              ) : sortedActivity.length > 0 ? (
                sortedActivity.map((item) => (
                    <ActivityTableRow key={item.id} activityItem={item} allUsers={users} allSites={sites} />
                ))
              ) : (
                <TableRow><TableCell colSpan={3} className="h-56 text-center">No recent activity found.</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
