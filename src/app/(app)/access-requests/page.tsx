
'use client';

import { useState, useEffect, useCallback } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RequestsTable } from "@/components/access-requests/requests-table";
import { NewRequestForm } from "@/components/access-requests/new-request-form";
import { getRequestsForUser, getPendingRequests, addRequest as addRequestService, updateRequestStatus } from "@/services/accessRequestService";
import type { AccessRequest } from "@/lib/types";

export default function AccessRequestsPage() {
  const isManager = true; 
  const currentUserId = 'usr_005';

  const [currentUserRequests, setCurrentUserRequests] = useState<AccessRequest[]>([]);
  const [pendingRequests, setPendingRequests] = useState<AccessRequest[]>([]);
  
  const fetchRequests = useCallback(async () => {
      const userRequests = await getRequestsForUser(currentUserId);
      const pending = await getPendingRequests();
      setCurrentUserRequests(userRequests);
      setPendingRequests(pending);
  }, [currentUserId]);


  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  const handleAddRequest = async (newRequest: Omit<AccessRequest, 'id' | 'status' | 'requestedAt'>) => {
    await addRequestService(newRequest);
    await fetchRequests(); // Refresh all requests
  };

  const handleRequestAction = async (requestId: string, newStatus: 'Approved' | 'Denied') => {
      await updateRequestStatus(requestId, newStatus);
      await fetchRequests(); // Refresh all requests
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
            <NewRequestForm currentUserId={currentUserId} onNewRequest={handleAddRequest} />
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
