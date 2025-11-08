
import type { Timestamp } from "firebase/firestore";

export type UserRole = 'System Admin' | 'Operator Admin' | 'Contractor Admin' | 'Manager' | 'Security' | 'Visitor' | 'Worker' | 'Supervisor';
export type UserStatus = 'Active' | 'Inactive';

export type Certificate = {
  name: string;
  expiryDate?: string; // ISO 8601 string (e.g., "yyyy-MM-dd")
}

export type User = {
  id: string;
  name: string;
  email?: string;
  role: UserRole;
  status?: UserStatus;
  avatarUrl: string;
  company?: string; 
  operatorId?: string;
  contractorId?: string;
  certificates?: Certificate[];
  idCardImageUrl?: string;
  idNumber?: string; // For manually entered ID
  assignedSiteId?: string; 
};

export type AccessRequestStatus = 'Pending' | 'Approved' | 'Denied';

export type AccessRequest = {
  id: string;
  // Fields for individual requests (can be deprecated or kept for other roles)
  userId?: string;
  userName?: string;
  userAvatar?: string;
  reason?: string;
  // New fields for group requests
  supervisorId: string;
  supervisorName: string;
  operatorId: string;
  operatorName: string;
  contractorId: string;
  contractorName: string;
  siteId: string;
  siteName: string;
  contractNumber: string;
  focalPoint: string;
  workerIds: string[];
  status: AccessRequestStatus;
  requestedAt: Timestamp | string;
  validFrom?: string; // ISO 8601 Date string "yyyy-MM-dd"
  expiresAt?: string; // ISO 8601 Date string "yyyy-MM-dd" or "Permanent"
};

export type GateActivity = {
  id: string;
  userId: string;
  userName:string;
  userAvatar: string;
  timestamp: string; // Should be ISO string
  type: 'Check-in' | 'Check-out';
  gate: string;
  siteId: string;
};

export type Site = {
    id: string;
    name: string;
    operatorId: string; // Link site to an operator
    managerIds: string[];
    requiredCertificates: string[];
}

export type CertificateType = {
    id: string;
    name: string;
}

export type Operator = {
    id: string;
    name: string;
}

export type Contractor = {
    id: string;
    name: string;
}
