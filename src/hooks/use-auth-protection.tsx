
'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useUser } from '@/firebase/auth/use-user';
import { useFirestore } from '@/firebase';
import { doc, onSnapshot } from 'firebase/firestore';
import type { User as UserType, UserRole } from '@/lib/types';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle } from 'lucide-react';

export function useAuthProtection(allowedRoles: UserRole[]) {
  const { user, loading: authLoading } = useUser();
  const [firestoreUser, setFirestoreUser] = useState<UserType | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);
  const router = useRouter();
  const pathname = usePathname();
  const firestore = useFirestore();

  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      // prevent redirect loop if already on /login
      if (pathname !== '/login') {
        router.push('/login');
      }
      setLoading(false); // Stop loading if user is not authenticated
      return;
    }

    if (!firestore) {
      setLoading(false);
      return;
    }

    const userRef = doc(firestore, 'users', user.uid);
    const unsubscribe = onSnapshot(
      userRef,
      (docSnap) => {
        if (docSnap.exists()) {
          const userData = { id: docSnap.id, ...docSnap.data() } as UserType;
          setFirestoreUser(userData);
          setIsAuthorized(allowedRoles.includes(userData.role));
        } else {
          setIsAuthorized(false);
          setFirestoreUser(null);
        }
        setLoading(false);
      },
      (error) => {
        console.error('Error in auth protection snapshot: ', error);
        setIsAuthorized(false);
        setFirestoreUser(null);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user, authLoading, firestore, pathname, router, JSON.stringify(allowedRoles)]); // Stabilize dependency

  const UnauthorizedComponent = () => (
    <div className="flex items-center justify-center h-full min-h-[calc(100vh-10rem)]">
      <Alert variant="destructive" className="max-w-md">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>Access Denied</AlertTitle>
        <AlertDescription>
          You do not have permission to view this page.
        </AlertDescription>
      </Alert>
    </div>
  );

  return {
    user,
    firestoreUser,
    loading: authLoading || loading,
    isAuthorized,
    UnauthorizedComponent,
  };
}
