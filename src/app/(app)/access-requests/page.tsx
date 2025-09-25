import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RequestsTable } from "@/components/access-requests/requests-table";
import { NewRequestForm } from "@/components/access-requests/new-request-form";
import { getRequestsForUser, getPendingRequests } from "@/services/accessRequestService";

export default async function AccessRequestsPage() {
  // In a real app, this would be based on the logged-in user's role and ID.
  const isManager = true; 
  const currentUserId = 'usr_005';

  const currentUserRequests = await getRequestsForUser(currentUserId);
  const pendingRequests = await getPendingRequests();

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
            <NewRequestForm />
        </TabsContent>
        {isManager && (
            <TabsContent value="approve">
                <RequestsTable title="Pending Approval" description="These requests are waiting for your approval." requests={pendingRequests} showActions={true} />
            </TabsContent>
        )}
      </Tabs>
    </div>
  );
}
