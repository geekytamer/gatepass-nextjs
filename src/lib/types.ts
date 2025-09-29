
import type { Timestamp } from "firebase/firestore";

export type UserRole = 'Admin' | 'Manager' | 'Security' | 'Visitor' | 'Worker';
export type UserStatus = 'Active' | 'Inactive';

export type Certificate = {
  name: string;
  expiryDate?: string; // ISO 8601 string (e.g., "yyyy-MM-dd")
}

export type User = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  avatarUrl: string;
  company?: string;
  certificates?: Certificate[];
  idCardImageUrl?: string;
  assignedSiteId?: string; // Add this to assign a security user to a site
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
  siteId: string;
  siteName: string;
  managerIds?: string[];
};

export type GateActivity = {
  id: string;
  userId: string;
  userName: string;
  userAvatar: string;
  timestamp: string; // Should be ISO string
  type: 'Check-in' | 'Check-out';
  gate: string;
  siteId: string;
};

export type Site = {
    id: string;
    name: string;
    managerIds: string[];
    requiredCertificates: string[];
}

export type CertificateType = {
    id: string;
    name: string;
}
