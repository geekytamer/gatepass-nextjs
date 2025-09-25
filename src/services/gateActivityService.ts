// src/services/gateActivityService.ts
import { mockGateActivity } from '@/lib/data';
import type { GateActivity } from '@/lib/types';

export async function getRecentGateActivity(limit: number = 5): Promise<GateActivity[]> {
  // In a real app, this would be a database query with sorting and limiting.
  return mockGateActivity.slice(0, limit);
}

export async function getAllGateActivity(): Promise<GateActivity[]> {
  return mockGateActivity;
}
