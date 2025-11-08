
'use client';

import { useState, useEffect, useMemo } from "react";
import { collection, onSnapshot, query, where, updateDoc, doc, getDocs } from "firebase/firestore";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RequestsTable } from "@/components/access-requests/requests-table";
import { SupervisorRequestForm } from "@/components/access-requests/supervisor-request-form";
import type { AccessRequest, Site, Operator, Contractor } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";
import { useAuthProtection } from "@/hooks/use-auth-protection";
import { useFirestore } from "@/firebase";
import { ApprovalDialog } from "@/components/access-requests/approval-dialog";

export default function AccessRequestsPage() {
  const { user: authUser, firestoreUser, loading: authLoading, isAuthorized, UnauthorizedComponent } = useAuthProtection(['Admin', 'Manager', 'Worker', 'Supervisor']);
  const isManager = useMemo(() => firestoreUser?.role === 'Manager' || firestoreUser?.role === 'Admin', [firestoreUser]);
  const isSupervisor = useMemo(() => firestoreUser?.role === 'Supervisor' || firestoreUser?.role === 'Admin', [firestoreUser]);
  const currentUserId = authUser?.uid;
  const firestore = useFirestore();
  const { toast } = useToast();

  const [myRequests, setMyRequests] = useState<AccessRequest[]>([]);
  const [pendingRequests, setPendingRequests] = useState<AccessRequest[]>([]);
  const [sites, setSites] = useState<Site[]>([]);
  const [operators, setOperators] = useState<Operator[]>([]);
  const [contractors, setContractors] = useState<Contractor[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [approvalRequest, setApprovalRequest] = useState<AccessRequest | null>(null);

  // Determine the default tab
  const defaultTab = useMemo(() => {
    if (isSupervisor) return "group-request";
    if (isManager) return "approve";
    return "my-requests";
  }, [isSupervisor, isManager]);


  useEffect(() => {
    if (!firestore || !currentUserId || !firestoreUser) return;
    setLoading(true);

    const unsubs: (()=>void)[] = [];
    const requestsCollection = collection(firestore, "accessRequests");

    // Listener for requests relevant to the current user
    let userRequestsQuery;
    if (firestoreUser.role === 'Worker') {
      // Workers see requests they are a part of
      userRequestsQuery = query(requestsCollection, where("workerIds", "array-contains", currentUserId));
    } else if (firestoreUser.role === 'Supervisor') {
      // Supervisors see requests they have submitted
       userRequestsQuery = query(requestsCollection, where("supervisorId", "==", currentUserId));
    } else {
       // Admins/Managers see all requests for a consolidated view if needed, or customize as required
       userRequestsQuery = query(requestsCollection);
    }
    
    unsubs.push(onSnapshot(userRequestsQuery, (snapshot) => {
        const userRequests = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as AccessRequest));
        setMyRequests(userRequests);
        if (!isManager) setLoading(false);
    }, () => setLoading(false)));


    // Listener for manager's pending approvals
    if (isManager) {
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
            if (managerSiteIds.length > 0) {
                const pendingRequestsQuery = query(requestsCollection, where("status", "==", "Pending"), where("siteId", "in", managerSiteIds));
                unsubs.push(onSnapshot(pendingRequestsQuery, (snapshot) => {
                  const pending = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as AccessRequest));
                  setPendingRequests(pending);
                  setLoading(false);
                }));
            } else {
                setPendingRequests([]);
                setLoading(false);
            }
        };
        setupPendingRequestsListener();
    }
    
    // Data fetching for forms
    unsubs.push(onSnapshot(collection(firestore, "sites"), (snap) => setSites(snap.docs.map(d => ({...d.data(), id: d.id } as Site)))));
    unsubs.push(onSnapshot(collection(firestore, "operators"), (snap) => setOperators(snap.docs.map(d => ({...d.data(), id: d.id } as Operator)))));
    unsubs.push(onSnapshot(collection(firestore, "contractors"), (snap) => setContractors(snap.docs.map(d => ({...d.data(), id: d.id } as Contractor)))));


    return () => {
      unsubs.forEach(unsub => unsub());
    };
  }, [firestore, currentUserId, isManager, firestoreUser]);

  const handleOpenApprovalDialog = (request: AccessRequest) => {
    setApprovalRequest(request);
  };
  
  const handleDenyRequest = async (requestId: string) => {
      if (!firestore) return;
      try {
        const requestRef = doc(firestore, "accessRequests", requestId);
        await updateDoc(requestRef, { status: 'Denied' });
        toast({ title: `Request Denied`, description: `The request has been denied.` });
    } catch (error) {
        console.error(`Error denying request:`, error);
        toast({ variant: "destructive", title: "Action Failed", description: "Could not update the request status." });
    }
  }

  const handleConfirmApproval = async (requestId: string, validFrom: Date, expiresAt: Date | 'Permanent') => {
    if (!firestore) return;
    try {
      const requestRef = doc(firestore, 'accessRequests', requestId);
      await updateDoc(requestRef, {
        status: 'Approved',
        validFrom: validFrom.toISOString().split('T')[0], // "yyyy-MM-dd"
        expiresAt: expiresAt === 'Permanent' ? 'Permanent' : expiresAt.toISOString().split('T')[0],
      });
      toast({ title: 'Request Approved', description: 'The access request has been approved.' });
    } catch (error) {
      console.error('Error approving request:', error);
      toast({ variant: 'destructive', title: 'Approval Failed', description: 'Could not approve the request.' });
    } finally {
        setApprovalRequest(null);
    }
  };
  
  if (authLoading || !firestoreUser) {
    return <div>Loading...</div>;
  }

  if (!isAuthorized) {
    return <UnauthorizedComponent />;
  }

  const getVisibleTabs = () => {
    const tabs = [];
    tabs.push({ value: "my-requests", label: "My Requests" });

    if (isSupervisor) {
      tabs.push({ value: "group-request", label: "Create Group Request" });
    }
    if (isManager) {
      tabs.push({ value: "approve", label: "Approve Requests" });
    }
    return tabs;
  }
  
  const visibleTabs = getVisibleTabs();

  return (
    <div className="space-y-4 md:space-y-6">
       <header>
        <h1 className="text-3xl font-bold tracking-tight">Access Requests</h1>
        <p className="text-muted-foreground">Manage, submit, and approve access requests.</p>
      </header>
      <Tabs defaultValue={defaultTab} key={defaultTab}>
        <TabsList className="grid w-full" style={{ gridTemplateColumns: `repeat(${visibleTabs.length}, 1fr)`}}>
          {visibleTabs.map(tab => <TabsTrigger key={tab.value} value={tab.value}>{tab.label}</TabsTrigger>)}
        </TabsList>
        
        <TabsContent value="my-requests">
            <RequestsTable title="My Requests" description="A log of access requests relevant to you." requests={myRequests} isLoading={loading} />
        </TabsContent>

        {isSupervisor && (
             <TabsContent value="group-request">
                <SupervisorRequestForm
                    supervisor={firestoreUser}
                    operators={operators}
                    sites={sites}
                    contractors={contractors}
                    isLoading={loading}
                />
            </TabsContent>
        )}

        {isManager && (
            <TabsContent value="approve">
                <RequestsTable title="Pending Approval" description="These requests are waiting for your approval." requests={pendingRequests} showActions={true} onApprove={handleOpenApprovalDialog} onDeny={handleDenyRequest} isLoading={loading} />
            </TabsContent>
        )}
      </Tabs>
      
      {approvalRequest && (
        <ApprovalDialog
          request={approvalRequest}
          onOpenChange={() => setApprovalRequest(null)}
          onConfirm={handleConfirmApproval}
        />
      )}
    </div>
  );
}
