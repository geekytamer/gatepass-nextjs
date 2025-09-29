
'use client';
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { QrCode } from '@/components/qr-code';
import { useFirestore } from '@/firebase';
import { useUser } from '@/firebase/auth/use-user';
import { doc, onSnapshot } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import type { User } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { ShieldCheck, AlertTriangle, KeyRound } from 'lucide-react';
import { format, isBefore, parseISO } from 'date-fns';
import { useRouter } from 'next/navigation';

export default function ProfilePage() {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const firestore = useFirestore();
    const { user: authUser, loading: authLoading } = useUser(); 
    const router = useRouter();

    useEffect(() => {
        if (!authLoading && !authUser) {
          setLoading(false);
          return;
        }

        if (firestore && authUser) {
            const userRef = doc(firestore, 'users', authUser.uid);
            const unsubscribe = onSnapshot(userRef, (docSnap) => {
                if (docSnap.exists()) {
                    setUser({ id: docSnap.id, ...docSnap.data() } as User);
                } else {
                    setUser(null);
                }
                setLoading(false);
            }, (error) => {
                console.error("Error fetching user profile:", error);
                setUser(null);
                setLoading(false);
            });

            return () => unsubscribe();
        }
    }, [firestore, authUser, authLoading]);

    const isCertificateExpired = (expiryDate?: string) => {
        if (!expiryDate) return false;
        return isBefore(parseISO(expiryDate), new Date());
    };

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
      <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
            <h1 className="text-3xl font-bold tracking-tight">My Profile & QR Code</h1>
            <p className="text-muted-foreground">Present this QR code at any gate for scanning.</p>
        </div>
        <Button onClick={() => router.push('/activate-account')}>
            <KeyRound className="mr-2 h-4 w-4"/>
            Change Password
        </Button>
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

       {user.certificates && user.certificates.length > 0 && (
          <Card>
            <CardHeader>
                <CardTitle>My Certificates</CardTitle>
                <CardDescription>These are the certificate records associated with your profile.</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {user.certificates.map((cert, index) => {
                    const isExpired = isCertificateExpired(cert.expiryDate);
                    return (
                        <Card key={index} className="flex flex-col">
                            <CardHeader className="flex-row items-start gap-3 space-y-0">
                                <ShieldCheck className="h-6 w-6 text-primary mt-1" />
                                <div className="flex-1">
                                    <CardTitle className="text-lg">{cert.name}</CardTitle>
                                    {cert.expiryDate ? (
                                        <CardDescription className={isExpired ? "text-destructive font-semibold" : ""}>
                                            Expires: {format(parseISO(cert.expiryDate), 'PPP')}
                                        </CardDescription>
                                    ) : (
                                        <CardDescription>No expiry date</CardDescription>
                                    )}
                                </div>
                                 {isExpired && <AlertTriangle className="h-5 w-5 text-destructive" />}
                            </CardHeader>
                        </Card>
                    )
                })}
            </CardContent>
        </Card>
      )}
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

    

    