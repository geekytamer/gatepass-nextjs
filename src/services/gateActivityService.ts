// src/services/gateActivityService.ts
import type { GateActivity } from '@/lib/types';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { subHours, format } from 'date-fns';
import { getUser } from './userService';

const now = new Date();

const initialActivity: GateActivity[] = [
  { id: 'act_001', userId: 'usr_002', userName: 'Emily Manager', userAvatar: PlaceHolderImages[1].imageUrl, timestamp: format(subHours(now, 1), 'yyyy-MM-dd HH:mm:ss'), type: 'Check-in', gate: 'Main Gate' },
  { id: 'act_002', userId: 'usr_005', userName: 'Mike Worker', userAvatar: PlaceHolderImages[4].imageUrl, timestamp: format(subHours(now, 2), 'yyyy-MM-dd HH:mm:ss'), type: 'Check-in', gate: 'Service Gate' },
  { id: 'act_003', userId: 'usr_005', userName: 'Mike Worker', userAvatar: PlaceHolderImages[4].imageUrl, timestamp: format(subHours(now, 1), 'yyyy-MM-dd HH:mm:ss'), type: 'Check-out', gate: 'Service Gate' },
  { id: 'act_004', userId: 'usr_003', userName: 'John Security', userAvatar: PlaceHolderImages[2].imageUrl, timestamp: format(subHours(now, 8), 'yyyy-MM-dd HH:mm:ss'), type: 'Check-in', gate: 'Main Gate' },
  { id: 'act_005', userId: 'usr_004', userName: 'Sarah Visitor', userAvatar: PlaceHolderImages[3].imageUrl, timestamp: format(subHours(now, 0.5), 'yyyy-MM-dd HH:mm:ss'), type: 'Check-in', gate: 'Main Gate' },
];

const getStoredActivity = (): GateActivity[] => {
    if (typeof window === 'undefined') return initialActivity;
    const stored = localStorage.getItem('gatepass_gate_activity');
    if (stored) {
        return JSON.parse(stored);
    }
    localStorage.setItem('gatepass_gate_activity', JSON.stringify(initialActivity));
    return initialActivity;
};

const setStoredActivity = (activity: GateActivity[]) => {
    if (typeof window === 'undefined') return;
    localStorage.setItem('gatepass_gate_activity', JSON.stringify(activity));
};

export async function getRecentGateActivity(limit: number = 5): Promise<GateActivity[]> {
  const activity = getStoredActivity();
  // Sort by timestamp descending
  activity.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  return activity.slice(0, limit);
}

export async function getAllGateActivity(): Promise<GateActivity[]> {
  return getStoredActivity();
}

export async function addGateActivity(userId: string, type: 'Check-in' | 'Check-out', gate: string): Promise<GateActivity | null> {
    const user = await getUser(userId);
    if (!user) {
        return null;
    }

    const newActivity: GateActivity = {
        id: `act_${Date.now()}`,
        userId: user.id,
        userName: user.name,
        userAvatar: user.avatarUrl,
        timestamp: new Date().toISOString(),
        type,
        gate,
    };

    const activity = getStoredActivity();
    const updatedActivity = [newActivity, ...activity];
    setStoredActivity(updatedActivity);
    return newActivity;
}
