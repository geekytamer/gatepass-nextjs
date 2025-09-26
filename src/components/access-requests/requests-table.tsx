
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
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Check, X, Loader2, Paperclip } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from "@/components/ui/dialog"


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
                <TableHead>User</TableHead>
                <TableHead>Access Date</TableHead>
                <TableHead className="hidden md:table-cell">Reason</TableHead>
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
                requests.map((request) => (
                  <TableRow key={request.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-9 w-9">
                          <AvatarImage src={request.userAvatar} alt={request.userName} />
                          <AvatarFallback>{request.userName.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div className="font-medium whitespace-nowrap">{request.userName}</div>
                      </div>
                    </TableCell>
                    <TableCell className="whitespace-nowrap">
                      {request.date ? format(new Date(request.date), 'MMMM dd, yyyy') : 'N/A'}
                    </TableCell>
                    <TableCell className="hidden md:table-cell max-w-xs truncate">{request.reason}</TableCell>
                    <TableCell>
                       <div className="flex items-center gap-2">
                        <Badge variant={statusVariant[request.status]} className={statusColorClasses[request.status as keyof typeof statusColorClasses]}>
                          {request.status}
                        </Badge>
                         {request.certificateDataUrl && (
                            <Dialog>
                                <DialogTrigger asChild>
                                    <Button variant="ghost" size="icon" className="h-6 w-6">
                                        <Paperclip className="h-4 w-4" />
                                        <span className="sr-only">View Certificate</span>
                                    </Button>
                                </DialogTrigger>
                                <DialogContent className="max-w-2xl">
                                    <DialogHeader>
                                        <DialogTitle>Attached Certificate</DialogTitle>
                                        <DialogDescription>
                                            Certificate attached for access request by {request.userName} on {format(new Date(request.date), 'MMMM dd, yyyy')}.
                                        </DialogDescription>
                                    </DialogHeader>
                                    <div className="mt-4 rounded-md border p-2">
                                        <img src={request.certificateDataUrl} alt="Certificate" className="max-h-[70vh] w-auto mx-auto rounded"/>
                                    </div>
                                </DialogContent>
                            </Dialog>
                         )}
                      </div>
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
