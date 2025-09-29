
'use client';
import type { ReactNode } from 'react';
import {
  SidebarProvider,
  Sidebar,
  SidebarInset,
} from '@/components/ui/sidebar';
import { SidebarNav } from '@/components/layout/sidebar-nav';
import { Header } from '@/components/layout/header';
import { useUser } from '@/firebase/auth/use-user';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Skeleton } from '@/components/ui/skeleton';


function AppLoadingSkeleton() {
  return (
    <div className="flex h-svh w-full">
      {/* Sidebar Skeleton */}
      <div className="hidden md:flex flex-col gap-4 h-full w-[16rem] bg-gray-900 p-4">
        <Skeleton className="h-10 w-3/4" />
        <div className="flex-1 space-y-2">
          {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-8 w-full" />)}
        </div>
        <Skeleton className="h-12 w-full" />
      </div>
      {/* Main Content Skeleton */}
      <div className="flex-1 flex flex-col">
        <div className="h-16 border-b flex items-center justify-between px-6">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-8 w-8 rounded-full" />
        </div>
        <main className="flex-1 p-8">
           <Skeleton className="h-8 w-1/4 mb-4" />
           <Skeleton className="h-4 w-1/2 mb-8" />
           <Skeleton className="h-64 w-full" />
        </main>
      </div>
    </div>
  )
}


export default function AppLayout({ children }: { children: ReactNode }) {
  const { user, loading } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);


  if (loading || !user) {
    return <AppLoadingSkeleton />;
  }

  return (
    <SidebarProvider>
      <Sidebar>
        <SidebarNav />
      </Sidebar>
      <SidebarInset>
        <div className="flex flex-col min-h-svh bg-background">
          <Header />
          <main className="flex-1 p-4 md:p-6 lg:p-8">{children}</main>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
