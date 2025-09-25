export type UserRole = 'Admin' | 'Manager' | 'Security' | 'Visitor' | 'Worker';

export type User = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatarUrl: string;
  company?: string;
};

export type AccessRequestStatus = 'Pending' | 'Approved' | 'Denied';

export type AccessRequest = {
  id: string;
  userId: string;
  userName: string;
  userAvatar: string;
  date: string;
  reason: string;
  status: AccessRequestStatus;
  requestedAt: string;
  documentation?: string[]; // URLs to documents for workers
};

export type GateActivity = {
  id: string;
  userId: string;
  userName: string;
  userAvatar: string;
  timestamp: string;
  type: 'Check-in' | 'Check-out';
  gate: string;
};
