
'use client';

import React from 'react';
import { useState } from 'react';
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
import type { User, Site, UserStatus } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Paperclip, ShieldCheck, AlertTriangle, Contact, Building, Trash2, MoreHorizontal, Pencil } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { format, isBefore, parseISO } from 'date-fns';
import Image from 'next/image';
import { Badge } from '../ui/badge';
import { EditUserForm } from './edit-user-form';


interface UsersTableProps {
  users: User[];
  sites: Site[];
  isLoading: boolean;
  onDeleteUser: (userId: string, userName: string) => void;
  onUpdateUser: (userId: string, originalUser: User, updatedData: Omit<User, 'id' | 'avatarUrl'>) => Promise<boolean>;
}

export function UsersTable({ users, sites, isLoading, onDeleteUser, onUpdateUser }: UsersTableProps) {
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  const handleEditClick = (user: User) => {
    setSelectedUser(user);
    setIsEditDialogOpen(true);
  };
  
  const isCertificateExpired = (expiryDate?: string) => {
    if (!expiryDate) return false;
    return isBefore(parseISO(expiryDate), new Date());
  };

  const getSiteName = (siteId?: string) => {
    if (!siteId) return 'N/A';
    return sites.find(s => s.id === siteId)?.name || 'Unknown Site';
  }

  const statusColors: Record<UserStatus, string> = {
    'Active': 'bg-green-100 text-green-800',
    'Inactive': 'bg-yellow-100 text-yellow-800',
  }


  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>All Users</CardTitle>
          <CardDescription>A list of all users in the system. You can manage their roles and status here.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead className="hidden sm:table-cell">Details</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  [...Array(5)].map((_, i) => (
                    <TableRow key={i}>
                      <TableCell><div className="flex items-center gap-3"><Skeleton className="h-9 w-9 rounded-full" /><Skeleton className="h-5 w-24" /></div></TableCell>
                      <TableCell className="hidden sm:table-cell"><Skeleton className="h-5 w-48" /></TableCell>
                      <TableCell><Skeleton className="h-5 w-20" /></TableCell>
                      <TableCell><Skeleton className="h-6 w-20 rounded-full" /></TableCell>
                      <TableCell className="text-right"><Skeleton className="h-9 w-9 ml-auto" /></TableCell>
                    </TableRow>
                  ))
                ) : (
                  users.map((user) => (
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
                          {user.idCardImageUrl && (
                            <Dialog>
                                <DialogTrigger asChild>
                                    <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground">
                                        <Contact className="h-4 w-4" />
                                        <span className="sr-only">View ID Card</span>
                                    </Button>
                                </DialogTrigger>
                                <DialogContent>
                                    <DialogHeader>
                                        <DialogTitle>ID Card for {user.name}</DialogTitle>
                                    </DialogHeader>
                                    <div className="mt-4">
                                        <Image src={user.idCardImageUrl} alt={`ID Card for ${user.name}`} width={400} height={250} className="rounded-lg border object-contain w-full h-auto" />
                                    </div>
                                </DialogContent>
                            </Dialog>
                          )}
                           {user.idNumber && (
                                <Dialog>
                                    <DialogTrigger asChild>
                                        <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground">
                                            <Contact className="h-4 w-4" />
                                            <span className="sr-only">View ID Number</span>
                                        </Button>
                                    </DialogTrigger>
                                    <DialogContent className="sm:max-w-md">
                                        <DialogHeader>
                                            <DialogTitle>ID Number for {user.name}</DialogTitle>
                                        </DialogHeader>
                                        <div className="mt-4 p-4 bg-muted rounded-md">
                                          <p className="text-lg font-mono text-center tracking-wider">{user.idNumber}</p>
                                        </div>
                                    </DialogContent>
                                </Dialog>
                            )}
                        </div>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell text-sm text-muted-foreground">
                          <div>{user.email}</div>
                          <div>{user.company || ''}</div>
                          {user.role === 'Security' && user.assignedSiteId && (
                             <Badge variant="outline" className="mt-1 flex items-center w-fit gap-1">
                                 <Building className="h-3 w-3" />
                                 {getSiteName(user.assignedSiteId)}
                             </Badge>
                          )}
                      </TableCell>
                      <TableCell>
                          <Badge variant="secondary">{user.role}</Badge>
                      </TableCell>
                       <TableCell>
                        <Badge className={statusColors[user.status || 'Inactive']}>{user.status || 'Inactive'}</Badge>
                      </TableCell>
                      <TableCell className="text-right">
                         <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                    <MoreHorizontal className="h-4 w-4" />
                                    <span className="sr-only">More actions</span>
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuItem onSelect={() => handleEditClick(user)}>
                                    <Pencil className="mr-2 h-4 w-4" /> Edit
                                </DropdownMenuItem>
                                <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                      <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                                        <Trash2 className="mr-2 h-4 w-4 text-destructive" /> 
                                        <span className="text-destructive">Delete</span>
                                      </DropdownMenuItem>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                      <AlertDialogHeader>
                                        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                                        <AlertDialogDescription>
                                          This action cannot be undone. This will permanently delete the user account for {user.name} and remove all associated data.
                                        </AlertDialogDescription>
                                      </AlertDialogHeader>
                                      <AlertDialogFooter>
                                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                                        <AlertDialogAction onClick={() => onDeleteUser(user.id, user.name)}>
                                          Delete
                                        </AlertDialogAction>
                                      </AlertDialogFooter>
                                    </AlertDialogContent>
                                  </AlertDialog>
                            </DropdownMenuContent>
                         </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-4xl">
          <DialogHeader>
              <DialogTitle>Edit User Profile</DialogTitle>
              <DialogDescription>Update the details for {selectedUser?.name}.</DialogDescription>
          </DialogHeader>
          {selectedUser && (
            <EditUserForm
              user={selectedUser}
              onUpdateUser={onUpdateUser}
              sites={sites}
              isLoadingSites={isLoading}
              closeDialog={() => setIsEditDialogOpen(false)}
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
