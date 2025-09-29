
'use client';
import { useUser } from '@/firebase/auth/use-user';
import { redirect } from 'next/navigation';

export default function Home() {
  const { user, loading } = useUser();

  if (loading) {
    return <div>Loading...</div>;
  }
  
  if (!user) {
    redirect('/login');
  } else {
    redirect('/dashboard');
  }
}
