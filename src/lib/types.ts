
import type { Timestamp } from "firebase/firestore";

export type UserRole = 'Admin' | 'Manager' | 'Security' | 'Visitor' | 'Worker';

export type Certificate = {
  name: string;
  fileDataUrl: string;
}

export type User = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatarUrl: string;
  company?: string;
  certificates?: Certificate[];
};

export type AccessRequestStatus = 'Pending' | 'Approved' | 'Denied';

export type AccessRequest = {
  id:string;
  userId: string;
  userName: string;
  userAvatar: string;
  date: string;
  reason: string;
  status: AccessRequestStatus;
  requestedAt: Timestamp | string;
};

export type GateActivity = {
  id: string;
  userId: string;
  userName: string;
  userAvatar: string;
  timestamp: string; // Should be ISO string
  type: 'Check-in' | 'Check-out';
  gate: string;
};
