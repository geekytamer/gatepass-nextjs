
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
import { Badge } from '@/components/ui/badge';
import type { AccessRequest, User } from '@/lib/types';
import { format, parseISO, isBefore } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Check, X, Loader2, Users, CalendarDays, Infinity } from 'lucide-react';
import type { Timestamp } from 'firebase/firestore';
import React, { useState } from 'react';
import { RequestDetailsDialog } from './request-details-dialog';


interface RequestsTableProps {
  requests: AccessRequest[];
  title: string;
  description: string;
  showActions?: boolean;
  onApprove?: (request: AccessRequest) => void;
  onDeny?: (requestId: string) => void;
  isLoading?: boolean;
  allUsers: User[];
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

export function RequestsTable({ requests, title, description, showActions = false, onApprove, onDeny, isLoading = false, allUsers }: RequestsTableProps) {
  const [selectedRequest, setSelectedRequest] = useState<AccessRequest | null>(null);

  const formatTimestamp = (timestamp: Timestamp | string | undefined) => {
    if (!timestamp) return 'N/A';
    if (typeof timestamp === 'string') {
      try {
        return format(parseISO(timestamp), 'dd MMM yyyy, HH:mm');
      } catch {
        return 'Invalid Date';
      }
    }
    if (typeof timestamp === 'object' && 'toDate' in timestamp) {
      return format(timestamp.toDate(), 'dd MMM yyyy, HH:mm');
    }
    return 'Invalid Date';
  };
  
  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    try {
      return format(parseISO(dateString), 'dd MMM yyyy');
    } catch {
      return 'Invalid Date';
    }
  }

  const colSpan = showActions ? 6 : 5;

  const handleRowClick = (request: AccessRequest) => {
    setSelectedRequest(request);
  };

  return (
    <>
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
                <TableHead>Access Dates</TableHead>
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
                  <TableRow key={request.id} onClick={() => handleRowClick(request)} className="cursor-pointer">
                    <TableCell>
                      <div>
                          <div className="font-medium">{request.siteName}</div>
                          <div className="text-sm text-muted-foreground">{request.contractorName}</div>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground pt-1">
                          <Users className="h-4 w-4" /> 
                          <span>{(request.workerIds || []).length} Workers</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="font-medium whitespace-nowrap">{request.supervisorName}</div>
                    </TableCell>
                    <TableCell className="whitespace-nowrap">
                      {formatTimestamp(request.requestedAt)}
                    </TableCell>
                    <TableCell>
                      {request.status === 'Approved' ? (
                        <div className="flex items-center gap-2 text-sm">
                          <CalendarDays className="h-4 w-4 text-muted-foreground" />
                          <div className="flex flex-col">
                            <span>{formatDate(request.validFrom)}</span>
                            <span className="flex items-center gap-1">
                                to {request.expiresAt === 'Permanent' ? <Infinity className="h-4 w-4" /> : formatDate(request.expiresAt)}
                            </span>
                          </div>
                        </div>
                      ) : (
                        <span className="text-muted-foreground">N/A</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant={statusVariant[request.status]} className={statusColorClasses[request.status as keyof typeof statusColorClasses]}>
                        {request.status}
                      </Badge>
                    </TableCell>
                    {showActions && (
                        <TableCell className="text-right">
                            <div className="flex gap-2 justify-end">
                                <Button variant="outline" size="icon" onClick={(e) => { e.stopPropagation(); onApprove?.(request); }}><Check className="h-4 w-4 text-green-600" /></Button>
                                <Button variant="outline" size="icon" onClick={(e) => { e.stopPropagation(); onDeny?.(request.id); }}><X className="h-4 w-4 text-red-600" /></Button>
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

    {selectedRequest && (
      <RequestDetailsDialog 
        request={selectedRequest}
        allUsers={allUsers}
        open={!!selectedRequest}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedRequest(null);
          }
        }}
      />
    )}
  </>
  );
}
