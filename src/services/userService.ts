// src/services/userService.ts
import { mockUsers } from '@/lib/data';
import type { User } from '@/lib/types';

export async function getUsers(): Promise<User[]> {
  // In a real app, this would fetch from a database.
  return mockUsers;
}

export async function getUser(id: string): Promise<User | undefined> {
    return mockUsers.find(user => user.id === id);
}

export async function getVisitors(): Promise<User[]> {
    return mockUsers.filter(u => u.role === 'Visitor' || u.role === 'Worker');
}
