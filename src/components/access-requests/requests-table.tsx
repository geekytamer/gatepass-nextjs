
'use client'

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import type { AccessRequest } from '@/lib/types';
import { format, parseISO } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Check, X, Loader2, Users } from 'lucide-react';
import type { Timestamp } from 'firebase/firestore';


interface RequestsTableProps {
  requests: AccessRequest[];
  title: string;
  description: string;
  showActions?: boolean;
  onAction?: (requestId: string, status: 'Approved' | 'Denied') => void;
  isLoading?: boolean;
}

const statusVariant: { [key: string]: 'default' | 'secondary' | 'destructive' | 'outline'} = {
  Approved: 'default',
  Pending: 'secondary',
  Denied: 'destructive'
}

const statusColorClasses = {
  Approved: 'bg-green-500/20 text-green-700 border-transparent hover:bg-green-500/30',
  Pending: 'bg-yellow-500/20 text-yellow-700 border-transparent hover:bg-yellow-500/30',
  Denied: 'bg-red-500/20 text-red-700 border-transparent hover:bg-red-500/30',
}

export function RequestsTable({ requests, title, description, showActions = false, onAction, isLoading = false }: RequestsTableProps) {

  const handleAction = (requestId: string, status: 'Approved' | 'Denied') => {
    onAction?.(requestId, status);
  }

  const formatTimestamp = (timestamp: Timestamp | string | undefined) => {
    if (!timestamp) return 'N/A';
    if (typeof timestamp === 'string') {
      return format(parseISO(timestamp), 'dd MMM yyyy, HH:mm');
    }
    if (typeof timestamp === 'object' && 'toDate' in timestamp) {
      return format(timestamp.toDate(), 'dd MMM yyyy, HH:mm');
    }
    return 'Invalid Date';
  };

  const colSpan = showActions ? 5 : 4;

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Request Details</TableHead>
                <TableHead>Supervisor</TableHead>
                <TableHead>Requested At</TableHead>
                <TableHead>Status</TableHead>
                {showActions && <TableHead className="text-right">Actions</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={colSpan} className="h-24 text-center">
                    <Loader2 className="mx-auto h-6 w-6 animate-spin text-muted-foreground" />
                  </TableCell>
                </TableRow>
              ) : requests.length > 0 ? (
                requests.sort((a,b) => {
                    const dateA = a.requestedAt && typeof a.requestedAt !== 'string' ? a.requestedAt.toDate().getTime() : 0;
                    const dateB = b.requestedAt && typeof b.requestedAt !== 'string' ? b.requestedAt.toDate().getTime() : 0;
                    return dateB - dateA;
                }).map((request) => (
                  <TableRow key={request.id}>
                    <TableCell>
                      <div className="font-medium">{request.siteName}</div>
                      <div className="text-sm text-muted-foreground">{request.contractorName}</div>
                       <div className="flex items-center gap-2 text-sm text-muted-foreground pt-1">
                          <Users className="h-4 w-4" /> 
                          <span>{request.workerIds?.length || 0} Workers</span>
                       </div>
                    </TableCell>
                    <TableCell>
                      <div className="font-medium whitespace-nowrap">{request.supervisorName}</div>
                    </TableCell>
                    <TableCell className="whitespace-nowrap">
                       {formatTimestamp(request.requestedAt)}
                    </TableCell>
                    <TableCell>
                      <Badge variant={statusVariant[request.status]} className={statusColorClasses[request.status as keyof typeof statusColorClasses]}>
                        {request.status}
                      </Badge>
                    </TableCell>
                    {showActions && (
                        <TableCell className="text-right">
                            <div className="flex gap-2 justify-end">
                                <Button variant="outline" size="icon" onClick={() => handleAction(request.id, 'Approved')}><Check className="h-4 w-4 text-green-600" /></Button>
                                <Button variant="outline" size="icon" onClick={() => handleAction(request.id, 'Denied')}><X className="h-4 w-4 text-red-600" /></Button>
                            </div>
                        </TableCell>
                    )}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                    <TableCell colSpan={colSpan} className="h-24 text-center">
                        No requests found.
                    </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
