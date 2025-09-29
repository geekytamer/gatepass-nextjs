
'use client';

import React, { useState } from 'react';
import { useEffect } from 'react';
import { useFirebaseApp, useFirestore } from '@/firebase';
import { collection, onSnapshot, doc, updateDoc, addDoc, serverTimestamp } from 'firebase/firestore';
import type { User, UserRole, Certificate, Site } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { UsersTable } from '@/components/users/users-table';
import { NewUserForm } from '@/components/users/new-user-form';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { getAuth, createUserWithEmailAndPassword } from 'firebase/auth';


export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [sites, setSites] = useState<Site[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingSites, setLoadingSites] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const { toast } = useToast();
  const firestore = useFirestore();
  const app = useFirebaseApp();

  useEffect(() => {
    if (!firestore) return;
    setLoading(true);
    const unsubscribe = onSnapshot(collection(firestore, "users"), (snapshot) => {
      const usersData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as User));
      setUsers(usersData);
      setLoading(false);
    });
    
    setLoadingSites(true);
    const sitesUnsub = onSnapshot(collection(firestore, "sites"), (snapshot) => {
        const sitesData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Site));
        setSites(sitesData);
        setLoadingSites(false);
    });

    return () => {
        unsubscribe();
        sitesUnsub();
    }
  }, [firestore]);

  const addUser = async (newUser: Omit<User, 'id' | 'avatarUrl' | 'status'>, password: string) => {
    if (!firestore || !app) {
        toast({ variant: "destructive", title: "Error", description: "Database not available." });
        return;
    }
    const auth = getAuth(app);
    try {
        // Step 1: Create the user in Firebase Authentication
        const userCredential = await createUserWithEmailAndPassword(auth, newUser.email, password);
        const authUser = userCredential.user;

        // Step 2: Create the user document in Firestore with the same UID
        await addDoc(collection(firestore, "users"), {
            ...newUser,
            id: authUser.uid, // Explicitly set the document ID to match the auth UID
            status: 'Inactive',
            avatarUrl: `https://picsum.photos/seed/${Date.now()}/200/200`,
            createdAt: serverTimestamp()
        });

        toast({ title: "User Created", description: `${newUser.name} has been created with an inactive status.` });
        setIsFormOpen(false); // Close the dialog on success
    } catch (error: any) {
        console.error("Error adding user: ", error);
        // Provide more specific feedback for common errors
        if (error.code === 'auth/email-already-in-use') {
            toast({ variant: "destructive", title: "Creation Error", description: "This email address is already in use by another account." });
        } else {
            toast({ variant: "destructive", title: "Creation Error", description: "Could not create user profile." });
        }
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
                <DialogDescription>Enter the user's details below. They will be created with an 'Inactive' status and a temporary password.</DialogDescription>
            </DialogHeader>
            <NewUserForm 
              onNewUser={addUser} 
              sites={sites}
              isLoadingSites={loadingSites}
            />
          </DialogContent>
        </Dialog>
      </header>
       <UsersTable 
          users={users}
          sites={sites}
          isLoading={loading || loadingSites}
        />
    </div>
  );
}
