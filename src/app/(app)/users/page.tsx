
'use client';

import React, { useState } from 'react';
import { useEffect } from 'react';
import { useFirebaseApp, useFirestore } from '@/firebase';
import { collection, onSnapshot, doc, setDoc, deleteDoc, updateDoc } from 'firebase/firestore';
import type { User, Certificate, Site } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { UsersTable } from '@/components/users/users-table';
import { NewUserForm } from '@/components/users/new-user-form';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { sendEmail } from '@/ai/flows/send-email-flow';
import { deleteUser as deleteUserFlow } from '@/ai/flows/delete-user-flow';
import { createUser as createUserFlow } from '@/ai/flows/create-user-flow';
import { updateUser as updateUserFlow } from '@/ai/flows/update-user-flow';
import { useAuthProtection } from '@/hooks/use-auth-protection';

export default function UsersPage() {
  const { firestoreUser, loading: authLoading, isAuthorized, UnauthorizedComponent } = useAuthProtection(['Admin']);
  const [users, setUsers] = useState<User[]>([]);
  const [sites, setSites] = useState<Site[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingSites, setLoadingSites] = useState(true);
  const [isNewUserFormOpen, setIsNewUserFormOpen] = useState(false);
  const { toast } = useToast();
  const firestore = useFirestore();
  const app = useFirebaseApp();

  useEffect(() => {
    if (!firestore || !firestoreUser) {
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
  }, [firestore, firestoreUser]);

    const generateTempPassword = () => {
        const length = 10;
        const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()';
        let password = '';
        for (let i = 0; i < length; i++) {
            password += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return password;
    }

  const handleAddUser = async (newUser: Omit<User, 'id' | 'avatarUrl' | 'status' | 'idCardImageUrl' >) => {
    if (!firestore) {
        toast({ variant: "destructive", title: "Error", description: "Database not available." });
        return;
    }
    const tempPassword = generateTempPassword();

    try {
        // Step 1: Create the user in Firebase Auth using the server-side flow
        const authResult = await createUserFlow({
            email: newUser.email,
            password: tempPassword,
            displayName: newUser.name,
        });

        if (!authResult.success || !authResult.uid) {
            throw new Error(authResult.error || "Failed to create user in Firebase Auth.");
        }
        
        const authUserUid = authResult.uid;

        // Step 2: Create the user document in Firestore with the UID as the document ID
        const userRef = doc(firestore, "users", authUserUid);
        const userData: Partial<User> = {
            ...newUser,
            id: authUserUid,
            status: 'Inactive', // Set status to Inactive
            avatarUrl: `https://picsum.photos/seed/${Date.now()}/200/200`,
        };
        
        if (newUser.role !== 'Security') {
          delete userData.assignedSiteId;
        } else {
          userData.assignedSiteId = newUser.assignedSiteId;
        }

        await setDoc(userRef, userData);
        
        toast({ title: "User Created", description: `${newUser.name} has been created with an inactive status.` });
        setIsNewUserFormOpen(false); // Close the dialog on success

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
        toast({ 
            variant: "destructive", 
            title: "Creation Error", 
            description: error.message || "Could not create user profile." 
        });
    }
  };

  const handleUpdateUser = async (userId: string, originalUser: User, updatedData: Omit<User, 'id' | 'avatarUrl' >) => {
    if (!firestore) {
      toast({ variant: "destructive", title: "Error", description: "Database not available." });
      return false;
    }

    try {
      const authUpdate: { uid: string, email?: string, displayName?: string } = { uid: userId };
      if (updatedData.email !== originalUser.email) {
        authUpdate.email = updatedData.email;
      }
      if (updatedData.name !== originalUser.name) {
        authUpdate.displayName = updatedData.name;
      }

      if (authUpdate.email || authUpdate.displayName) {
        const authResult = await updateUserFlow(authUpdate);
        if (!authResult.success) {
          throw new Error(authResult.error || "Failed to update user in Firebase Auth.");
        }
      }

      const userRef = doc(firestore, 'users', userId);
      await updateDoc(userRef, updatedData as { [key: string]: any });
      
      toast({ title: "User Updated", description: `${updatedData.name}'s profile has been successfully updated.` });
      return true;

    } catch (error: any) {
      console.error("Error updating user:", error);
      toast({
        variant: "destructive",
        title: "Update Failed",
        description: error.message || "Could not update the user profile.",
      });
      return false;
    }
  };


  const handleDeleteUser = async (userId: string, userName: string) => {
    if (!firestore) return;

    try {
      // Use the Genkit flow to delete the user from Auth
      const result = await deleteUserFlow({ uid: userId });

      if (result.success) {
         // Also delete from Firestore collection
        await deleteDoc(doc(firestore, "users", userId));
        toast({ title: "User Deleted", description: `${userName} has been permanently removed.` });
      } else {
        throw new Error(result.error || 'Failed to delete user from authentication.');
      }
    } catch (error) {
      console.error("Error deleting user: ", error);
      toast({ variant: "destructive", title: "Deletion Failed", description: `Could not delete ${userName}.` });
    }
  };

  if (authLoading || !firestoreUser) {
    return <div>Loading...</div>;
  }
  
  if (!isAuthorized) {
    return <UnauthorizedComponent />;
  }


  return (
    <div className="space-y-4 md:space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">User Management</h1>
          <p className="text-muted-foreground">Create, define, and manage user roles and profiles.</p>
        </div>
        <Dialog open={isNewUserFormOpen} onOpenChange={setIsNewUserFormOpen}>
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
              onNewUser={handleAddUser} 
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
          onDeleteUser={handleDeleteUser}
          onUpdateUser={handleUpdateUser}
        />
    </div>
  );
}
