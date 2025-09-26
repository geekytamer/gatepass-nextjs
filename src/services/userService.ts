// src/services/userService.ts
import type { User, UserRole } from '@/lib/types';
import { PlaceHolderImages } from '@/lib/placeholder-images';

const initialUsers: User[] = [
  { id: 'usr_001', name: 'Admin User', email: 'admin@gatepass.com', role: 'Admin', avatarUrl: PlaceHolderImages[0].imageUrl },
  { id: 'usr_002', name: 'Emily Manager', email: 'emily.m@corp.com', role: 'Manager', avatarUrl: PlaceHolderImages[1].imageUrl, company: 'Corp Inc.' },
  { id: 'usr_003', name: 'John Security', email: 'john.s@gatepass.com', role: 'Security', avatarUrl: PlaceHolderImages[2].imageUrl },
  { id: 'usr_004', name: 'Sarah Visitor', email: 'sarah.v@visitor.com', role: 'Visitor', avatarUrl: PlaceHolderImages[3].imageUrl, company: 'Guest' },
  { id: 'usr_005', name: 'Mike Worker', email: 'mike.w@construct.co', role: 'Worker', avatarUrl: PlaceHolderImages[4].imageUrl, company: 'Construct Co.' },
  { id: 'usr_006', name: 'David Tools', email: 'david.t@construct.co', role: 'Worker', avatarUrl: PlaceHolderImages[5].imageUrl, company: 'Construct Co.' },
  { id: 'usr_007', name: 'Olivia Project', email: 'olivia.p@corp.com', role: 'Manager', avatarUrl: PlaceHolderImages[0].imageUrl, company: 'Corp Inc.' },
  { id: 'usr_008', name: 'Daniel Guard', email: 'daniel.g@gatepass.com', role: 'Security', avatarUrl: PlaceHolderImages[1].imageUrl },
];

const getStoredUsers = (): User[] => {
  if (typeof window === 'undefined') return initialUsers;
  const stored = localStorage.getItem('gatepass_users');
  if (stored) {
    return JSON.parse(stored);
  }
  localStorage.setItem('gatepass_users', JSON.stringify(initialUsers));
  return initialUsers;
};

const setStoredUsers = (users: User[]) => {
  if (typeof window === 'undefined') return;
  localStorage.setItem('gatepass_users', JSON.stringify(users));
};

export async function getUsers(): Promise<User[]> {
  return getStoredUsers();
}

export async function getUser(id: string): Promise<User | undefined> {
  const users = getStoredUsers();
  return users.find(user => user.id === id);
}

export async function getVisitors(): Promise<User[]> {
  const users = getStoredUsers();
  return users.filter(u => u.role === 'Visitor' || u.role === 'Worker');
}

export async function addUser(newUser: Omit<User, 'id' | 'avatarUrl'>): Promise<User> {
    const users = getStoredUsers();
    const userWithId: User = {
        ...newUser,
        id: `usr_${Date.now()}`,
        avatarUrl: `https://picsum.photos/seed/${Date.now()}/200/200`,
    };
    const updatedUsers = [userWithId, ...users];
    setStoredUsers(updatedUsers);
    return userWithId;
}

export async function updateUserRole(userId: string, newRole: UserRole): Promise<User | undefined> {
    const users = getStoredUsers();
    const userIndex = users.findIndex(u => u.id === userId);
    if (userIndex === -1) return undefined;

    const updatedUser = { ...users[userIndex], role: newRole };
    users[userIndex] = updatedUser;
    setStoredUsers(users);
    return updatedUser;
}

export async function deleteUser(userId: string): Promise<boolean> {
    let users = getStoredUsers();
    const initialLength = users.length;
    users = users.filter(u => u.id !== userId);
    if (users.length < initialLength) {
        setStoredUsers(users);
        return true;
    }
    return false;
}
