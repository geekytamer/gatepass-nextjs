
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
  const { firestoreUser, loading, isAuthorized, UnauthorizedComponent } = useAuthProtection(['Admin']);
  const [sites, setSites] = useState<Site[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [certificateTypes, setCertificateTypes] = useState<CertificateType[]>([]);
  const [loadingSites, setLoadingSites] = useState(true);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [loadingCerts, setLoadingCerts] = useState(true);
  const { toast } = useToast();
  const firestore = useFirestore();

  useEffect(() => {
    if (!firestore || !firestoreUser) return;

    setLoadingSites(true);
    const sitesUnsub = onSnapshot(collection(firestore, "sites"), (snapshot) => {
        const sitesData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Site));
        setSites(sitesData);
        setLoadingSites(false);
    });

    setLoadingUsers(true);
    const usersUnsub = onSnapshot(collection(firestore, "users"), (snapshot) => {
        const usersData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as User));
        setUsers(usersData);
        setLoadingUsers(false);
    });

    setLoadingCerts(true);
    const certsUnsub = onSnapshot(collection(firestore, "certificateTypes"), (snapshot) => {
        const certsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as CertificateType));
        setCertificateTypes(certsData);
        setLoadingCerts(false);
    });

    return () => {
      sitesUnsub();
      usersUnsub();
      certsUnsub();
    };
  }, [firestore, firestoreUser]);

  const handleAddSite = async (newSite: Omit<Site, 'id'>) => {
    if (!firestore) {
        toast({ variant: "destructive", title: "Error", description: "Database not available." });
        return;
    }
    try {
        await addDoc(collection(firestore, "sites"), {
            ...newSite,
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
      return;
    }
    try {
      const siteRef = doc(firestore, 'sites', siteId);
      await updateDoc(siteRef, updatedData);
      toast({ title: "Site Updated", description: `The site "${updatedData.name}" has been updated.` });
    } catch (error) {
      console.error("Error updating site:", error);
      toast({ variant: "destructive", title: "Update Error", description: "Could not update the site." });
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
              isLoading={loadingSites || loadingUsers || loadingCerts}
              onUpdateSite={handleUpdateSite}
            />
        </TabsContent>
        <TabsContent value="new-site">
            <NewSiteForm 
              onNewSite={handleAddSite}
              users={users}
              certificateTypes={certificateTypes}
              isLoadingUsers={loadingUsers}
              isLoadingCerts={loadingCerts}
            />
        </TabsContent>
      </Tabs>
    </div>
  );
}
