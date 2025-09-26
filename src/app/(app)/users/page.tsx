
'use client';

import { useState, useEffect, useCallback } from 'react';
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
import { getUsers, updateUserRole } from '@/services/userService';
import type { User, UserRole } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

export default function UsersPage() {
  const roles: UserRole[] = ['Admin', 'Manager', 'Security', 'Visitor', 'Worker'];
  const [users, setUsers] = useState<User[]>([]);
  const { toast } = useToast();

  const fetchUsers = useCallback(async () => {
    const usersData = await getUsers();
    setUsers(usersData);
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleRoleChange = (userId: string, newRole: UserRole) => {
    setUsers(prevUsers =>
      prevUsers.map(user =>
        user.id === userId ? { ...user, role: newRole } : user
      )
    );
  };

  const handleSave = async (userId: string) => {
    const user = users.find(u => u.id === userId);
    if (!user) return;
    
    await updateUserRole(userId, user.role);
    await fetchUsers(); // Refresh to confirm save
    
    toast({
      title: 'User Updated',
      description: `${user?.name}'s role has been saved.`,
    });
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
                {users.map((user) => (
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
                      <Button variant="outline" onClick={() => handleSave(user.id)}>Save</Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
