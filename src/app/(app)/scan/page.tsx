'use client'

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { ScanLine, Check, LogOut, User, Building, X } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { getUsers } from '@/services/userService';
import type { User as UserType } from '@/lib/types';

export default function ScanPage() {
    const [isScanning, setIsScanning] = useState(false);
    const [scannedUser, setScannedUser] = useState<UserType | null>(null);
    const { toast } = useToast();
    const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
    const videoRef = React.useRef<HTMLVideoElement>(null);


    useEffect(() => {
        const getCameraPermission = async () => {
          try {
            if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
                // For environments where camera is not available (like during server-side rendering or in a secure context)
                setHasCameraPermission(false);
                console.warn('Camera API not available.');
                return;
            }
            const stream = await navigator.mediaDevices.getUserMedia({video: true});
            setHasCameraPermission(true);
    
            if (videoRef.current) {
              videoRef.current.srcObject = stream;
            }
          } catch (error) {
            console.error('Error accessing camera:', error);
            setHasCameraPermission(false);
            toast({
              variant: 'destructive',
              title: 'Camera Access Denied',
              description: 'Please enable camera permissions in your browser settings to use this feature.',
            });
          }
        };
    
        getCameraPermission();
      }, [toast]);


    const handleScan = async () => {
        setIsScanning(true);
        // Simulate scanning a random user
        setTimeout(async () => {
            try {
                const users = await getUsers();
                const randomUser = users[Math.floor(Math.random() * users.length)];
                setScannedUser(randomUser);
            } catch (e) {
                console.error(e);
                toast({ variant: 'destructive', title: 'Error', description: 'Could not fetch users to simulate scan.'});
                handleClose();
            }
        }, 1000);
    }

    const handleClose = () => {
        setIsScanning(false);
        setScannedUser(null);
    }

    const handleCheckIn = () => {
        toast({ title: 'Check-in Successful', description: `${scannedUser?.name} has been checked in.` });
        handleClose();
    }
    
    const handleCheckOut = () => {
        toast({ title: 'Check-out Successful', description: `${scannedUser?.name} has been checked out.` });
        handleClose();
    }

  return (
    <div className="flex flex-col items-center justify-center h-full min-h-[calc(100vh-10rem)] text-center p-4 space-y-6">
        <div className="w-full max-w-md mx-auto">
            <div className="relative aspect-video bg-muted rounded-md overflow-hidden border">
                <video ref={videoRef} className="w-full h-full object-cover" autoPlay muted playsInline />
                <div className="absolute inset-0 flex items-center justify-center">
                    <ScanLine className="h-1/2 w-1/2 text-primary/50" />
                </div>
            </div>
             { hasCameraPermission === false && (
                <Alert variant="destructive" className="mt-4">
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
                Ready to scan QR codes. Position the user's QR code in front of the camera or use the simulation.
            </p>
        </div>
        <Button size="lg" onClick={handleScan}>
            <ScanLine className="mr-2 h-5 w-5" />
            Simulate Scan
        </Button>

         <Dialog open={!!scannedUser} onOpenChange={handleClose}>
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
                            <Button variant="outline" onClick={handleCheckOut}><LogOut className="mr-2 h-4 w-4" /> Check-out</Button>
                            <Button onClick={handleCheckIn}><Check className="mr-2 h-4 w-4" /> Check-in</Button>
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
