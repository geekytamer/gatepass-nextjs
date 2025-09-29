
'use client';

import React, { useState } from 'react';
import { useEffect } from 'react';
import { useFirebaseApp, useFirestore } from '@/firebase';
import { collection, onSnapshot, doc, setDoc } from 'firebase/firestore';
import type { User, UserRole, Certificate, Site } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { UsersTable } from '@/components/users/users-table';
import { NewUserForm } from '@/components/users/new-user-form';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { getAuth, createUserWithEmailAndPassword } from 'firebase/auth';
import { sendEmail } from '@/ai/flows/send-email-flow';


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
    if (!firestore) {
        setLoading(false);
        setLoadingSites(false);
        return;
    };
    
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

    const generateTempPassword = () => {
        const length = 10;
        const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()';
        let password = '';
        for (let i = 0; i < length; i++) {
            password += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return password;
    }

  const addUser = async (newUser: Omit<User, 'id' | 'avatarUrl' | 'status' | 'idCardImageUrl' >) => {
    if (!firestore || !app) {
        toast({ variant: "destructive", title: "Error", description: "Database not available." });
        return;
    }
    const auth = getAuth(app);
    const tempPassword = generateTempPassword();

    try {
        // Step 1: Create the user in Firebase Authentication
        const userCredential = await createUserWithEmailAndPassword(auth, newUser.email, tempPassword);
        const authUser = userCredential.user;

        // Step 2: Create the user document in Firestore with the UID as the document ID
        const userRef = doc(firestore, "users", authUser.uid);
        const userData: Omit<User, 'id'> & { id: string } = {
            ...newUser,
            id: authUser.uid,
            status: 'Inactive', // Set status to Inactive
            avatarUrl: `https://picsum.photos/seed/${Date.now()}/200/200`,
        };
        
        if (newUser.role !== 'Security') {
          delete userData.assignedSiteId;
        }

        await setDoc(userRef, userData);
        
        toast({ title: "User Created", description: `${newUser.name} has been created with an inactive status.` });
        setIsFormOpen(false); // Close the dialog on success

        // Step 3: Send the welcome email with the temporary password
        const emailResult = await sendEmail({
            to: newUser.email,
            subject: 'Welcome to GatePass - Your Account has been Created',
            body: `
                <h1>Welcome to GatePass, ${newUser.name}!</h1>
                <p>An administrator has created an account for you.</p>
                <p>Your temporary password is: <strong>${tempPassword}</strong></p>
                <p>Please log in and change your password immediately to activate your account.</p>
            `,
        });

        if (emailResult.success) {
            toast({ title: 'Welcome Email Sent', description: `Instructions have been sent to ${newUser.email}.` });
        } else {
             toast({ variant: "destructive", title: "Email Failed", description: `Could not send welcome email. Please provide the user their temporary password manually: ${tempPassword}` });
        }

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
                <DialogDescription>Enter the user's details below. An email will be sent to them with a temporary password.</DialogDescription>
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
