import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { VisitorsTable } from "@/components/visitors/visitors-table";
import { NewVisitorForm } from "@/components/visitors/new-visitor-form";
import { getVisitors } from "@/services/userService";

export default async function VisitorsPage() {
  const visitors = await getVisitors();

  return (
    <div className="space-y-4 md:space-y-6">
       <header>
        <h1 className="text-3xl font-bold tracking-tight">Visitor Management</h1>
        <p className="text-muted-foreground">Create and manage profiles for visitors and workers.</p>
      </header>
      <Tabs defaultValue="visitor-list">
        <TabsList className="grid w-full grid-cols-2 md:w-auto md:max-w-[400px]">
          <TabsTrigger value="visitor-list">Visitor List</TabsTrigger>
          <TabsTrigger value="new-visitor">New Visitor Profile</TabsTrigger>
        </TabsList>
        <TabsContent value="visitor-list">
            <VisitorsTable visitors={visitors} />
        </TabsContent>
        <TabsContent value="new-visitor">
            <NewVisitorForm />
        </TabsContent>
      </Tabs>
    </div>
  );
}
