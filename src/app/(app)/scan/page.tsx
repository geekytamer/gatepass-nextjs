'use client'

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { ScanLine, UserPlus } from 'lucide-react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { useFirestore } from '@/firebase';
import type { User as UserType, Site, AccessRequest } from '@/lib/types';
import { collection, doc, getDoc, addDoc, serverTimestamp, query, where, getDocs, onSnapshot, Timestamp } from 'firebase/firestore';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Building, AlertTriangle } from 'lucide-react';
import { useAuthProtection } from '@/hooks/use-auth-protection';
import { format } from 'date-fns';
import { ScannerPreview } from '@/components/scan/scanner-preview';
import { UserFoundDialog } from '@/components/scan/user-found-dialog';
import { VisitorRegistrationDialog } from '@/components/scan/visitor-registration-dialog';
import { Toast } from '@radix-ui/react-toast';

type DialogState = 'closed' | 'user-found' | 'no-user' | 'visitor-register';

export default function ScanPage() {
    const { firestoreUser: currentSecurityUser, loading: authLoading, isAuthorized, UnauthorizedComponent } = useAuthProtection(['Security']);
    const [scannedUser, setScannedUser] = useState<UserType | null>(null);
    const [assignedSite, setAssignedSite] = useState<Site | null>(null);
    const [loadingSite, setLoadingSite] = useState(true);
    const [dialogState, setDialogState] = useState<DialogState>('closed');
    const [accessStatus, setAccessStatus] = useState<'approved' | 'denied-no-request' | null>(null);
    
    const { toast } = useToast();
    const firestore = useFirestore();

    // Fetch the security user's assigned site
    useEffect(() => {
        if (!firestore || !currentSecurityUser?.assignedSiteId) {
            setLoadingSite(false);
            return;
        };

        setLoadingSite(true);
        const siteDocRef = doc(firestore, "sites", currentSecurityUser.assignedSiteId);
        const siteUnsub = onSnapshot(siteDocRef, (docSnap) => {
            if (docSnap.exists()) {
                setAssignedSite({ id: docSnap.id, ...docSnap.data() } as Site);
            } else {
                setAssignedSite(null);
                toast({ variant: 'destructive', title: 'Site Error', description: 'Assigned site not found.' });
            }
            setLoadingSite(false);
        });

        return () => siteUnsub();
    }, [firestore, currentSecurityUser, toast]);

    const handleScanSuccess = async (userId: string) => {
        if (!firestore || !assignedSite) return;

        try {
            const userRef = doc(firestore, "users", userId);
            const userSnap = await getDoc(userRef);

            if (userSnap.exists()) {
                const user = { id: userSnap.id, ...userSnap.data() } as UserType;
                setScannedUser(user);

                // Check for approved access request if the user is a 'Worker'
                if (user.role === 'Worker') {
                    const todayStr = format(new Date(), "yyyy-MM-dd");
                    const requestsQuery = query(
                        collection(firestore, "accessRequests"),
                        where("userId", "==", user.id),
                        where("siteId", "==", assignedSite.id),
                        where("status", "==", "Approved"),
                        where("date", "==", todayStr)
                    );
                    const requestsSnap = await getDocs(requestsQuery);
                    setAccessStatus(requestsSnap.empty ? 'denied-no-request' : 'approved');
                } else {
                    // For non-workers, access is approved by default on successful scan
                    setAccessStatus('approved');
                }
                setDialogState('user-found');

            } else {
                toast({ variant: 'destructive', title: 'Unknown User', description: `User ID "${userId}" not found.`});
                setDialogState('no-user');
            }
        } catch (e) {
             console.error(e);
             toast({ variant: 'destructive', title: 'Error', description: 'Could not fetch user details.'});
             setDialogState('closed');
        }
    };
    
    const handleCloseDialog = () => {
        setDialogState('closed');
        setScannedUser(null);
        setAccessStatus(null);
    }
    
    if (authLoading) {
        return (
            <div className="flex flex-col items-center justify-center h-full min-h-[calc(100vh-10rem)] text-center p-4 space-y-6">
                <Skeleton className="w-full max-w-md h-16" />
                <Skeleton className="w-full max-w-md aspect-video" />
                <Skeleton className="h-10 w-48" />
            </div>
        )
    }

    if (!isAuthorized) {
        return <UnauthorizedComponent />;
    }

    return (
    <div className="flex flex-col items-center justify-center h-full min-h-[calc(100vh-10rem)] text-center p-4 space-y-6">
        <div className="w-full max-w-md mx-auto space-y-4">
            <Card className="flex items-center justify-between p-3 bg-muted/50">
                <div className="flex items-center gap-3">
                    <Building className="h-5 w-5 text-muted-foreground" />
                    <span className="font-semibold">Site:</span>
                </div>
                {loadingSite ? (
                    <Skeleton className="h-6 w-48" />
                ) : (
                    <span className="font-bold text-lg">{assignedSite?.name || 'No Site Assigned'}</span>
                )}
            </Card>

            <ScannerPreview 
                onScanSuccess={handleScanSuccess} 
                isPaused={dialogState !== 'closed'}
            />
        </div>
       
        <div className="space-y-2">
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Gate Scanning</h1>
            <p className="text-muted-foreground max-w-md mx-auto">
                Position a user's QR code inside the frame to scan.
            </p>
        </div>

        <div className="space-x-4">
            <Button size="lg" onClick={() => setDialogState('visitor-register')} disabled={!assignedSite || loadingSite}>
                <UserPlus className="mr-2 h-5 w-5" />
                Register New Visitor
            </Button>
        </div>

        <Dialog open={dialogState !== 'closed'} onOpenChange={(open) => !open && handleCloseDialog()}>
            <DialogContent className="sm:max-w-md">
                 {dialogState === 'user-found' && scannedUser && (
                    <UserFoundDialog 
                        scannedUser={scannedUser}
                        accessStatus={accessStatus}
                        assignedSite={assignedSite!}
                        onClose={handleCloseDialog}
                    />
                 )}
                 {dialogState === 'visitor-register' && assignedSite && (
                     <VisitorRegistrationDialog
                        assignedSite={assignedSite}
                        onClose={handleCloseDialog}
                     />
                 )}
                 {dialogState === 'no-user' && (
                     <Alert variant="destructive">
                        <AlertTriangle className="h-4 w-4" />
                        <AlertTitle>Unknown User</AlertTitle>
                        <AlertDescription>
                            This QR code is not associated with any user. They can be registered as a new visitor.
                        </AlertDescription>
                     </Alert>
                 )}
            </DialogContent>
        </Dialog>
    </div>
  );
}
