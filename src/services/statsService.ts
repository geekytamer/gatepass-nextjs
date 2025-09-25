// src/services/statsService.ts
import { mockUsers, mockAccessRequests, mockGateActivity } from '@/lib/data';

export async function getDashboardStats() {
  // In a real app, these would be database queries.
  const totalUsers = mockUsers.length;
  const pendingRequests = mockAccessRequests.filter(r => r.status === 'Pending').length;
  const checkedIn = mockGateActivity.filter(a => a.type === 'Check-in').length - mockGateActivity.filter(a => a.type === 'Check-out').length;
  const totalVisitors = mockUsers.filter(u => u.role === 'Visitor' || u.role === 'Worker').length;
  
  return {
    totalUsers,
    pendingRequests,
    checkedIn: checkedIn > 0 ? checkedIn : 0,
    totalVisitors
  };
}
