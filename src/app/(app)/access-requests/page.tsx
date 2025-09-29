
'use client';

import { useState, useEffect, useCallback, useMemo } from "react";
import { collection, onSnapshot, query, where, addDoc, doc, updateDoc, serverTimestamp, getDocs } from "firebase/firestore";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RequestsTable } from "@/components/access-requests/requests-table";
import { NewRequestForm } from "@/components/access-requests/new-request-form";
import type { AccessRequest, Site } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";
import { useAuthProtection } from "@/hooks/use-auth-protection";
import { useFirestore } from "@/firebase";

export default function AccessRequestsPage() {
  const { user: authUser, firestoreUser, loading: authLoading, isAuthorized, UnauthorizedComponent } = useAuthProtection(['Admin', 'Manager', 'Worker']);
  const isManager = useMemo(() => firestoreUser?.role === 'Manager' || firestoreUser?.role === 'Admin', [firestoreUser]);
  const currentUserId = authUser?.uid;
  const firestore = useFirestore();
  const { toast } = useToast();

  const [currentUserRequests, setCurrentUserRequests] = useState<AccessRequest[]>([]);
  const [pendingRequests, setPendingRequests] = useState<AccessRequest[]>([]);
  const [sites, setSites] = useState<Site[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingPending, setLoadingPending] = useState(true);
  const [loadingSites, setLoadingSites] = useState(true);

  useEffect(() => {
    if (!firestore || !currentUserId) return;

    // Fetch sites once
    const fetchSites = async () => {
        setLoadingSites(true);
        try {
            const sitesSnapshot = await getDocs(collection(firestore, "sites"));
            const sitesData = sitesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Site));
            setSites(sitesData);
        } catch (error) {
            console.error("Error fetching sites:", error);
        } finally {
            setLoadingSites(false);
        }
    };
    fetchSites();
    
    setLoading(true);
    const requestsCollection = collection(firestore, "accessRequests");

    // Listener for current user's requests
    const userRequestsQuery = query(requestsCollection, where("userId", "==", currentUserId));
    const unsubscribeUserRequests = onSnapshot(userRequestsQuery, (snapshot) => {
      const userRequests = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as AccessRequest));
      setCurrentUserRequests(userRequests);
      setLoading(false);
    }, (error) => {
        console.error("Error fetching user requests:", error);
        setLoading(false);
    });

    return () => {
      unsubscribeUserRequests();
    };
  }, [firestore, currentUserId]);

  useEffect(() => {
    if (!firestore || !isManager || !currentUserId) {
      setLoadingPending(false);
      return;
    };

    setLoadingPending(true);

    const getManagedSiteIds = async () => {
        let managedSiteIds: string[] = [];
        if (firestoreUser?.role === 'Admin') {
            const sitesSnapshot = await getDocs(collection(firestore, 'sites'));
            managedSiteIds = sitesSnapshot.docs.map(doc => doc.id);
        } else if (firestoreUser?.role === 'Manager') {
            const sitesQuery = query(collection(firestore, 'sites'), where('managerIds', 'array-contains', currentUserId));
            const sitesSnapshot = await getDocs(sitesQuery);
            managedSiteIds = sitesSnapshot.docs.map(doc => doc.id);
        }
        return managedSiteIds;
    };

    const setupPendingRequestsListener = async () => {
        const managerSiteIds = await getManagedSiteIds();

        if (managerSiteIds.length === 0) {
            setPendingRequests([]);
            setLoadingPending(false);
            return;
        }

        const pendingRequestsQuery = query(
          collection(firestore, "accessRequests"), 
          where("status", "==", "Pending"), 
          where("siteId", "in", managerSiteIds)
        );
        
        const unsubscribePendingRequests = onSnapshot(pendingRequestsQuery, (snapshot) => {
          const pending = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as AccessRequest));
          setPendingRequests(pending);
          setLoadingPending(false);
        }, (error) => {
            console.error("Error fetching pending requests:", error);
            setLoadingPending(false);
        });

        return unsubscribePendingRequests;
    }

    let unsubscribe: (() => void) | undefined;
    setupPendingRequestsListener().then(unsub => {
        if (unsub) unsubscribe = unsub;
    });

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    }
  }, [firestore, isManager, firestoreUser, currentUserId]);


  const handleAddRequest = async (newRequest: Omit<AccessRequest, 'id' | 'status' | 'requestedAt'>) => {
     if (!firestore) {
        toast({ variant: "destructive", title: "Error", description: "Database not available." });
        return;
    }
    try {
        await addDoc(collection(firestore, "accessRequests"), {
            ...newRequest,
            status: 'Pending',
            requestedAt: serverTimestamp(),
        });
        // Toast is handled in the form component
    } catch (error) {
        console.error("Error adding request: ", error);
        toast({ variant: "destructive", title: "Submission Error", description: "Could not submit your request." });
    }
  };

  const handleRequestAction = async (requestId: string, newStatus: 'Approved' | 'Denied') => {
    if (!firestore) {
        toast({ variant: "destructive", title: "Error", description: "Database not available." });
        return;
    }
    try {
        const requestRef = doc(firestore, "accessRequests", requestId);
        await updateDoc(requestRef, { status: newStatus });
        toast({ title: `Request ${newStatus}`, description: `The request has been ${newStatus.toLowerCase()}.` });
    } catch (error) {
        console.error(`Error updating request to ${newStatus}:`, error);
        toast({ variant: "destructive", title: "Action Failed", description: "Could not update the request status." });
    }
  }
  
  if (authLoading || !firestoreUser) {
    return <div>Loading...</div>;
  }

  if (!isAuthorized) {
    return <UnauthorizedComponent />;
  }

  return (
    <div className="space-y-4 md:space-y-6">
       <header>
        <h1 className="text-3xl font-bold tracking-tight">Access Requests</h1>
        <p className="text-muted-foreground">Manage, submit, and approve access requests.</p>
      </header>
      <Tabs defaultValue="my-requests">
        <TabsList className={`grid w-full ${isManager ? 'grid-cols-3' : 'grid-cols-2'} md:w-auto`}>
          <TabsTrigger value="my-requests">My Requests</TabsTrigger>
          {firestoreUser.role === 'Worker' && <TabsTrigger value="new-request">New Request</TabsTrigger>}
          {isManager && <TabsTrigger value="new-request">New Request</TabsTrigger>}
          {isManager && <TabsTrigger value="approve">Approve Requests</TabsTrigger>}
        </TabsList>
        <TabsContent value="my-requests">
            <RequestsTable title="My Past Requests" description="A log of your submitted access requests." requests={currentUserRequests} isLoading={loading} />
        </TabsContent>
        {(firestoreUser.role === 'Worker' || isManager) && (
            <TabsContent value="new-request">
                <NewRequestForm 
                currentUserId={currentUserId!} 
                onNewRequest={handleAddRequest}
                sites={sites}
                isLoadingSites={loadingSites}
                />
            </TabsContent>
        )}
        {isManager && (
            <TabsContent value="approve">
                <RequestsTable title="Pending Approval" description="These requests are waiting for your approval." requests={pendingRequests} showActions={true} onAction={handleRequestAction} isLoading={loadingPending} />
            </TabsContent>
        )}
      </Tabs>
    </div>
  );
}
