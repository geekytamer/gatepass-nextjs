
'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@/firebase/auth/use-user';
import { useFirestore } from '@/firebase';
import { doc, onSnapshot } from 'firebase/firestore';
import type { User as UserType, UserRole } from '@/lib/types';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle } from 'lucide-react';

function UnauthorizedComponent() {
  return (
    <div className="flex items-center justify-center p-8">
      <Alert variant="destructive" className="max-w-md">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>Access Denied</AlertTitle>
        <AlertDescription>
          You do not have permission to view this page.
        </AlertDescription>
      </Alert>
    </div>
  );
}

export function useAuthProtection(allowedRoles: UserRole[]) {
  const { user, loading: authLoading } = useUser();
  const [firestoreUser, setFirestoreUser] = useState<UserType | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);
  const router = useRouter();
  const firestore = useFirestore();

  const memoizedAllowedRoles = useMemo(() => new Set(allowedRoles), [allowedRoles]);

  useEffect(() => {
    if (authLoading) {
      return;
    }

    if (!user) {
      router.push('/login');
      return;
    }

    if (!firestore) {
      setLoading(false);
      return;
    }

    const userRef = doc(firestore, 'users', user.uid);
    const unsubscribe = onSnapshot(userRef, (docSnap) => {
      if (docSnap.exists()) {
        const userData = { id: docSnap.id, ...docSnap.data() } as UserType;
        setFirestoreUser(userData);
        if (memoizedAllowedRoles.has(userData.role)) {
          setIsAuthorized(true);
        } else {
          setIsAuthorized(false);
        }
      } else {
        setIsAuthorized(false);
        setFirestoreUser(null);
      }
      setLoading(false);
    }, (error) => {
        console.error("Error in auth protection snapshot: ", error);
        setIsAuthorized(false);
        setFirestoreUser(null);
        setLoading(false);
    });

    return () => unsubscribe();
  }, [user, authLoading, firestore, router, memoizedAllowedRoles]);

  return {
    user,
    firestoreUser,
    loading: authLoading || loading,
    isAuthorized,
    UnauthorizedComponent,
  };
}
