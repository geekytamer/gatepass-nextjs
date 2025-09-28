
'use client';

import React from 'react';
import { useState, useEffect } from 'react';
import { useFirestore } from '@/firebase';
import { collection, onSnapshot, doc, updateDoc, addDoc, serverTimestamp } from 'firebase/firestore';
import type { User, UserRole, Certificate } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { UsersTable } from '@/components/users/users-table';
import { NewUserForm } from '@/components/users/new-user-form';


export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const firestore = useFirestore();

  useEffect(() => {
    if (!firestore) return;
    setLoading(true);
    const unsubscribe = onSnapshot(collection(firestore, "users"), (snapshot) => {
      const usersData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as User));
      setUsers(usersData);
      setLoading(false);
    });
    return () => unsubscribe();
  }, [firestore]);

  const addUser = async (newUser: Omit<User, 'id' | 'avatarUrl'>) => {
    if (!firestore) {
        toast({ variant: "destructive", title: "Error", description: "Database not available." });
        return;
    }
    try {
        await addDoc(collection(firestore, "users"), {
            ...newUser,
            avatarUrl: `https://picsum.photos/seed/${Date.now()}/200/200`,
            createdAt: serverTimestamp()
        });
         toast({ title: "User Created", description: `A new profile for ${newUser.name} has been created.` });
    } catch (error) {
        console.error("Error adding user: ", error);
        toast({ variant: "destructive", title: "Creation Error", description: "Could not create user profile." });
    }
  };


  return (
    <div className="space-y-4 md:space-y-6">
      <header>
        <h1 className="text-3xl font-bold tracking-tight">User Management</h1>
        <p className="text-muted-foreground">Create, define, and manage user roles and profiles.</p>
      </header>
       <Tabs defaultValue="user-list">
        <TabsList className="grid w-full grid-cols-2 md:w-auto md:max-w-[400px]">
          <TabsTrigger value="user-list">All Users</TabsTrigger>
          <TabsTrigger value="new-user">New User</TabsTrigger>
        </TabsList>
        <TabsContent value="user-list">
           <UsersTable 
              users={users} 
              isLoading={loading}
            />
        </TabsContent>
        <TabsContent value="new-user">
            <NewUserForm onNewUser={addUser} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

