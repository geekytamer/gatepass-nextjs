
'use client';

import { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { VisitorsTable } from "@/components/visitors/visitors-table";
import { NewVisitorForm } from "@/components/visitors/new-visitor-form";
import { getVisitors } from "@/services/userService";
import type { User } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';

export default function VisitorsPage() {
  const [visitors, setVisitors] = useState<User[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    getVisitors().then(setVisitors);
  }, []);

  const addVisitor = (newVisitor: Omit<User, 'id' | 'avatarUrl'>) => {
    const visitorWithId: User = {
        ...newVisitor,
        id: `usr_${Date.now()}`,
        // In a real app, you might have a default or generated avatar
        avatarUrl: `https://picsum.photos/seed/${Date.now()}/200/200`,
    };
    setVisitors(prev => [visitorWithId, ...prev]);
  };

  const deleteVisitor = (visitorId: string) => {
    setVisitors(prev => prev.filter(v => v.id !== visitorId));
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
