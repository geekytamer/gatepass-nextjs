
'use client'

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { Button } from '@/components/ui/button';
import { ScanLine, Check, LogOut, User, Building, X, CameraOff } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose
} from '@/components/ui/dialog';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useFirestore } from '@/firebase';
import { collection, doc, getDoc, getDocs, addDoc, serverTimestamp } from 'firebase/firestore';
import type { User as UserType } from '@/lib/types';
import { Card } from '@/components/ui/card';


const QR_SCANNER_ELEMENT_ID = 'qr-scanner';

export default function ScanPage() {
    const [scannedUser, setScannedUser] = useState<UserType | null>(null);
    const { toast } = useToast();
    const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
    const scannerRef = useRef<Html5Qrcode | null>(null);
    const [isScanning, setIsScanning] = useState(false);
    const firestore = useFirestore();
    
    const restartScanner = useCallback(() => {
        if (!firestore || (scannerRef.current && scannerRef.current.isScanning) || hasCameraPermission === false) {
            return;
        }

        const start = async () => {
            setIsScanning(true);
            try {
                const devices = await Html5Qrcode.getCameras();
                if (devices && devices.length) {
                    setHasCameraPermission(true);

                    const scanner = new Html5Qrcode(QR_SCANNER_ELEMENT_ID, { verbose: false });
                    scannerRef.current = scanner;

                    const onScanSuccess = async (decodedText: string) => {
                        console.log(`Scan result: ${decodedText}`);
                        if (scannerRef.current?.isScanning) {
                            await scannerRef.current.stop();
                            setIsScanning(false);
                        }
                        
                        try {
                            const userRef = doc(firestore, "users", decodedText);
                            const userSnap = await getDoc(userRef);

                            if (userSnap.exists()) {
                                setScannedUser({ id: userSnap.id, ...userSnap.data() } as UserType);
                            } else {
                                toast({ variant: 'destructive', title: 'Scan Error', description: `User with ID "${decodedText}" not found.`});
                                restartScanner();
                            }
                        } catch (e) {
                             console.error(e);
                             toast({ variant: 'destructive', title: 'Error', description: 'Could not fetch user details.'});
                             restartScanner();
                        }
                    };
                    
                    scanner.start(
                        { facingMode: "environment" },
                        { fps: 10, qrbox: {width: 250, height: 250}, useBarCodeDetectorIfSupported: true },
                        onScanSuccess,
                        () => {} // Ignore scan error
                    ).catch(err => {
                        console.error("Scanner start error:", err);
                        setIsScanning(false);
                    });
                } else {
                   setHasCameraPermission(false);
                   setIsScanning(false);
                }
            } catch (err) {
                 console.error('Camera initialization error:', err);
                 setHasCameraPermission(false);
                 setIsScanning(false);
            }
        };

        start();
    }, [firestore, hasCameraPermission, toast]);

    useEffect(() => {
        restartScanner();
        
        return () => {
            if (scannerRef.current && scannerRef.current.isScanning) {
                scannerRef.current.stop().catch(err => console.error("Failed to stop scanner", err));
            }
            scannerRef.current = null;
        };
    }, [restartScanner]);


    const handleClose = () => {
        setScannedUser(null);
        restartScanner();
    }
    
    const handleSimulateScan = async () => {
        if (!firestore) return;
        if (scannerRef.current && scannerRef.current.isScanning) {
            await scannerRef.current.stop();
            setIsScanning(false);
        }
        try {
            const usersSnapshot = await getDocs(collection(firestore, "users"));
            const users = usersSnapshot.docs.map(doc => ({id: doc.id, ...doc.data()})) as UserType[];
            const randomUser = users[Math.floor(Math.random() * users.length)];
            setScannedUser(randomUser);
        } catch (e) {
            console.error(e);
            toast({ variant: 'destructive', title: 'Error', description: 'Could not fetch users to simulate scan.'});
            handleClose();
        }
    }

    const handleActivity = async (type: 'Check-in' | 'Check-out') => {
        if (!scannedUser || !firestore) return;

        try {
            await addDoc(collection(firestore, "gateActivity"), {
                userId: scannedUser.id,
                userName: scannedUser.name,
                userAvatar: scannedUser.avatarUrl,
                timestamp: serverTimestamp(),
                type: type,
                gate: 'Main Gate',
            });
            toast({ title: `${type} Successful`, description: `${scannedUser?.name} has been checked ${type.toLowerCase()}.` });
        } catch(e) {
             console.error("Error adding gate activity:", e);
             toast({ variant: 'destructive', title: 'Error', description: `Failed to record ${type}.`});
        }
        handleClose();
    }

  return (
    <div className="flex flex-col items-center justify-center h-full min-h-[calc(100vh-10rem)] text-center p-4 space-y-6">
        <div className="w-full max-w-md mx-auto">
             <Card className="relative aspect-video bg-muted rounded-md overflow-hidden border flex items-center justify-center">
                 {hasCameraPermission === null ? (
                    <div className="text-muted-foreground">Initializing Camera...</div>
                 ) : hasCameraPermission ? (
                    <div id={QR_SCANNER_ELEMENT_ID} className="w-full h-full [&>video]:w-full [&>video]:h-full [&>video]:object-cover [&>div>img]:hidden [&>div>button]:hidden" />
                 ) : (
                    <div className="flex flex-col items-center gap-2 text-destructive p-4">
                        <CameraOff className="h-10 w-10" />
                        <span className="font-semibold">Camera Not Available</span>
                        <p className="text-sm text-muted-foreground">Could not access the camera. Please check your browser permissions.</p>
                    </div>
                 )}
                 { hasCameraPermission && <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="w-[250px] h-[250px] border-4 border-primary/50 rounded-lg shadow-inner-strong" style={{boxShadow: '0 0 0 9999px hsla(0, 0%, 0%, 0.5)'}}/>
                </div>}
            </Card>
             { hasCameraPermission === false && (
                <Alert variant="destructive" className="mt-4 text-left">
                        <AlertTitle>Camera Access Required</AlertTitle>
                        <AlertDescription>
                           Please allow camera access in your browser to use the scanner. You can use the simulation button below for now.
                        </AlertDescription>
                </Alert>
            )}
        </div>
       
        <div className="space-y-2">
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Gate Scanning</h1>
            <p className="text-muted-foreground max-w-md mx-auto">
                Position a user's QR code inside the frame to scan it.
            </p>
        </div>
        <Button size="lg" onClick={handleSimulateScan}>
            <User className="mr-2 h-5 w-5" />
            Simulate Scan
        </Button>

         <Dialog open={!!scannedUser} onOpenChange={(open) => !open && handleClose()}>
            <DialogContent className="sm:max-w-[425px]">
                {scannedUser ? (
                    <>
                        <DialogHeader>
                            <DialogTitle>Scan Successful</DialogTitle>
                            <DialogDescription>User profile found. Please verify and proceed.</DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                            <div className="flex flex-col sm:flex-row items-center gap-4">
                                <Avatar className="h-20 w-20">
                                    <AvatarImage src={scannedUser.avatarUrl} alt={scannedUser.name} />
                                    <AvatarFallback>{scannedUser.name.slice(0, 2).toUpperCase()}</AvatarFallback>
                                </Avatar>
                                <div className="space-y-1 text-center sm:text-left">
                                    <h3 className="text-xl font-semibold">{scannedUser.name}</h3>
                                    <div className="flex items-center justify-center sm:justify-start gap-2 text-muted-foreground">
                                        <User className="h-4 w-4" /> <span>{scannedUser.role}</span>
                                    </div>
                                    <div className="flex items-center justify-center sm:justify-start gap-2 text-muted-foreground">
                                        <Building className="h-4 w-4" /> <span>{scannedUser.company || 'N/A'}</span>
                                    </div>
                                </div>
                            </div>
                            <div className="text-center">
                                <Badge className="bg-green-500/20 text-green-700 border-transparent hover:bg-green-500/30">Access Approved</Badge>
                            </div>
                        </div>
                        <DialogFooter className="grid grid-cols-2 gap-2">
                            <Button variant="outline" onClick={() => handleActivity('Check-out')}><LogOut className="mr-2 h-4 w-4" /> Check-out</Button>
                            <Button onClick={() => handleActivity('Check-in')}><Check className="mr-2 h-4 w-4" /> Check-in</Button>
                        </DialogFooter>
                    </>
                ) : (
                    <div className="flex flex-col items-center justify-center p-8 space-y-4">
                        <ScanLine className="h-12 w-12 text-primary animate-pulse" />
                        <p className="text-muted-foreground">Scanning for QR code...</p>
                    </div>
                )}
                 <DialogClose asChild>
                    <Button variant="ghost" size="icon" className="absolute top-4 right-4" onClick={handleClose}>
                        <X className="h-4 w-4" />
                    </Button>
                </DialogClose>
            </DialogContent>
        </Dialog>
    </div>
  );
}

