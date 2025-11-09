
'use client';

import { useState, useEffect } from 'react';
import { useFirestore } from '@/firebase';
import { collection, onSnapshot, addDoc, doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SitesTable } from "@/components/sites/sites-table";
import { NewSiteForm } from "@/components/sites/new-site-form";
import type { Site, User, CertificateType } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { useAuthProtection } from '@/hooks/use-auth-protection';

export default function SitesPage() {
  const { firestoreUser, loading, isAuthorized, UnauthorizedComponent } = useAuthProtection(['Admin', 'Operator Admin']);
  const [sites, setSites] = useState<Site[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [certificateTypes, setCertificateTypes] = useState<CertificateType[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const { toast } = useToast();
  const firestore = useFirestore();

  useEffect(() => {
    if (!firestore || !firestoreUser) return;

    setLoadingData(true);
    const sitesUnsub = onSnapshot(collection(firestore, "sites"), (snapshot) => {
        const sitesData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Site));
        setSites(sitesData);
    });

    const usersUnsub = onSnapshot(collection(firestore, "users"), (snapshot) => {
        const usersData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as User));
        setUsers(usersData);
    });

    const certsUnsub = onSnapshot(collection(firestore, "certificateTypes"), (snapshot) => {
        const certsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as CertificateType));
        setCertificateTypes(certsData);
    });

    // Use Promise.all to set loading to false after initial fetches
     const initialFetches = Promise.all([
        new Promise(resolve => onSnapshot(collection(firestore, "sites"), () => resolve(true), () => resolve(true))),
        new Promise(resolve => onSnapshot(collection(firestore, "users"), () => resolve(true), () => resolve(true))),
        new Promise(resolve => onSnapshot(collection(firestore, "certificateTypes"), () => resolve(true), () => resolve(true))),
     ]);
     
     initialFetches.then(() => setLoadingData(false));


    return () => {
      sitesUnsub();
      usersUnsub();
      certsUnsub();
    };
  }, [firestore, firestoreUser]);

  const handleAddSite = async (newSite: Omit<Site, 'id' | 'operatorId'>) => {
    if (!firestore || !firestoreUser?.operatorId) {
        toast({ variant: "destructive", title: "Error", description: "Database not available or you are not assigned to an operator." });
        return;
    }
    try {
        await addDoc(collection(firestore, "sites"), {
            ...newSite,
            operatorId: firestoreUser.operatorId,
            createdAt: serverTimestamp()
        });
         toast({ title: "Site Created", description: `The site "${newSite.name}" has been created.` });
    } catch (error) {
        console.error("Error adding site: ", error);
        toast({ variant: "destructive", title: "Creation Error", description: "Could not create the new site." });
    }
  };

  const handleUpdateSite = async (siteId: string, updatedData: Partial<Omit<Site, 'id'>>) => {
    if (!firestore) {
      toast({ variant: "destructive", title: "Error", description: "Database not available." });
      return false;
    }
    try {
      const siteRef = doc(firestore, 'sites', siteId);
      await updateDoc(siteRef, updatedData);
      toast({ title: "Site Updated", description: `The site has been updated.` });
      return true;
    } catch (error) {
      console.error("Error updating site:", error);
      toast({ variant: "destructive", title: "Update Error", description: "Could not update the site." });
      return false;
    }
  };

  if (loading || !firestoreUser) {
    return <div>Loading...</div>;
  }

  if (!isAuthorized) {
    return <UnauthorizedComponent />;
  }
  
  return (
    <div className="space-y-4 md:space-y-6">
       <header>
        <h1 className="text-3xl font-bold tracking-tight">Site Management</h1>
        <p className="text-muted-foreground">Create, view, and manage all operational sites.</p>
      </header>
      <Tabs defaultValue="site-list">
        <TabsList className="grid w-full grid-cols-2 md:w-auto md:max-w-[400px]">
          <TabsTrigger value="site-list">Site List</TabsTrigger>
          <TabsTrigger value="new-site">New Site</TabsTrigger>
        </TabsList>
        <TabsContent value="site-list">
            <SitesTable 
              sites={sites} 
              users={users}
              certificateTypes={certificateTypes}
              isLoading={loadingData}
              onUpdateSite={handleUpdateSite}
            />
        </TabsContent>
        <TabsContent value="new-site">
            <NewSiteForm 
              onNewSite={handleAddSite}
              users={users}
              certificateTypes={certificateTypes}
              isLoadingUsers={loadingData}
              isLoadingCerts={loadingData}
            />
        </TabsContent>
      </Tabs>
    </div>
  );
}
