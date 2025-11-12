
'use client'

import React from 'react';
import { DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useFirestore } from '@/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import type { User, Site, AccessRequest, Certificate } from '@/lib/types';
import { Check, LogOut, User as UserIcon, Building, X, AlertTriangle, ShieldX, LogIn, FileWarning, CalendarDays, Briefcase } from 'lucide-react';
import { format, parseISO } from 'date-fns';

interface UserFoundDialogProps {
  scannedUser: User;
  accessStatus: 'approved' | 'denied-no-request' | 'denied-expired' | 'denied-not-started' | null;
  certificateStatus: { missing: string[], expired: string[] };
  lastActivity: 'Check-in' | 'Check-out' | null;
  assignedSite: Site;
  accessRequest: AccessRequest | null;
  workerData?: { jobTitle?: string };
  onClose: () => void;
}

export function UserFoundDialog({ scannedUser, accessStatus, certificateStatus, lastActivity, assignedSite, accessRequest, workerData, onClose }: UserFoundDialogProps) {
  const firestore = useFirestore();
  const { toast } = useToast();

  const handleActivity = async (type: 'Check-in' | 'Check-out') => {
    if (!firestore) return;

    try {
      await addDoc(collection(firestore, "gateActivity"), {
        userId: scannedUser.id,
        userName: scannedUser.name,
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

  const showCheckIn = lastActivity !== 'Check-in';
  const hasCertificateIssues = certificateStatus.missing.length > 0 || certificateStatus.expired.length > 0;
  const isAccessGranted = accessStatus === 'approved' && !hasCertificateIssues;

  const getAccessDeniedReason = () => {
    switch(accessStatus) {
        case 'denied-no-request': return 'No approved access request found for today.';
        case 'denied-expired': return 'Access request has expired.';
        case 'denied-not-started': return 'Access request validity has not started yet.';
        default: return 'Access denied due to an unknown reason.';
    }
  }
  
  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase();
  }

  return (
    <>
      <DialogHeader>
        <DialogTitle>Scan Successful</DialogTitle>
        <DialogDescription>User profile found. Please verify and proceed.</DialogDescription>
      </DialogHeader>

      <div className="grid gap-4 py-4">
        <div className="flex flex-col sm:flex-row items-center gap-4">
          <div className="h-20 w-20 flex items-center justify-center rounded-full bg-muted text-muted-foreground font-semibold text-3xl">
              {getInitials(scannedUser.name)}
          </div>
          <div className="space-y-1 text-center sm:text-left">
            <h3 className="text-xl font-semibold">{scannedUser.name}</h3>
            <div className="flex items-center justify-center sm:justify-start gap-2 text-muted-foreground">
              <UserIcon className="h-4 w-4" /> <span>{scannedUser.role}</span>
            </div>
             {workerData?.jobTitle && (
               <div className="flex items-center justify-center sm:justify-start gap-2 text-muted-foreground">
                  <Briefcase className="h-4 w-4" /> <span>{workerData.jobTitle}</span>
               </div>
             )}
            <div className="flex items-center justify-center sm:justify-start gap-2 text-muted-foreground">
              <Building className="h-4 w-4" /> <span>{scannedUser.company || 'N/A'}</span>
            </div>
             {lastActivity && (
                 <Badge variant={lastActivity === 'Check-in' ? 'default' : 'secondary'} className={lastActivity === 'Check-in' ? 'bg-blue-500/20 text-blue-700 border-transparent hover:bg-blue-500/30' : 'bg-gray-500/20 text-gray-700 border-transparent hover:bg-gray-500/30'}>
                    {lastActivity === 'Check-in' ? 'Currently On-Site' : 'Currently Off-Site'}
                </Badge>
            )}
          </div>
        </div>
        <div className="space-y-2">
           <Badge className={`w-full justify-center text-base py-1 px-3 ${isAccessGranted ? 'bg-green-500/20 text-green-700 border-transparent hover:bg-green-500/30' : 'bg-red-500/20 text-red-700 border-transparent hover:bg-red-500/30'}`}>
              {isAccessGranted ? <Check className="mr-2 h-5 w-5" /> : <ShieldX className="mr-2 h-5 w-5" />}
              {isAccessGranted ? 'Access Approved' : 'Access Denied'}
            </Badge>
        
            {accessRequest && (
              <Alert variant="default" className="flex items-start gap-3">
                <CalendarDays className="h-4 w-4 mt-1" />
                <div>
                    <AlertTitle>Access Validity</AlertTitle>
                    <AlertDescription>
                        {format(parseISO(accessRequest.validFrom!), 'PPP')} - {accessRequest.expiresAt === 'Permanent' ? 'Permanent' : format(parseISO(accessRequest.expiresAt!), 'PPP')}
                    </AlertDescription>
                </div>
              </Alert>
            )}

          {accessStatus !== 'approved' && accessStatus !== null && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Access Request Issue</AlertTitle>
              <AlertDescription>
                {getAccessDeniedReason()}
              </AlertDescription>
            </Alert>
          )}

           {hasCertificateIssues && (
             <Alert variant="destructive">
                <FileWarning className="h-4 w-4" />
                <AlertTitle>Certificate Issue</AlertTitle>
                <AlertDescription>
                    {certificateStatus.missing.length > 0 && <div>Missing: {certificateStatus.missing.join(', ')}</div>}
                    {certificateStatus.expired.length > 0 && <div>Expired: {certificateStatus.expired.join(', ')}</div>}
                </AlertDescription>
             </Alert>
           )}
        </div>
      </div>
      <DialogFooter>
        {showCheckIn ? (
             <Button className="w-full" onClick={() => handleActivity('Check-in')} disabled={!isAccessGranted}><LogIn className="mr-2 h-4 w-4" /> Check-in</Button>
        ) : (
            <Button variant="outline" className="w-full" onClick={() => handleActivity('Check-out')}><LogOut className="mr-2 h-4 w-4" /> Check-out</Button>
        )}
      </DialogFooter>
       <DialogClose asChild>
          <Button variant="ghost" size="icon" className="absolute top-4 right-4" onClick={onClose}>
              <X className="h-4 w-4" />
          </Button>
      </DialogClose>
    </>
  );
}
