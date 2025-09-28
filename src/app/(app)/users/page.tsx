
'use client';

import React, { useState } from 'react';
import { useEffect } from 'react';
import { useFirestore } from '@/firebase';
import { collection, onSnapshot, doc, updateDoc, addDoc, serverTimestamp } from 'firebase/firestore';
import type { User, UserRole, Certificate } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { UsersTable } from '@/components/users/users-table';
import { NewUserForm } from '@/components/users/new-user-form';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';


export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
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
         setIsFormOpen(false); // Close the dialog on success
    } catch (error) {
        console.error("Error adding user: ", error);
        toast({ variant: "destructive", title: "Creation Error", description: "Could not create user profile." });
    }
  };


  return (
    <div className="space-y-4 md:space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">User Management</h1>
          <p className="text-muted-foreground">Create, define, and manage user roles and profiles.</p>
        </div>
        <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
          <DialogTrigger asChild>
             <Button>
              <Plus className="mr-2 h-4 w-4" />
              Create User
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-4xl">
            <DialogHeader>
                <DialogTitle>Create New User Profile</DialogTitle>
                <DialogDescription>Enter the user's details below to create a new profile.</DialogDescription>
            </DialogHeader>
            <NewUserForm onNewUser={addUser} />
          </DialogContent>
        </Dialog>
      </header>
       <UsersTable 
          users={users} 
          isLoading={loading}
        />
    </div>
  );
}
