
'use client';

import { useState, useEffect } from 'react';
import { serverFetchWorkerData } from '@/app/actions/workerActions';
import type { FetchWorkerDataOutput } from '@/ai/flows/fetch-worker-data-flow';

export function useWorkerData(workerId: string | undefined) {
  const [workerData, setWorkerData] = useState<FetchWorkerDataOutput | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!workerId) {
      setWorkerData(null);
      return;
    }

    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const result = await serverFetchWorkerData({ workerId });
        setWorkerData(result);
      } catch (err: any) {
        setError(err.message || 'Failed to fetch worker data');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [workerId]);

  return { workerData, loading, error };
}
