
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
import type { GateActivity, User } from '@/lib/types';
import { formatDistanceToNow } from 'date-fns';
import { Loader2, LogIn, LogOut } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { format } from 'date-fns';

interface RecentActivityTableProps {
  activity: GateActivity[];
  users: User[];
  isLoading?: boolean;
}

export function RecentActivityTable({ activity, users, isLoading = false }: RecentActivityTableProps) {
  
  const getUserCompany = (userId: string) => {
    return users.find(u => u.id === userId)?.company || 'N/A';
  }

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase();
  }

  const sortedActivity = activity.sort((a,b) => {
    const timeA = new Date(a.timestamp).getTime();
    const timeB = new Date(b.timestamp).getTime();
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
                <TableHead>Action</TableHead>
                <TableHead className="text-right">Time</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={3} className="h-56 text-center"><Loader2 className="mx-auto h-6 w-6 animate-spin text-muted-foreground" /></TableCell></TableRow>
              ) : sortedActivity.length > 0 ? (
                sortedActivity.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                         <div className="h-9 w-9 flex items-center justify-center rounded-full bg-muted text-muted-foreground font-semibold">
                            {getInitials(item.userName)}
                         </div>
                         <div>
                            <div className="font-medium whitespace-nowrap">{item.userName}</div>
                            <div className="text-sm text-muted-foreground">{getUserCompany(item.userId)}</div>
                         </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={item.type === 'Check-in' ? 'default' : 'secondary'} className={`flex items-center gap-1.5 w-fit ${item.type === 'Check-in' ? 'bg-blue-500/20 text-blue-700 border-transparent hover:bg-blue-500/30' : 'bg-gray-500/20 text-gray-700 border-transparent hover:bg-gray-500/30'}`}>
                        {item.type === 'Check-in' ? <LogIn className="h-3 w-3" /> : <LogOut className="h-3 w-3" />}
                        {item.type}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right whitespace-nowrap">
                      <TooltipProvider>
                          <Tooltip>
                              <TooltipTrigger>
                                  <span className="text-muted-foreground">{formatDistanceToNow(new Date(item.timestamp), { addSuffix: true })}</span>
                              </TooltipTrigger>
                              <TooltipContent>
                                  <p>{format(new Date(item.timestamp), 'PPP p')}</p>
                              </TooltipContent>
                          </Tooltip>
                      </TooltipProvider>
                    </TableCell>
                  </TableRow>
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
