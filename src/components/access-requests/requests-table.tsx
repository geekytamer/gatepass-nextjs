
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
import { Check, X, Loader2, Users, CalendarDays, Infinity, ChevronDown, ChevronRight, Briefcase, FileBadge, ShieldAlert } from 'lucide-react';
import type { Timestamp } from 'firebase/firestore';
import React, { useState } from 'react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { cn } from '@/lib/utils';

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
  const [openRequestId, setOpenRequestId] = useState<string | null>(null);

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
  
  const isCertificateExpired = (expiryDate?: string) => {
    if (!expiryDate) return false; // Or treat as valid if no expiry
    return isBefore(parseISO(expiryDate), new Date());
  };

  const colSpan = showActions ? 6 : 5;

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
                  <Collapsible asChild key={request.id} open={openRequestId === request.id} onOpenChange={() => setOpenRequestId(prev => prev === request.id ? null : request.id)}>
                    <>
                      <TableRow className="cursor-pointer">
                        <TableCell>
                          <CollapsibleTrigger asChild>
                             <div className="flex items-center gap-2">
                               {openRequestId === request.id ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                               <div>
                                  <div className="font-medium">{request.siteName}</div>
                                  <div className="text-sm text-muted-foreground">{request.contractorName}</div>
                               </div>
                             </div>
                          </CollapsibleTrigger>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground pt-1 pl-6">
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
                                    <Button variant="outline" size="icon" onClick={() => onApprove?.(request)}><Check className="h-4 w-4 text-green-600" /></Button>
                                    <Button variant="outline" size="icon" onClick={() => onDeny?.(request.id)}><X className="h-4 w-4 text-red-600" /></Button>
                                </div>
                            </TableCell>
                        )}
                      </TableRow>
                      <CollapsibleContent asChild>
                        <TableRow>
                          <TableCell colSpan={colSpan} className="p-0">
                            <div className="p-4 bg-muted/50">
                                <h4 className="font-semibold mb-2">Personnel in this request:</h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {request.workerIds.map(workerId => {
                                  const worker = allUsers.find(u => u.id === workerId);
                                  if (!worker) return null;
                                  return (
                                    <div key={worker.id} className="p-3 rounded-md bg-background border flex flex-col gap-2">
                                      <div className="font-semibold">{worker.name}</div>
                                      <div className="text-sm text-muted-foreground flex items-center gap-2">
                                        <Briefcase className="h-4 w-4" />
                                        <span>{(worker as any).jobTitle || 'N/A'}</span>
                                      </div>
                                       <div>
                                          {(worker.certificates && worker.certificates.length > 0) ? worker.certificates.map(cert => {
                                              const isExpired = isCertificateExpired(cert.expiryDate);
                                              return (
                                                  <Badge key={cert.name} variant={isExpired ? "destructive" : "secondary"} className="font-normal mr-1 mb-1">
                                                      {isExpired ? <ShieldAlert className="h-3 w-3 mr-1.5" /> : <FileBadge className="h-3 w-3 mr-1.5" />}
                                                      {cert.name}
                                                  </Badge>
                                              )
                                          }) : <span className="text-xs text-muted-foreground">No certificates on record.</span>}
                                      </div>
                                    </div>
                                  )
                                })}
                                </div>
                            </div>
                          </TableCell>
                        </TableRow>
                      </CollapsibleContent>
                    </>
                  </Collapsible>
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
