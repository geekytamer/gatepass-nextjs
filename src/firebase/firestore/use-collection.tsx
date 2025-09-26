// src/firebase/firestore/use-collection.tsx
import { useState, useEffect } from 'react';
import {
  collection,
  onSnapshot,
  Query,
  DocumentData,
  query,
  where,
} from 'firebase/firestore';
import { useFirestore } from '../provider';

export function useCollection<T>(path: string) {
  const [data, setData] = useState<T[]>();
  const [error, setError] = useState<any>();
  const firestore = useFirestore();

  useEffect(() => {
    if (!firestore) return;
    const ref = collection(firestore, path);
    const unsubscribe = onSnapshot(ref, {
      next: (snapshot) => {
        const items = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as T));
        setData(items);
      },
      error: (err) => {
        setError(err);
      },
    });
    return unsubscribe;
  }, [firestore, path]);

  return { data, error };
}
