
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
import { useRouter, usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { useFirestore } from '@/firebase';
import { doc, onSnapshot, setDoc, getDocs, collection, query, limit, getDoc } from 'firebase/firestore';
import type { User } from '@/lib/types';


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
  const { user, loading: authLoading } = useUser();
  const [firestoreUser, setFirestoreUser] = useState<User | null>(null);
  const [userStatusLoading, setUserStatusLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();
  const firestore = useFirestore();

  // Redirect unauthenticated users to login
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  // Handle Firestore user profile: fetch, create if non-existent, and check status
  useEffect(() => {
    if (!user || !firestore) {
        if (!authLoading) setUserStatusLoading(false);
        return;
    }

    const userRef = doc(firestore, 'users', user.uid);
    let unsubscribe: () => void;

    const manageUserProfile = async () => {
        const docSnap = await getDoc(userRef);

        if (!docSnap.exists()) {
             // User exists in Auth but not in Firestore. Create the document.
            console.log(`User document not found for UID ${user.uid}. Creating new profile.`);
            try {
                // Check if this is the very first user to determine their role.
                const usersQuery = query(collection(firestore, "users"), limit(1));
                const existingUsersSnapshot = await getDocs(usersQuery);
                const isFirstUser = existingUsersSnapshot.empty;
                const role = isFirstUser ? 'Admin' : 'Worker';

                const newUserProfile: Omit<User, 'id'> = {
                    name: user.email || 'New User',
                    email: user.email!,
                    role: role, 
                    status: 'Inactive', 
                };
                await setDoc(userRef, newUserProfile);
                console.log(`Created new user profile with role: ${role}`);
            } catch (error) {
                console.error("Failed to create user document in Firestore:", error);
                setUserStatusLoading(false);
                return; // Stop execution if profile creation fails
            }
        }
        
        // At this point, the user doc is guaranteed to exist, so we can listen to it.
        unsubscribe = onSnapshot(userRef, (doc) => {
            const userData = doc.data() as User;
            setFirestoreUser(userData);
            setUserStatusLoading(false);
            // Redirection logic based on status
            if (userData.status === 'Inactive' && pathname !== '/activate-account') {
                router.push('/activate-account');
            } else if (userData.status === 'Active' && pathname === '/activate-account') {
                router.push('/dashboard');
            }
        }, (error) => {
            console.error("Error fetching user profile:", error);
            setUserStatusLoading(false);
        });
    }

    manageUserProfile();

    return () => {
        if (unsubscribe) {
            unsubscribe();
        }
    };
  }, [user, firestore, router, pathname, authLoading]);

  const loading = authLoading || userStatusLoading;

  if (loading || !user || !firestoreUser) {
    return <AppLoadingSkeleton />;
  }

  // If user is Inactive, only the activation page should render its specific layout (or none)
  if (firestoreUser.status === 'Inactive' && pathname !== '/activate-account') {
      return <>{children}</>;
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
