
'use client';
import { useUser } from '@/firebase/auth/use-user';
import { useFirestore } from '@/firebase';
import { doc, onSnapshot } from 'firebase/firestore';
import { redirect } from 'next/navigation';
import { useEffect, useState } from 'react';
import type { User as UserType, UserRole } from '@/lib/types';


const getHomepageForRole = (role?: UserRole): string => {
  switch (role) {
    case 'Contractor Admin':
      return '/access-requests';
    default:
      return '/dashboard';
  }
}

export default function Home() {
  const { user, loading } = useUser();
  const firestore = useFirestore();
  const [firestoreUser, setFirestoreUser] = useState<UserType | null>(null);
  const [userLoading, setUserLoading] = useState(true);

  useEffect(() => {
    if (loading) return;
    if (!user || !firestore) {
      setUserLoading(false);
      return;
    }
    
    const unsub = onSnapshot(doc(firestore, 'users', user.uid), (doc) => {
      if (doc.exists()) {
        setFirestoreUser(doc.data() as UserType);
      }
      setUserLoading(false);
    });

    return () => unsub();

  }, [user, loading, firestore]);

  if (loading || userLoading) {
    return <div>Loading...</div>;
  }
  
  if (!user) {
    redirect('/login');
  } else {
    const homePage = getHomepageForRole(firestoreUser?.role);
    redirect(homePage);
  }
}
