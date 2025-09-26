
'use client';

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
import type { User, UserRole } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';

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

