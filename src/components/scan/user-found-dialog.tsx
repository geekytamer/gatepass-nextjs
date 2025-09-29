
'use client'

import React from 'react';
import { DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useFirestore } from '@/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import type { User, Site } from '@/lib/types';
import { Check, LogOut, User, Building, X, AlertTriangle, ShieldX } from 'lucide-react';

interface UserFoundDialogProps {
  scannedUser: User;
  accessStatus: 'approved' | 'denied-no-request' | null;
  assignedSite: Site;
  onClose: () => void;
}

export function UserFoundDialog({ scannedUser, accessStatus, assignedSite, onClose }: UserFoundDialogProps) {
  const firestore = useFirestore();
  const { toast } = useToast();

  const handleActivity = async (type: 'Check-in' | 'Check-out') => {
    if (!firestore) return;

    try {
      await addDoc(collection(firestore, "gateActivity"), {
        userId: scannedUser.id,
        userName: scannedUser.name,
        userAvatar: scannedUser.avatarUrl,
        timestamp: serverTimestamp(),
        type: type,
        gate: `${assignedSite.name} Main Gate`,
        siteId: assignedSite.id,
      });
      toast({ title: `${type} Successful`, description: `${scannedUser.name} has been checked ${type.toLowerCase()}.` });
    } catch (e) {
      console.error("Error adding gate activity:", e);
      toast({ variant: 'destructive', title: 'Error', description: `Failed to record ${type}.` });
    }
    onClose();
  };

  return (
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
        <div className="text-center space-y-4">
          {accessStatus === 'approved' ? (
            <Badge className="bg-green-500/20 text-green-700 border-transparent hover:bg-green-500/30 text-base py-1 px-3">
              <Check className="mr-2 h-5 w-5" />
              Access Approved
            </Badge>
          ) : (
            <Badge variant="destructive" className="text-base py-1 px-3">
              <ShieldX className="mr-2 h-5 w-5" />
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
       <DialogClose asChild>
          <Button variant="ghost" size="icon" className="absolute top-4 right-4" onClick={onClose}>
              <X className="h-4 w-4" />
          </Button>
      </DialogClose>
    </>
  );
}
