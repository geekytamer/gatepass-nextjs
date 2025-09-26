
'use client';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { QrCode } from '@/components/qr-code';
import { useFirestore } from '@/firebase';
import { doc, onSnapshot } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import type { User } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';

export default function ProfilePage() {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const firestore = useFirestore();
    const userId = 'usr_001'; // In a real app, this would come from an auth hook

    useEffect(() => {
        if (!firestore || !userId) return;
        setLoading(true);
        const userRef = doc(firestore, 'users', userId);
        const unsubscribe = onSnapshot(userRef, (docSnap) => {
            if (docSnap.exists()) {
                setUser({ id: docSnap.id, ...docSnap.data() } as User);
            } else {
                setUser(null);
            }
            setLoading(false);
        });
        return () => unsubscribe();
    }, [firestore, userId]);

    if (loading) {
        return <ProfileSkeleton />;
    }

    if (!user) {
        return (
             <div className="space-y-4 md:space-y-6">
                <header>
                    <h1 className="text-3xl font-bold tracking-tight">My Profile & QR Code</h1>
                    <p className="text-muted-foreground">Present this QR code at any gate for scanning.</p>
                </header>
                <Card>
                    <CardContent className="p-8 text-center">
                        <p>User profile not found.</p>
                    </CardContent>
                </Card>
            </div>
        )
    }

  return (
    <div className="space-y-4 md:space-y-6">
      <header>
        <h1 className="text-3xl font-bold tracking-tight">My Profile & QR Code</h1>
        <p className="text-muted-foreground">Present this QR code at any gate for scanning.</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="md:col-span-1 flex flex-col items-center justify-center p-6 md:p-8 text-center">
            <Avatar className="h-24 w-24 mb-4">
                <AvatarImage src={user.avatarUrl} alt={user.name} />
                <AvatarFallback>{user.name.slice(0, 2).toUpperCase()}</AvatarFallback>
            </Avatar>
            <h2 className="text-2xl font-semibold">{user.name}</h2>
            <p className="text-muted-foreground">{user.email}</p>
            <Badge className="mt-4" variant="default">{user.role}</Badge>
        </Card>
        <Card className="md:col-span-2">
            <CardHeader>
                <CardTitle>Your Access QR Code</CardTitle>
                <CardDescription>This unique code contains your user ID. It can only be scanned by the GatePass system.</CardDescription>
            </CardHeader>
            <CardContent className="flex items-center justify-center p-4 sm:p-8">
                <div className="w-48 h-48 sm:w-64 sm:h-64 p-4 border rounded-lg bg-white">
                    <QrCode value={user.id} />
                </div>
            </CardContent>
        </Card>
      </div>
    </div>
  );
}

function ProfileSkeleton() {
    return (
         <div className="space-y-4 md:space-y-6">
            <header>
                <Skeleton className="h-9 w-3/4" />
                <Skeleton className="h-4 w-1/2 mt-2" />
            </header>
             <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="md:col-span-1 flex flex-col items-center justify-center p-6 md:p-8 text-center">
                    <Skeleton className="h-24 w-24 rounded-full mb-4" />
                    <Skeleton className="h-7 w-3/4 mb-2" />
                    <Skeleton className="h-4 w-1/2" />
                    <Skeleton className="h-6 w-16 mt-4 rounded-full" />
                </Card>
                 <Card className="md:col-span-2">
                    <CardHeader>
                         <Skeleton className="h-7 w-1/2" />
                         <Skeleton className="h-4 w-full mt-2" />
                    </CardHeader>
                    <CardContent className="flex items-center justify-center p-4 sm:p-8">
                        <Skeleton className="w-48 h-48 sm:w-64 sm:h-64" />
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

