
'use client';

import React from 'react';
import { useState, useEffect } from 'react';
import { useFirestore } from '@/firebase';
import { collection, onSnapshot, doc, updateDoc } from 'firebase/firestore';
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { User, UserRole, Site, UserStatus } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { Paperclip, ShieldCheck, AlertTriangle, Contact, Building, Trash2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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

interface UsersTableProps {
  users: User[];
  sites: Site[];
  isLoading: boolean;
  onDeleteUser: (userId: string, userName: string) => void;
}

export function UsersTable({ users, sites, isLoading, onDeleteUser }: UsersTableProps) {
  const roles: UserRole[] = ['Admin', 'Manager', 'Security', 'Visitor', 'Worker'];
  const [userList, setUserList] = useState<User[]>([]);
  const [originalUsers, setOriginalUsers] = useState<User[]>([]);
  const { toast } = useToast();
  const firestore = useFirestore();

  useEffect(() => {
      setUserList(users);
      setOriginalUsers(users);
  }, [users])

  const handleRoleChange = (userId: string, newRole: UserRole) => {
    setUserList(prevUsers =>
      prevUsers.map(user =>
        user.id === userId ? { ...user, role: newRole } : user
      )
    );
  };
  
  const handleStatusChange = (userId: string, newStatus: UserStatus) => {
    setUserList(prevUsers =>
      prevUsers.map(user =>
        user.id === userId ? { ...user, status: newStatus } : user
      )
    );
  };

  const handleSave = async (userId: string) => {
    if (!firestore) return;

    const userToSave = userList.find(u => u.id === userId);
    if (!userToSave) return;
    
    try {
      const userRef = doc(firestore, "users", userId);
      // We only allow role and status changes from this table for now. 
      await updateDoc(userRef, { 
        role: userToSave.role,
        status: userToSave.status
       });
      
      toast({
        title: 'User Updated',
        description: `${userToSave.name}'s profile has been saved.`,
      });
      setOriginalUsers(prev => prev.map(u => u.id === userId ? userToSave : u));
    } catch(error) {
      console.error("Error updating user profile:", error);
      toast({
        title: 'Update Failed',
        description: `Could not update ${userToSave.name}'s profile.`,
        variant: 'destructive',
      });
      setUserList(originalUsers);
    }
  };

  const isChanged = (userId: string) => {
    const originalUser = originalUsers.find(u => u.id === userId);
    const currentUser = userList.find(u => u.id === userId);
    return originalUser && currentUser && (originalUser.role !== currentUser.role || originalUser.status !== currentUser.status);
  }
  
  const isCertificateExpired = (expiryDate?: string) => {
    if (!expiryDate) return false;
    return isBefore(parseISO(expiryDate), new Date());
  };

  const getSiteName = (siteId?: string) => {
    if (!siteId) return 'N/A';
    return sites.find(s => s.id === siteId)?.name || 'Unknown Site';
  }

  const statusColorClasses: Record<UserStatus, string> = {
    Active: 'bg-green-500/20 text-green-700 border-transparent hover:bg-green-500/30',
    Inactive: 'bg-yellow-500/20 text-yellow-700 border-transparent hover:bg-yellow-500/30',
  };


  return (
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
                    <TableCell><Skeleton className="h-9 w-[120px]" /></TableCell>
                    <TableCell><Skeleton className="h-9 w-[120px]" /></TableCell>
                    <TableCell className="text-right"><Skeleton className="h-9 w-16 ml-auto" /></TableCell>
                  </TableRow>
                ))
              ) : (
                userList.map((user) => (
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
                      <Select value={user.role} onValueChange={(newRole: UserRole) => handleRoleChange(user.id, newRole)}>
                        <SelectTrigger className="w-[120px]">
                          <SelectValue placeholder="Select role" />
                        </SelectTrigger>
                        <SelectContent>
                          {roles.map(role => (
                            <SelectItem key={role} value={role}>{role}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TableCell>
                     <TableCell>
                      <Select value={user.status} onValueChange={(newStatus: UserStatus) => handleStatusChange(user.id, newStatus)}>
                        <SelectTrigger className="w-[120px]">
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                        <SelectContent>
                           <SelectItem value="Active">Active</SelectItem>
                           <SelectItem value="Inactive">Inactive</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell className="text-right space-x-2">
                      <Button variant="outline" size="sm" onClick={() => handleSave(user.id)} disabled={!isChanged(user.id)}>
                        Save
                      </Button>
                       <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="destructive" size="icon" className="h-9 w-9">
                              <Trash2 className="h-4 w-4" />
                            </Button>
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
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
