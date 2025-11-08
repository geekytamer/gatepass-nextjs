
'use client';

import { useState, useEffect } from 'react';
import { useFirestore } from '@/firebase';
import { collection, onSnapshot, addDoc, serverTimestamp } from 'firebase/firestore';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from '@/hooks/use-toast';
import { useAuthProtection } from '@/hooks/use-auth-protection';
import type { Operator, Contractor, User, Site, AccessRequest } from '@/lib/types';
import { OperatorsTable } from '@/components/companies/operators-table';
import { ContractorsTable } from '@/components/companies/contractors-table';
import { NewCompanyForm } from '@/components/companies/new-company-form';

export default function CompaniesPage() {
  const { firestoreUser, loading, isAuthorized, UnauthorizedComponent } = useAuthProtection(['Admin']);
  const [operators, setOperators] = useState<Operator[]>([]);
  const [contractors, setContractors] = useState<Contractor[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [sites, setSites] = useState<Site[]>([]);
  const [requests, setRequests] = useState<AccessRequest[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  
  const { toast } = useToast();
  const firestore = useFirestore();

  useEffect(() => {
    if (!firestore || !firestoreUser) return;
    setLoadingData(true);
    
    const unsubs: (() => void)[] = [];

    unsubs.push(onSnapshot(collection(firestore, "operators"), (snap) => setOperators(snap.docs.map(d => ({...d.data(), id: d.id } as Operator)))));
    unsubs.push(onSnapshot(collection(firestore, "contractors"), (snap) => setContractors(snap.docs.map(d => ({...d.data(), id: d.id } as Contractor)))));
    unsubs.push(onSnapshot(collection(firestore, "users"), (snap) => setUsers(snap.docs.map(d => ({...d.data(), id: d.id } as User)))));
    unsubs.push(onSnapshot(collection(firestore, "sites"), (snap) => setSites(snap.docs.map(d => ({...d.data(), id: d.id } as Site)))));
    unsubs.push(onSnapshot(collection(firestore, "accessRequests"), (snap) => setRequests(snap.docs.map(d => ({...d.data(), id: d.id } as AccessRequest)))));
    
    // A simple way to check when all initial data has loaded
    Promise.all(unsubs).then(() => setLoadingData(false));

    return () => unsubs.forEach(unsub => unsub());
  }, [firestore, firestoreUser]);

  const handleAddCompany = async (name: string, type: 'operator' | 'contractor') => {
    if (!firestore || !name) return;
    try {
      const collectionName = type === 'operator' ? 'operators' : 'contractors';
      await addDoc(collection(firestore, collectionName), {
        name,
        createdAt: serverTimestamp()
      });
      toast({ title: `${type.charAt(0).toUpperCase() + type.slice(1)} Created`, description: `Company "${name}" has been added.` });
    } catch (error) {
      console.error(`Error adding ${type}:`, error);
      toast({ variant: "destructive", title: "Creation Failed", description: `Could not create the new ${type}.` });
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
        <h1 className="text-3xl font-bold tracking-tight">Company Management</h1>
        <p className="text-muted-foreground">Overview of Operator and Contractor companies in the system.</p>
      </header>
      <Tabs defaultValue="operators">
        <TabsList className="grid w-full grid-cols-2 md:w-auto md:max-w-[400px]">
          <TabsTrigger value="operators">Operators</TabsTrigger>
          <TabsTrigger value="contractors">Contractors</TabsTrigger>
        </TabsList>
        <TabsContent value="operators">
            <OperatorsTable
                operators={operators}
                users={users}
                sites={sites}
                isLoading={loadingData}
            />
        </TabsContent>
        <TabsContent value="contractors">
            <ContractorsTable
                contractors={contractors}
                users={users}
                accessRequests={requests}
                isLoading={loadingData}
            />
        </TabsContent>
      </Tabs>
    </div>
  );
}
