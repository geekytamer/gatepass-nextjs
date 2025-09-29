
'use client';

import { useState, useEffect, useCallback } from "react";
import { collection, onSnapshot, query, where, addDoc, doc, updateDoc, serverTimestamp, getDocs } from "firebase/firestore";
import { useFirestore } from "@/firebase";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RequestsTable } from "@/components/access-requests/requests-table";
import { NewRequestForm } from "@/components/access-requests/new-request-form";
import type { AccessRequest, Site } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";

export default function AccessRequestsPage() {
  const isManager = true; 
  const currentUserId = 'usr_001'; // Assuming this is the current logged-in user. In a real app, this would come from auth.
  const firestore = useFirestore();
  const { toast } = useToast();

  const [currentUserRequests, setCurrentUserRequests] = useState<AccessRequest[]>([]);
  const [pendingRequests, setPendingRequests] = useState<AccessRequest[]>([]);
  const [sites, setSites] = useState<Site[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingPending, setLoadingPending] = useState(true);
  const [loadingSites, setLoadingSites] = useState(true);

  useEffect(() => {
    if (!firestore) return;

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
    if (!firestore || !isManager || sites.length === 0) {
      if(isManager) setLoadingPending(false);
      return;
    };

    const managerSiteIds = sites.filter(s => s.managerIds.includes(currentUserId)).map(s => s.id);

    if (managerSiteIds.length === 0) {
      setLoadingPending(false);
      return;
    }

    setLoadingPending(true);
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

    return () => {
      unsubscribePendingRequests();
    }
  }, [firestore, isManager, sites, currentUserId])


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

  return (
    <div className="space-y-4 md:space-y-6">
       <header>
        <h1 className="text-3xl font-bold tracking-tight">Access Requests</h1>
        <p className="text-muted-foreground">Manage, submit, and approve access requests.</p>
      </header>
      <Tabs defaultValue="my-requests">
        <TabsList className="grid w-full grid-cols-2 md:w-auto md:grid-cols-3">
          <TabsTrigger value="my-requests">My Requests</TabsTrigger>
          <TabsTrigger value="new-request">New Request</TabsTrigger>
          {isManager && <TabsTrigger value="approve">Approve Requests</TabsTrigger>}
        </TabsList>
        <TabsContent value="my-requests">
            <RequestsTable title="My Past Requests" description="A log of your submitted access requests." requests={currentUserRequests} isLoading={loading} />
        </TabsContent>
        <TabsContent value="new-request">
            <NewRequestForm 
              currentUserId={currentUserId} 
              onNewRequest={handleAddRequest}
              sites={sites}
              isLoadingSites={loadingSites}
            />
        </TabsContent>
        {isManager && (
            <TabsContent value="approve">
                <RequestsTable title="Pending Approval" description="These requests are waiting for your approval." requests={pendingRequests} showActions={true} onAction={handleRequestAction} isLoading={loadingPending} />
            </TabsContent>
        )}
      </Tabs>
    </div>
  );
}
