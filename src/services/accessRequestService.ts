// src/services/accessRequestService.ts
import { mockAccessRequests } from '@/lib/data';
import type { AccessRequest } from '@/lib/types';

export async function getAccessRequests(): Promise<AccessRequest[]> {
  // In a real app, this would fetch from a database.
  return mockAccessRequests;
}

export async function getRequestsForUser(userId: string): Promise<AccessRequest[]> {
    return mockAccessRequests.filter(req => req.userId === userId);
}

export async function getPendingRequests(): Promise<AccessRequest[]> {
    return mockAccessRequests.filter(req => req.status === 'Pending');
}
