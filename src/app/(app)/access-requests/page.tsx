
'use client';

import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RequestsTable } from "@/components/access-requests/requests-table";
import { NewRequestForm } from "@/components/access-requests/new-request-form";
import { getRequestsForUser, getPendingRequests } from "@/services/accessRequestService";
import type { AccessRequest } from "@/lib/types";

export default function AccessRequestsPage() {
  const isManager = true; 
  const currentUserId = 'usr_005';

  const [currentUserRequests, setCurrentUserRequests] = useState<AccessRequest[]>([]);
  const [pendingRequests, setPendingRequests] = useState<AccessRequest[]>([]);

  useEffect(() => {
    getRequestsForUser(currentUserId).then(setCurrentUserRequests);
    getPendingRequests().then(setPendingRequests);
  }, [currentUserId]);

  const addRequest = (newRequest: Omit<AccessRequest, 'id' | 'status' | 'requestedAt'>) => {
    const request: AccessRequest = {
        ...newRequest,
        id: `req_${Date.now()}`,
        status: 'Pending',
        requestedAt: new Date().toISOString(),
    };
    
    if (request.userId === currentUserId) {
        setCurrentUserRequests(prev => [request, ...prev]);
    }
    // If a manager creates a request for someone else it wouldn't appear in "My Requests"
    // but a real implementation should decide where it goes. For now, we assume
    // users only create requests for themselves.
    
    // In a real app, this would also add to a central pool of requests
    // that feeds the pending requests for managers.
    // For this simulation, if the current user is not a manager,
    // we'll add it to the pending list for demonstration.
    if(isManager) {
        setPendingRequests(prev => [request, ...prev]);
    }
  };

  const handleRequestAction = (requestId: string, newStatus: 'Approved' | 'Denied') => {
      setPendingRequests(prev => prev.filter(r => r.id !== requestId));
      // In a real app, you would also update the status in the main data source
      // and it would reflect everywhere. For this mock setup, we just remove it
      // from the pending list. We could also update its status in the currentUserRequests list
      // if it happens to be there.
      setCurrentUserRequests(prev => prev.map(r => r.id === requestId ? {...r, status: newStatus} : r));
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
            <RequestsTable title="My Past Requests" description="A log of your submitted access requests." requests={currentUserRequests} />
        </TabsContent>
        <TabsContent value="new-request">
            <NewRequestForm currentUserId={currentUserId} onNewRequest={addRequest} />
        </TabsContent>
        {isManager && (
            <TabsContent value="approve">
                <RequestsTable title="Pending Approval" description="These requests are waiting for your approval." requests={pendingRequests} showActions={true} onAction={handleRequestAction} />
            </TabsContent>
        )}
      </Tabs>
    </div>
  );
}
