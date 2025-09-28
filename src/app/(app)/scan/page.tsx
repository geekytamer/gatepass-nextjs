
'use client'

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { Button } from '@/components/ui/button';
import { ScanLine, Check, LogOut, User, Building, X, CameraOff, AlertTriangle, FileSearch, ShieldX, UserPlus, Camera as CameraIcon } from 'lucide-react';
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
import { collection, doc, getDoc, addDoc, serverTimestamp, onSnapshot, query, where, getDocs, Timestamp } from 'firebase/firestore';
import type { User as UserType, Site, AccessRequest } from '@/lib/types';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { format } from 'date-fns';
import { Input } from '@/components/ui/input';
import Image from 'next/image';

const QR_SCANNER_ELEMENT_ID = 'qr-scanner';

type ScanState = 'scanning' | 'user-found' | 'no-user' | 'visitor-register';
type AccessStatus = 'approved' | 'denied-no-request' | 'denied-access-issue';

export default function ScanPage() {
    const [scannedUser, setScannedUser] = useState<UserType | null>(null);
    const [sites, setSites] = useState<Site[]>([]);
    const [selectedSiteId, setSelectedSiteId] = useState<string | null>(null);
    const [loadingSites, setLoadingSites] = useState(true);
    const { toast } = useToast();
    const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
    const scannerRef = useRef<Html5Qrcode | null>(null);
    const [scanState, setScanState] = useState<ScanState>('scanning');
    const [accessStatus, setAccessStatus] = useState<AccessStatus | null>(null);
    const [isScanning, setIsScanning] = useState(false);
    
    // Visitor registration form state
    const [visitorName, setVisitorName] = useState('');
    const [visitorCompany, setVisitorCompany] = useState('');
    const [visitorIdCardImage, setVisitorIdCardImage] = useState<string | null>(null);
    const idCardInputRef = useRef<HTMLInputElement>(null);

    const firestore = useFirestore();
    const selectedSite = sites.find(s => s.id === selectedSiteId);

    useEffect(() => {
        if (!firestore) return;
        setLoadingSites(true);
        const sitesUnsub = onSnapshot(collection(firestore, "sites"), (snapshot) => {
            const sitesData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Site));
            setSites(sitesData);
            if (sitesData.length > 0 && !selectedSiteId) {
                setSelectedSiteId(sitesData[0].id);
            }
            setLoadingSites(false);
        });
        return () => sitesUnsub();
    }, [firestore, selectedSiteId]);

    const stopScanner = useCallback(() => {
        if (scannerRef.current && scannerRef.current.isScanning) {
            scannerRef.current.stop().catch(err => console.error("Failed to stop scanner", err));
        }
        setIsScanning(false);
    }, []);

    const handleScanSuccess = useCallback(async (decodedText: string) => {
        if (!firestore || !selectedSiteId) return;
        stopScanner();
        
        try {
            const userRef = doc(firestore, "users", decodedText);
            const userSnap = await getDoc(userRef);

            if (userSnap.exists()) {
                const user = { id: userSnap.id, ...userSnap.data() } as UserType;
                setScannedUser(user);

                if (user.role === 'Worker') {
                    // For workers, check for an approved access request for today
                    const todayStr = format(new Date(), "yyyy-MM-dd");
                    const requestsQuery = query(
                        collection(firestore, "accessRequests"),
                        where("userId", "==", user.id),
                        where("siteId", "==", selectedSiteId),
                        where("status", "==", "Approved"),
                        where("date", "==", todayStr)
                    );
                    const requestsSnap = await getDocs(requestsQuery);
                    
                    if (!requestsSnap.empty) {
                        setAccessStatus('approved');
                    } else {
                        setAccessStatus('denied-no-request');
                    }
                } else {
                    // Admin, Manager, Security have implicit access. Visitors registered on the spot also get access.
                    setAccessStatus('approved');
                }
                setScanState('user-found');

            } else {
                toast({ variant: 'destructive', title: 'Unknown User', description: `User ID "${decodedText}" not found. Register as new visitor.`});
                setScanState('no-user');
            }
        } catch (e) {
             console.error(e);
             toast({ variant: 'destructive', title: 'Error', description: 'Could not fetch user details.'});
             handleClose();
        }
    }, [firestore, selectedSiteId, stopScanner, toast]);

    const restartScanner = useCallback(() => {
        if (!firestore || isScanning || hasCameraPermission === false || !selectedSiteId) {
            return;
        }
        const start = async () => {
            setIsScanning(true);
            setScanState('scanning');
            try {
                const devices = await Html5Qrcode.getCameras();
                if (devices && devices.length) {
                    setHasCameraPermission(true);
                    const scanner = new Html5Qrcode(QR_SCANNER_ELEMENT_ID, { verbose: false });
                    scannerRef.current = scanner;
                    
                    scanner.start(
                        { facingMode: "environment" },
                        { fps: 5, qrbox: {width: 250, height: 250}, useBarCodeDetectorIfSupported: true },
                        handleScanSuccess,
                        () => {}
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
    }, [firestore, hasCameraPermission, isScanning, selectedSiteId, handleScanSuccess]);

    useEffect(() => {
        restartScanner();
        return () => stopScanner();
    }, [restartScanner, stopScanner]);

    const handleIdCardSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (file) {
        if (file.size > 2 * 1024 * 1024) { // 2MB limit
            toast({ variant: 'destructive', title: 'File Too Large', description: 'Please select an image smaller than 2MB.' });
            return;
        }
        const reader = new FileReader();
        reader.onload = (e) => setVisitorIdCardImage(e.target?.result as string);
        reader.readAsDataURL(file);
      }
    };

    const handleRegisterVisitorAndCheckIn = async () => {
        if (!firestore || !visitorName || !visitorIdCardImage || !selectedSiteId) {
            toast({ variant: 'destructive', title: 'Missing Information', description: 'Please provide name, ID card image, and select a site.' });
            return;
        }
        try {
            // 1. Create the new visitor profile
            const newUser = {
                name: visitorName,
                company: visitorCompany,
                email: `visitor_${Date.now()}@gatepass.local`,
                role: 'Visitor' as const,
                avatarUrl: `https://picsum.photos/seed/${Date.now()}/200/200`,
                idCardImageUrl: visitorIdCardImage,
                createdAt: serverTimestamp()
            };
            const docRef = await addDoc(collection(firestore, "users"), newUser);
            
            toast({ title: 'Visitor Registered', description: `${visitorName} has been created.` });
            
            // 2. Log the check-in activity immediately
            await addDoc(collection(firestore, "gateActivity"), {
                userId: docRef.id,
                userName: newUser.name,
                userAvatar: newUser.avatarUrl,
                timestamp: serverTimestamp(),
                type: 'Check-in',
                gate: `${selectedSite?.name} Main Gate`,
                siteId: selectedSiteId,
            });
            toast({ title: `Check-in Successful`, description: `${newUser.name} has been checked in.` });

            // 3. Close the dialog and reset the state
            handleClose();

        } catch (error) {
            console.error("Error registering visitor:", error);
            toast({ variant: 'destructive', title: 'Registration Failed', description: 'Could not create visitor profile.' });
        }
    }
    
    const handleClose = () => {
        setScannedUser(null);
        setAccessStatus(null);
        setScanState('scanning');
        setVisitorName('');
        setVisitorCompany('');
        setVisitorIdCardImage(null);
        if (idCardInputRef.current) {
            idCardInputRef.current.value = '';
        }
        restartScanner();
    }
    
    const handleActivity = async (type: 'Check-in' | 'Check-out') => {
        if (!scannedUser || !firestore || !selectedSiteId) return;

        try {
            await addDoc(collection(firestore, "gateActivity"), {
                userId: scannedUser.id,
                userName: scannedUser.name,
                userAvatar: scannedUser.avatarUrl,
                timestamp: serverTimestamp(),
                type: type,
                gate: `${selectedSite?.name} Main Gate`,
                siteId: selectedSiteId,
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
        <div className="w-full max-w-md mx-auto space-y-4">
            {loadingSites ? <Skeleton className="h-10 w-full" /> : (
                <Select value={selectedSiteId || ''} onValueChange={setSelectedSiteId} disabled={!sites.length}>
                    <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select a site to begin scanning..." />
                    </SelectTrigger>
                    <SelectContent>
                        {sites.map(site => (
                            <SelectItem key={site.id} value={site.id}>{site.name}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            )}

             <Card className="relative aspect-video bg-muted rounded-md overflow-hidden border flex items-center justify-center">
                 {hasCameraPermission === null ? (
                    <div className="text-muted-foreground">Initializing Camera...</div>
                 ) : hasCameraPermission && selectedSiteId ? (
                    <div id={QR_SCANNER_ELEMENT_ID} className="w-full h-full [&>video]:w-full [&>video]:h-full [&>video]:object-cover [&>div>img]:hidden [&>div>button]:hidden" />
                 ) : !selectedSiteId ? (
                    <div className="text-muted-foreground p-4">Please select a site to start the scanner.</div>
                 ) : (
                    <div className="flex flex-col items-center gap-2 text-destructive p-4">
                        <CameraOff className="h-10 w-10" />
                        <span className="font-semibold">Camera Not Available</span>
                        <p className="text-sm text-muted-foreground">Could not access the camera. Please check your browser permissions.</p>
                    </div>
                 )}
                 { hasCameraPermission && selectedSiteId && scanState === 'scanning' && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <div className="w-[250px] h-[250px] border-4 border-primary/50 rounded-lg shadow-inner-strong" style={{boxShadow: '0 0 0 9999px hsla(0, 0%, 0%, 0.5)'}}/>
                    </div>
                )}
            </Card>
             { hasCameraPermission === false && (
                <Alert variant="destructive" className="mt-4 text-left">
                        <AlertTitle>Camera Access Required</AlertTitle>
                        <AlertDescription>
                           Please allow camera access in your browser to use the scanner.
                        </AlertDescription>
                </Alert>
            )}
        </div>
       
        <div className="space-y-2">
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Gate Scanning</h1>
            <p className="text-muted-foreground max-w-md mx-auto">
                {scanState === 'scanning' ? 'Position a user\'s QR code inside the frame to scan.' : 'Awaiting action...'}
            </p>
        </div>

        <Button size="lg" onClick={() => setScanState('visitor-register')} disabled={!selectedSiteId}>
            <UserPlus className="mr-2 h-5 w-5" />
            Register New Visitor
        </Button>

        <Dialog open={scanState !== 'scanning'} onOpenChange={(open) => !open && handleClose()}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>
                        {scanState === 'user-found' && 'Scan Successful'}
                        {scanState === 'no-user' && 'Unknown User'}
                        {scanState === 'visitor-register' && 'Register New Visitor'}
                    </DialogTitle>
                     <DialogDescription>
                        {scanState === 'user-found' && 'User profile found. Please verify and proceed.'}
                        {scanState === 'no-user' && 'This QR code is not associated with any user.'}
                        {scanState === 'visitor-register' && 'Enter the visitor\'s details to grant access.'}
                    </DialogDescription>
                </DialogHeader>

                {scanState === 'user-found' && scannedUser && (
                    <>
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
                            <div className="text-center space-y-4">
                               {accessStatus === 'approved' ? (
                                    <Badge className="bg-green-500/20 text-green-700 border-transparent hover:bg-green-500/30 text-base py-1 px-3">
                                        <Check className="mr-2 h-5 w-5"/>
                                        Access Approved
                                    </Badge>
                               ) : (
                                    <Badge variant="destructive" className="text-base py-1 px-3">
                                        <ShieldX className="mr-2 h-5 w-5"/>
                                        Access Denied
                                    </Badge>
                               )}
                                {accessStatus === 'denied-no-request' && (
                                    <Alert variant="destructive">
                                        <AlertTriangle className="h-4 w-4" />
                                        <AlertTitle>No Access Request Found</AlertTitle>
                                        <AlertDescription>
                                            This worker does not have an approved access request for today at this site.
                                        </AlertDescription>
                                    </Alert>
                                )}
                            </div>
                        </div>
                        <DialogFooter className="grid grid-cols-2 gap-2">
                            <Button variant="outline" onClick={() => handleActivity('Check-out')}><LogOut className="mr-2 h-4 w-4" /> Check-out</Button>
                            <Button onClick={() => handleActivity('Check-in')} disabled={accessStatus !== 'approved'}><Check className="mr-2 h-4 w-4" /> Check-in</Button>
                        </DialogFooter>
                    </>
                )}

                {scanState === 'no-user' && (
                    <div className="flex flex-col items-center justify-center p-8 space-y-4">
                        <FileSearch className="h-12 w-12 text-destructive" />
                        <p className="text-muted-foreground">No matching user profile found in the database.</p>
                        <Button onClick={() => setScanState('visitor-register')}>
                            <UserPlus className="mr-2 h-4 w-4" />
                            Register as New Visitor
                        </Button>
                    </div>
                )}

                {scanState === 'visitor-register' && (
                     <div className="grid gap-4 py-4">
                        <Input placeholder="Full Name" value={visitorName} onChange={(e) => setVisitorName(e.target.value)} />
                        <Input placeholder="Company (Optional)" value={visitorCompany} onChange={(e) => setVisitorCompany(e.target.value)} />
                        <Input type="file" accept="image/*" capture="environment" className="hidden" ref={idCardInputRef} onChange={handleIdCardSelect} />
                        <Button variant="outline" onClick={() => idCardInputRef.current?.click()}>
                           <CameraIcon className="mr-2 h-4 w-4"/>
                           {visitorIdCardImage ? 'Recapture ID Card' : 'Capture ID Card'}
                        </Button>
                        {visitorIdCardImage && <Image src={visitorIdCardImage} alt="ID card preview" width={200} height={125} className="rounded-md border object-contain mx-auto" />}
                     </div>
                )}
                 {scanState === 'visitor-register' && (
                     <DialogFooter>
                        <Button onClick={handleRegisterVisitorAndCheckIn} disabled={!visitorName || !visitorIdCardImage}>Register and Check-in</Button>
                    </DialogFooter>
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

    