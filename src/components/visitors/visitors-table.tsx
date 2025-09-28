
'use client'

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
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import type { User } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { MoreHorizontal, Trash2, Edit, Loader2, Paperclip, ShieldCheck, AlertTriangle } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { format, isBefore, parseISO } from 'date-fns';

interface VisitorsTableProps {
  visitors: User[];
  onDeleteVisitor: (visitorId: string) => void;
  isLoading?: boolean;
}

export function VisitorsTable({ visitors, onDeleteVisitor, isLoading = false }: VisitorsTableProps) {
  
  const isCertificateExpired = (expiryDate?: string) => {
    if (!expiryDate) return false;
    return isBefore(parseISO(expiryDate), new Date());
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Registered Visitors & Workers</CardTitle>
        <CardDescription>A list of all external personnel with profiles in the system.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead className="hidden sm:table-cell">Company</TableHead>
                <TableHead>Role</TableHead>
                <TableHead className="hidden md:table-cell">Email</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                  <TableRow>
                      <TableCell colSpan={5} className="h-24 text-center">
                          <Loader2 className="mx-auto h-6 w-6 animate-spin text-muted-foreground" />
                      </TableCell>
                  </TableRow>
              ) : visitors.length > 0 ? (
                visitors.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-9 w-9">
                          <AvatarImage src={user.avatarUrl} alt={user.name} />
                          <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div className="font-medium whitespace-nowrap">{user.name}</div>
                         {user.certificates && user.certificates.length > 0 && (
                            <Dialog>
                                <DialogTrigger asChild>
                                    <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground">
                                        <Paperclip className="h-4 w-4" />
                                        <span className="sr-only">View Certificates</span>
                                    </Button>
                                </DialogTrigger>
                                <DialogContent className="max-w-xl">
                                    <DialogHeader>
                                        <DialogTitle>Certificates for {user.name}</DialogTitle>
                                    </DialogHeader>
                                    <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[70vh] overflow-y-auto p-1">
                                        {user.certificates.map((cert, index) => {
                                          const isExpired = isCertificateExpired(cert.expiryDate);
                                          return (
                                            <Card key={index}>
                                              <CardHeader className="flex-row items-start gap-3">
                                                 <ShieldCheck className="h-5 w-5 text-primary mt-1"/>
                                                 <div className="flex-1">
                                                    <CardTitle className="text-lg">{cert.name}</CardTitle>
                                                     {cert.expiryDate ? (
                                                        <CardDescription className={isExpired ? "text-destructive font-semibold" : ""}>
                                                            Expires: {format(parseISO(cert.expiryDate), 'PPP')}
                                                        </CardDescription>
                                                    ) : (
                                                      <CardDescription>No expiry date</CardDescription>
                                                    )}
                                                 </div>
                                                 {isExpired && <AlertTriangle className="h-5 w-5 text-destructive" />}
                                              </CardHeader>
                                            </Card>
                                        )})}
                                    </div>
                                </DialogContent>
                            </Dialog>
                         )}
                      </div>
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">{user.company || 'N/A'}</TableCell>
                    <TableCell>
                      <Badge variant={user.role === 'Visitor' ? 'secondary' : 'outline'}>{user.role}</Badge>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">{user.email}</TableCell>
                    <TableCell className="text-right">
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon">
                                    <MoreHorizontal className="h-4 w-4" />
                                    <span className="sr-only">Open actions</span>
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuItem>
                                  <Edit className="mr-2 h-4 w-4" />
                                  <span>Edit Profile</span>
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem 
                                  className="text-destructive focus:text-destructive"
                                  onClick={() => onDeleteVisitor(user.id)}
                                >
                                  <Trash2 className="mr-2 h-4 w-4" />
                                  <span>Delete Profile</span>
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                    <TableCell colSpan={5} className="h-24 text-center">
                        No visitors found.
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
