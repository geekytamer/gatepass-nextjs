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
import { Check, X } from 'lucide-react';

interface RequestsTableProps {
  requests: AccessRequest[];
  title: string;
  description: string;
  showActions?: boolean;
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

export function RequestsTable({ requests, title, description, showActions = false }: RequestsTableProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>User</TableHead>
              <TableHead>Access Date</TableHead>
              <TableHead>Reason</TableHead>
              <TableHead>Status</TableHead>
              {showActions && <TableHead className="text-right">Actions</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {requests.map((request) => (
              <TableRow key={request.id}>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <Avatar className="h-9 w-9">
                      <AvatarImage src={request.userAvatar} alt={request.userName} />
                      <AvatarFallback>{request.userName.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div className="font-medium">{request.userName}</div>
                  </div>
                </TableCell>
                <TableCell>{format(new Date(request.date), 'MMMM dd, yyyy')}</TableCell>
                <TableCell className="max-w-xs truncate">{request.reason}</TableCell>
                <TableCell>
                  <Badge variant={statusVariant[request.status]} className={statusColorClasses[request.status as keyof typeof statusColorClasses]}>
                    {request.status}
                  </Badge>
                </TableCell>
                {showActions && (
                    <TableCell className="text-right">
                        <div className="flex gap-2 justify-end">
                            <Button variant="outline" size="icon"><Check className="h-4 w-4 text-green-600" /></Button>
                            <Button variant="outline" size="icon"><X className="h-4 w-4 text-red-600" /></Button>
                        </div>
                    </TableCell>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
