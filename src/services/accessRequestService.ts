// src/services/accessRequestService.ts
import type { AccessRequest, AccessRequestStatus } from '@/lib/types';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { subDays, subHours, format } from 'date-fns';

const now = new Date();

const initialRequests: AccessRequest[] = [
  { id: 'req_001', userId: 'usr_005', userName: 'Mike Worker', userAvatar: PlaceHolderImages[4].imageUrl, date: format(subDays(now, -2), 'yyyy-MM-dd'), reason: 'Scheduled maintenance on HVAC system.', status: 'Approved', requestedAt: format(subDays(now, 1), 'yyyy-MM-dd HH:mm') },
  { id: 'req_002', userId: 'usr_004', userName: 'Sarah Visitor', userAvatar: PlaceHolderImages[3].imageUrl, date: format(now, 'yyyy-MM-dd'), reason: 'Meeting with Emily Manager.', status: 'Pending', requestedAt: format(subHours(now, 3), 'yyyy-MM-dd HH:mm') },
  { id: 'req_003', userId: 'usr_006', userName: 'David Tools', userAvatar: PlaceHolderImages[5].imageUrl, date: format(subDays(now, -1), 'yyyy-MM-dd'), reason: 'Deliver construction materials.', status: 'Pending', requestedAt: format(subHours(now, 1), 'yyyy-MM-dd HH:mm') },
  { id: 'req_004', userId: 'usr_005', userName: 'Mike Worker', userAvatar: PlaceHolderImages[4].imageUrl, date: format(subDays(now, 5), 'yyyy-MM-dd'), reason: 'Emergency plumbing repair.', status: 'Denied', requestedAt: format(subDays(now, 5), 'yyyy-MM-dd HH:mm') },
];

const getStoredRequests = (): AccessRequest[] => {
    if (typeof window === 'undefined') return initialRequests;
    const stored = localStorage.getItem('gatepass_access_requests');
    if (stored) {
        return JSON.parse(stored);
    }
    localStorage.setItem('gatepass_access_requests', JSON.stringify(initialRequests));
    return initialRequests;
};

const setStoredRequests = (requests: AccessRequest[]) => {
    if (typeof window === 'undefined') return;
    localStorage.setItem('gatepass_access_requests', JSON.stringify(requests));
};


export async function getAccessRequests(): Promise<AccessRequest[]> {
  return getStoredRequests();
}

export async function getRequestsForUser(userId: string): Promise<AccessRequest[]> {
    const requests = getStoredRequests();
    return requests.filter(req => req.userId === userId);
}

export async function getPendingRequests(): Promise<AccessRequest[]> {
    const requests = getStoredRequests();
    return requests.filter(req => req.status === 'Pending');
}

export async function addRequest(newRequest: Omit<AccessRequest, 'id' | 'status' | 'requestedAt'>): Promise<AccessRequest> {
    const requests = getStoredRequests();
    const request: AccessRequest = {
        ...newRequest,
        id: `req_${Date.now()}`,
        status: 'Pending',
        requestedAt: new Date().toISOString(),
    };
    const updatedRequests = [request, ...requests];
    setStoredRequests(updatedRequests);
    return request;
}

export async function updateRequestStatus(requestId: string, newStatus: AccessRequestStatus): Promise<AccessRequest | undefined> {
    const requests = getStoredRequests();
    const requestIndex = requests.findIndex(r => r.id === requestId);
    if (requestIndex === -1) return undefined;

    requests[requestIndex].status = newStatus;
    setStoredRequests(requests);
    return requests[requestIndex];
}