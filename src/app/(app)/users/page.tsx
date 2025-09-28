
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
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { User, UserRole } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { Paperclip, ShieldCheck, Download, AlertTriangle } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { format, isBefore, parseISO } from 'date-fns';

export default function UsersPage() {
  const roles: UserRole[] = ['Admin', 'Manager', 'Security', 'Visitor', 'Worker'];
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [originalUsers, setOriginalUsers] = useState<User[]>([]);
  const { toast } = useToast();
  const firestore = useFirestore();

  useEffect(() => {
    if (!firestore) return;
    setLoading(true);
    const unsubscribe = onSnapshot(collection(firestore, "users"), (snapshot) => {
      const usersData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as User));
      setUsers(usersData);
      setOriginalUsers(usersData);
      setLoading(false);
    });
    return () => unsubscribe();
  }, [firestore]);

  const handleRoleChange = (userId: string, newRole: UserRole) => {
    setUsers(prevUsers =>
      prevUsers.map(user =>
        user.id === userId ? { ...user, role: newRole } : user
      )
    );
  };

  const handleSave = async (userId: string) => {
    if (!firestore) return;

    const userToSave = users.find(u => u.id === userId);
    if (!userToSave) return;
    
    try {
      const userRef = doc(firestore, "users", userId);
      await updateDoc(userRef, { role: userToSave.role });
      
      toast({
        title: 'User Updated',
        description: `${userToSave.name}'s role has been saved.`,
      });
    } catch(error) {
      console.error("Error updating user role:", error);
      toast({
        title: 'Update Failed',
        description: `Could not update ${userToSave.name}'s role.`,
        variant: 'destructive',
      });
      // Revert change on UI if save fails
      setUsers(originalUsers);
    }
  };

  const isRoleChanged = (userId: string) => {
    const originalUser = originalUsers.find(u => u.id === userId);
    const currentUser = users.find(u => u.id === userId);
    return originalUser && currentUser && originalUser.role !== currentUser.role;
  }
  
  const isCertificateExpired = (expiryDate?: string) => {
    if (!expiryDate) return false;
    return isBefore(parseISO(expiryDate), new Date());
  };

  return (
    <div className="space-y-4 md:space-y-6">
      <header>
        <h1 className="text-3xl font-bold tracking-tight">User Management</h1>
        <p className="text-muted-foreground">Define and manage user roles and permissions.</p>
      </header>
      <Card>
        <CardHeader>
          <CardTitle>All Users</CardTitle>
          <CardDescription>A list of all users in the system.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead className="hidden sm:table-cell">Email</TableHead>
                  <TableHead className="hidden md:table-cell">Company</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  [...Array(5)].map((_, i) => (
                    <TableRow key={i}>
                      <TableCell><div className="flex items-center gap-3"><Skeleton className="h-9 w-9 rounded-full" /><Skeleton className="h-5 w-24" /></div></TableCell>
                      <TableCell className="hidden sm:table-cell"><Skeleton className="h-5 w-32" /></TableCell>
                      <TableCell className="hidden md:table-cell"><Skeleton className="h-5 w-20" /></TableCell>
                      <TableCell><Skeleton className="h-9 w-[120px]" /></TableCell>
                      <TableCell className="text-right"><Skeleton className="h-9 w-16 ml-auto" /></TableCell>
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
                                <DialogContent className="max-w-3xl">
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
                                                    {cert.expiryDate && (
                                                        <CardDescription className={isExpired ? "text-destructive font-semibold" : ""}>
                                                            Expires: {format(parseISO(cert.expiryDate), 'PPP')}
                                                        </CardDescription>
                                                    )}
                                                 </div>
                                                 {isExpired && <AlertTriangle className="h-5 w-5 text-destructive" />}
                                              </CardHeader>
                                              <CardContent>
                                                 {cert.fileDataUrl.startsWith('data:image') && <img src={cert.fileDataUrl} alt={cert.name} className="max-h-[50vh] w-auto mx-auto rounded border"/>}
                                                 {cert.fileDataUrl.startsWith('data:application/pdf') && <iframe src={cert.fileDataUrl} className="w-full h-[50vh] rounded border" title={cert.name}/>}
                                              </CardContent>
                                               <CardFooter>
                                                    <Button asChild variant="outline" className="w-full">
                                                        <a href={cert.fileDataUrl} download={`${user.name.replace(' ', '_')}_${cert.name.replace(' ', '_')}`}>
                                                            <Download className="mr-2 h-4 w-4" />
                                                            Download
                                                        </a>
                                                    </Button>
                                                </CardFooter>
                                            </Card>
                                        )})}
                                    </div>
                                </DialogContent>
                            </Dialog>
                         )}
                        </div>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell">{user.email}</TableCell>
                      <TableCell className="hidden md:table-cell">{user.company || 'N/A'}</TableCell>
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
                      <TableCell className="text-right">
                        <Button variant="outline" onClick={() => handleSave(user.id)} disabled={!isRoleChanged(user.id)}>
                          Save
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
