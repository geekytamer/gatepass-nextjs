import type { User, AccessRequest, GateActivity } from './types';
import { PlaceHolderImages } from './placeholder-images';
import { subDays, subHours, format } from 'date-fns';

const now = new Date();

export const mockUsers: User[] = [
  { id: 'usr_001', name: 'Admin User', email: 'admin@gatepass.com', role: 'Admin', avatarUrl: PlaceHolderImages[0].imageUrl },
  { id: 'usr_002', name: 'Emily Manager', email: 'emily.m@corp.com', role: 'Manager', avatarUrl: PlaceHolderImages[1].imageUrl, company: 'Corp Inc.' },
  { id: 'usr_003', name: 'John Security', email: 'john.s@gatepass.com', role: 'Security', avatarUrl: PlaceHolderImages[2].imageUrl },
  { id: 'usr_004', name: 'Sarah Visitor', email: 'sarah.v@visitor.com', role: 'Visitor', avatarUrl: PlaceHolderImages[3].imageUrl, company: 'Guest' },
  { id: 'usr_005', name: 'Mike Worker', email: 'mike.w@construct.co', role: 'Worker', avatarUrl: PlaceHolderImages[4].imageUrl, company: 'Construct Co.' },
  { id: 'usr_006', name: 'David Tools', email: 'david.t@construct.co', role: 'Worker', avatarUrl: PlaceHolderImages[5].imageUrl, company: 'Construct Co.' },
  { id: 'usr_007', name: 'Olivia Project', email: 'olivia.p@corp.com', role: 'Manager', avatarUrl: PlaceHolderImages[0].imageUrl, company: 'Corp Inc.' },
  { id: 'usr_008', name: 'Daniel Guard', email: 'daniel.g@gatepass.com', role: 'Security', avatarUrl: PlaceHolderImages[1].imageUrl },

];

export const mockAccessRequests: AccessRequest[] = [
  { id: 'req_001', userId: 'usr_005', userName: 'Mike Worker', userAvatar: PlaceHolderImages[4].imageUrl, date: format(subDays(now, -2), 'yyyy-MM-dd'), reason: 'Scheduled maintenance on HVAC system.', status: 'Approved', requestedAt: format(subDays(now, 1), 'yyyy-MM-dd HH:mm') },
  { id: 'req_002', userId: 'usr_004', userName: 'Sarah Visitor', userAvatar: PlaceHolderImages[3].imageUrl, date: format(now, 'yyyy-MM-dd'), reason: 'Meeting with Emily Manager.', status: 'Pending', requestedAt: format(subHours(now, 3), 'yyyy-MM-dd HH:mm') },
  { id: 'req_003', userId: 'usr_006', userName: 'David Tools', userAvatar: PlaceHolderImages[5].imageUrl, date: format(subDays(now, -1), 'yyyy-MM-dd'), reason: 'Deliver construction materials.', status: 'Pending', requestedAt: format(subHours(now, 1), 'yyyy-MM-dd HH:mm') },
  { id: 'req_004', userId: 'usr_005', userName: 'Mike Worker', userAvatar: PlaceHolderImages[4].imageUrl, date: format(subDays(now, 5), 'yyyy-MM-dd'), reason: 'Emergency plumbing repair.', status: 'Denied', requestedAt: format(subDays(now, 5), 'yyyy-MM-dd HH:mm') },
];

export const mockGateActivity: GateActivity[] = [
  { id: 'act_001', userId: 'usr_002', userName: 'Emily Manager', userAvatar: PlaceHolderImages[1].imageUrl, timestamp: format(subHours(now, 1), 'yyyy-MM-dd HH:mm:ss'), type: 'Check-in', gate: 'Main Gate' },
  { id: 'act_002', userId: 'usr_005', userName: 'Mike Worker', userAvatar: PlaceHolderImages[4].imageUrl, timestamp: format(subHours(now, 2), 'yyyy-MM-dd HH:mm:ss'), type: 'Check-in', gate: 'Service Gate' },
  { id: 'act_003', userId: 'usr_005', userName: 'Mike Worker', userAvatar: PlaceHolderImages[4].imageUrl, timestamp: format(subHours(now, 1), 'yyyy-MM-dd HH:mm:ss'), type: 'Check-out', gate: 'Service Gate' },
  { id: 'act_004', userId: 'usr_003', userName: 'John Security', userAvatar: PlaceHolderImages[2].imageUrl, timestamp: format(subHours(now, 8), 'yyyy-MM-dd HH:mm:ss'), type: 'Check-in', gate: 'Main Gate' },
  { id: 'act_005', userId: 'usr_004', userName: 'Sarah Visitor', userAvatar: PlaceHolderImages[3].imageUrl, timestamp: format(subHours(now, 0.5), 'yyyy-MM-dd HH:mm:ss'), type: 'Check-in', gate: 'Main Gate' },
  // An irregularity: quick check-in and check-out
  { id: 'act_006', userId: 'usr_006', userName: 'David Tools', userAvatar: PlaceHolderImages[5].imageUrl, timestamp: format(subHours(now, 4), 'yyyy-MM-dd HH:mm:ss'), type: 'Check-in', gate: 'North Gate' },
  { id: 'act_007', userId: 'usr_006', userName: 'David Tools', userAvatar: PlaceHolderImages[5].imageUrl, timestamp: format(subHours(now, 3.9), 'yyyy-MM-dd HH:mm:ss'), type: 'Check-out', gate: 'North Gate' },
];
