// src/services/statsService.ts
import { getUsers } from './userService';
import { getAccessRequests, getPendingRequests } from './accessRequestService';
import { getAllGateActivity } from './gateActivityService';


export async function getDashboardStats() {
  const users = await getUsers();
  const requests = await getAccessRequests();
  const activity = await getAllGateActivity();

  const totalUsers = users.length;
  const pendingRequests = requests.filter(r => r.status === 'Pending').length;
  
  // Calculate checked-in count more accurately
  const checkIns = activity.filter(a => a.type === 'Check-in').reduce((acc, curr) => {
    if (!acc[curr.userId] || new Date(curr.timestamp) > new Date(acc[curr.userId].timestamp)) {
      acc[curr.userId] = curr;
    }
    return acc;
  }, {} as Record<string, any>);

  const checkOuts = activity.filter(a => a.type === 'Check-out').reduce((acc, curr) => {
    if (!acc[curr.userId] || new Date(curr.timestamp) > new Date(acc[curr.userId].timestamp)) {
      acc[curr.userId] = curr;
    }
    return acc;
  }, {} as Record<string, any>);

  let checkedInCount = 0;
  for (const userId in checkIns) {
    if (!checkOuts[userId] || new Date(checkIns[userId].timestamp) > new Date(checkOuts[userId].timestamp)) {
      checkedInCount++;
    }
  }

  const totalVisitors = users.filter(u => u.role === 'Visitor' || u.role === 'Worker').length;
  
  return {
    totalUsers,
    pendingRequests,
    checkedIn: checkedInCount,
    totalVisitors
  };
}
