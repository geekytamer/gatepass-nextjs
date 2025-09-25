'use client'

import { useState } from 'react';
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
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { getUsers } from '@/services/userService';
import type { User as UserType } from '@/lib/types';

export default function ScanPage() {
    const [isScanning, setIsScanning] = useState(false);
    const [scannedUser, setScannedUser] = useState<UserType | null>(null);
    const { toast } = useToast();

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
    <div className="flex flex-col items-center justify-center h-full min-h-[calc(100vh-10rem)] text-center p-4">
        <div className="p-6 bg-primary/10 rounded-full">
            <ScanLine className="h-12 w-12 md:h-16 md:w-16 text-primary" />
        </div>
        <div className="space-y-2 mt-6">
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Gate Scanning</h1>
            <p className="text-muted-foreground max-w-md mx-auto">
            Ready to scan QR codes for check-in and check-out. Position the user's QR code in front of the camera.
            </p>
        </div>
        <Button size="lg" onClick={handleScan} className="mt-6">
            <ScanLine className="mr-2 h-5 w-5" />
            Simulate Scan
        </Button>

         <Dialog open={isScanning} onOpenChange={handleClose}>
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
                 <Button variant="ghost" size="icon" className="absolute top-4 right-4" onClick={handleClose}>
                    <X className="h-4 w-4" />
                </Button>
            </DialogContent>
        </Dialog>
    </div>
  );
}
