
'use client';

import { useState, useEffect, useCallback } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { VisitorsTable } from "@/components/visitors/visitors-table";
import { NewVisitorForm } from "@/components/visitors/new-visitor-form";
import { getVisitors, addUser, deleteUser as deleteUserService } from "@/services/userService";
import type { User } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';

export default function VisitorsPage() {
  const [visitors, setVisitors] = useState<User[]>([]);
  const { toast } = useToast();

  const fetchVisitors = useCallback(async () => {
    const visitorsData = await getVisitors();
    setVisitors(visitorsData);
  }, []);

  useEffect(() => {
    fetchVisitors();
  }, [fetchVisitors]);

  const addVisitor = async (newVisitor: Omit<User, 'id' | 'avatarUrl'>) => {
    await addUser(newVisitor);
    await fetchVisitors(); // Re-fetch to get the new list with ID and avatar
  };

  const deleteVisitor = async (visitorId: string) => {
    await deleteUserService(visitorId);
    await fetchVisitors();
    toast({
        title: 'Visitor Deleted',
        description: 'The visitor profile has been removed.',
        variant: 'destructive',
    });
  }

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
            <VisitorsTable visitors={visitors} onDeleteVisitor={deleteVisitor} />
        </TabsContent>
        <TabsContent value="new-visitor">
            <NewVisitorForm onNewVisitor={addVisitor} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
