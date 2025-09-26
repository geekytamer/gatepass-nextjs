// src/firebase/firestore/use-doc.tsx
import { useState, useEffect } from 'react';
import { doc, onSnapshot, DocumentData } from 'firebase/firestore';
import { useFirestore } from '../provider';

export function useDoc<T>(path: string) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<any>();
  const firestore = useFirestore();

  useEffect(() => {
    if (!firestore) return;
    const ref = doc(firestore, path);
    const unsubscribe = onSnapshot(ref, {
      next: (snapshot) => {
        if (snapshot.exists()) {
          setData({ id: snapshot.id, ...snapshot.data() } as T);
        } else {
          setData(null);
        }
      },
      error: (err) => {
        setError(err);
      },
    });
    return unsubscribe;
  }, [firestore, path]);

  return { data, error };
}
