
'use client';

import { useState, useEffect } from 'react';
import { useFirestore } from '@/firebase';
import { collection, onSnapshot, query, where, addDoc, deleteDoc, doc, serverTimestamp } from 'firebase/firestore';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { VisitorsTable } from "@/components/visitors/visitors-table";
import { NewVisitorForm } from "@/components/visitors/new-visitor-form";
import type { User } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';

export default function VisitorsPage() {
  const [visitors, setVisitors] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const firestore = useFirestore();

  useEffect(() => {
    if (!firestore) return;
    setLoading(true);

    const usersCollection = collection(firestore, "users");
    const visitorsQuery = query(usersCollection, where("role", "in", ["Visitor", "Worker"]));

    const unsubscribe = onSnapshot(visitorsQuery, (snapshot) => {
        const visitorsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as User));
        setVisitors(visitorsData);
        setLoading(false);
    });

    return () => unsubscribe();
  }, [firestore]);

  const addVisitor = async (newVisitor: Omit<User, 'id' | 'avatarUrl'>) => {
    if (!firestore) {
        toast({ variant: "destructive", title: "Error", description: "Database not available." });
        return;
    }
    try {
        await addDoc(collection(firestore, "users"), {
            ...newVisitor,
            avatarUrl: `https://picsum.photos/seed/${Date.now()}/200/200`,
            createdAt: serverTimestamp()
        });
         toast({ title: "Profile Created", description: `A new profile for ${newVisitor.name} has been created.` });
    } catch (error) {
        console.error("Error adding visitor: ", error);
        toast({ variant: "destructive", title: "Creation Error", description: "Could not create visitor profile." });
    }
  };

  const deleteVisitor = async (visitorId: string) => {
    if (!firestore) {
        toast({ variant: "destructive", title: "Error", description: "Database not available." });
        return;
    }
    try {
        await deleteDoc(doc(firestore, "users", visitorId));
        toast({
            title: 'Visitor Deleted',
            description: 'The visitor profile has been removed.',
        });
    } catch (error) {
        console.error("Error deleting visitor:", error);
        toast({
            title: 'Deletion Failed',
            description: 'Could not remove the visitor profile.',
            variant: 'destructive',
        });
    }
  }

  return (
    <div className="space-y-4 md:space-y-6">
       <header>
        <h1 className="text-3xl font-bold tracking-tight">Visitor Management</h1>
        <p className="text-muted-foreground">Manage profiles for visitors and workers.</p>
      </header>
       <VisitorsTable visitors={visitors} onDeleteVisitor={deleteVisitor} isLoading={loading}/>
    </div>
  );
}
