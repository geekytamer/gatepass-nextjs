
"use client";

import React, { useState, useEffect } from "react";
import { useFirestore } from "@/firebase";
import {
  collection,
  onSnapshot,
  doc,
  setDoc,
  deleteDoc,
  updateDoc,
} from "firebase/firestore";
import type { User, Site, Contractor, Operator } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";
import { UsersTable } from "@/components/users/users-table";
import { NewUserForm } from "@/components/users/new-user-form";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { sendEmail } from "@/ai/flows/send-email-flow";
import {
  serverCreateUser,
  serverUpdateUser,
  serverDeleteUser,
} from "@/app/actions/userActions";
import { useAuthProtection } from "@/hooks/use-auth-protection";

export default function UsersPage() {
  const {
    firestoreUser,
    loading: authLoading,
    isAuthorized,
    UnauthorizedComponent,
  } = useAuthProtection(["Admin"]);
  const [users, setUsers] = useState<User[]>([]);
  const [sites, setSites] = useState<Site[]>([]);
  const [contractors, setContractors] = useState<Contractor[]>([]);
  const [operators, setOperators] = useState<Operator[]>([]);
  const [loading, setLoading] = useState(true);
  const [isNewUserFormOpen, setIsNewUserFormOpen] = useState(false);
  const { toast } = useToast();
  const firestore = useFirestore();

  useEffect(() => {
    if (!firestore || !firestoreUser) {
      setLoading(false);
      return;
    }
    setLoading(true);
    
    const unsubs: (() => void)[] = [];

    unsubs.push(onSnapshot(collection(firestore, "users"), (snapshot) => {
        const usersData = snapshot.docs.map(
          (doc) => ({ id: doc.id, ...doc.data() } as User)
        );
        setUsers(usersData);
        setLoading(false);
    }));

    unsubs.push(onSnapshot(collection(firestore, "sites"), (snapshot) => {
        const sitesData = snapshot.docs.map(
          (doc) => ({ id: doc.id, ...doc.data() } as Site)
        );
        setSites(sitesData);
    }));
    
    unsubs.push(onSnapshot(collection(firestore, "contractors"), (snapshot) => {
        const contractorsData = snapshot.docs.map(
          (doc) => ({ id: doc.id, ...doc.data() } as Contractor)
        );
        setContractors(contractorsData);
    }));

    unsubs.push(onSnapshot(collection(firestore, "operators"), (snapshot) => {
        const operatorsData = snapshot.docs.map(
          (doc) => ({ id: doc.id, ...doc.data() } as Operator)
        );
        setOperators(operatorsData);
    }));

    return () => unsubs.forEach(unsub => unsub());
  }, [firestore, firestoreUser]);

  const generateTempPassword = () => {
    return Math.random().toString(36).slice(-8);
  };

  const handleAddUser = async (
    newUser: Omit<
      User,
      "id" | "avatarUrl" | "status" | "idCardImageUrl" | "idNumber"
    >
  ) => {
    if (!firestore) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Database not available.",
      });
      return;
    }
    const tempPassword = generateTempPassword();

    try {
      const authResult = await serverCreateUser({
        email: newUser.email!,
        password: tempPassword,
        displayName: newUser.name,
      });

      if (!authResult.success || !authResult.uid) {
        throw new Error(
          authResult.error || "Failed to create user in Firebase Auth."
        );
      }

      const authUserUid = authResult.uid;
      const userRef = doc(firestore, "users", authUserUid);
      const userData: Partial<User> = {
        ...newUser,
        id: authUserUid,
        status: "Inactive",
        avatarUrl: `https://picsum.photos/seed/${Date.now()}/200/200`,
      };

      await setDoc(userRef, userData);

      toast({
        title: "User Created",
        description: `${newUser.name} has been created with an inactive status.`,
      });
      setIsNewUserFormOpen(false);

      if (newUser.role !== 'Visitor') {
        const emailResult = await sendEmail({
          to: newUser.email!,
          subject: "Welcome to GatePass - Your Account has been Created",
          body: `<h1>Welcome, ${newUser.name}!</h1><p>An account has been created for you.</p><p>Your temporary password is: <strong>${tempPassword}</strong></p><p>Please log in and change your password to activate your account.</p>`,
        });

        if (emailResult.success) {
          toast({
            title: "Welcome Email Sent",
            description: `Instructions have been sent to ${newUser.email}.`,
          });
        } else {
          toast({
            variant: "destructive",
            title: "Email Failed",
            description: `Could not send welcome email. Please provide the temporary password manually: ${tempPassword}`,
          });
        }
      }
    } catch (error: any) {
      console.error("Error adding user: ", error);
      toast({
        variant: "destructive",
        title: "Creation Error",
        description: error.message || "Could not create user profile.",
      });
    }
  };

 const handleUpdateUser = async (
    userId: string,
    originalUser: User,
    updatedData: Omit<User, "id" | "avatarUrl">
  ) => {
    if (!firestore) {
      toast({ variant: "destructive", title: "Error", description: "Database not available." });
      return false;
    }

    try {
      if (updatedData.email && updatedData.email !== originalUser.email) {
        await serverUpdateUser({ uid: userId, email: updatedData.email });
      }
      if (updatedData.name !== originalUser.name) {
        await serverUpdateUser({ uid: userId, displayName: updatedData.name });
      }

      const userRef = doc(firestore, "users", userId);
      await updateDoc(userRef, updatedData as { [key: string]: any });

      toast({ title: "User Updated", description: `${updatedData.name}'s profile has been updated.` });
      return true;
    } catch (error: any) {
      console.error("Error updating user:", error);
      toast({ variant: "destructive", title: "Update Failed", description: error.message || "Could not update user." });
      return false;
    }
  };


  const handleDeleteUser = async (userId: string, userName: string) => {
    if (!firestore) return;

    try {
      const result = await serverDeleteUser({ uid: userId });
      if (result.success) {
        await deleteDoc(doc(firestore, "users", userId));
        toast({
          title: "User Deleted",
          description: `${userName} has been permanently removed.`,
        });
      } else {
        throw new Error(
          result.error || "Failed to delete user from authentication."
        );
      }
    } catch (error: any) {
      console.error("Error deleting user: ", error);
      toast({
        variant: "destructive",
        title: "Deletion Failed",
        description: error.message || `Could not delete ${userName}.`,
      });
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
          <h1 className="text-3xl font-bold tracking-tight">Personnel Management</h1>
          <p className="text-muted-foreground">
            Manage personnel from operators, contractors, and visitors.
          </p>
        </div>
        <Dialog open={isNewUserFormOpen} onOpenChange={setIsNewUserFormOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Create User
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-full sm:max-w-2xl w-[95vw] sm:w-auto max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create New User Profile</DialogTitle>
              <DialogDescription>
                Enter the user's details. An email will be sent with a temporary password.
              </DialogDescription>
            </DialogHeader>
            <NewUserForm
              onNewUser={handleAddUser}
              sites={sites}
              contractors={contractors}
              operators={operators}
              isLoading={loading}
            />
          </DialogContent>
        </Dialog>
      </header>
      <UsersTable
        users={users}
        sites={sites}
        contractors={contractors}
        operators={operators}
        isLoading={loading}
        onDeleteUser={handleDeleteUser}
        onUpdateUser={handleUpdateUser}
      />
    </div>
  );
}
