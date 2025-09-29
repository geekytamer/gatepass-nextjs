
'use client'

import React, { useState, useRef } from 'react';
import { DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { useFirestore } from '@/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import type { Site } from '@/lib/types';
import { Camera as CameraIcon, X } from 'lucide-react';
import Image from 'next/image';

interface VisitorRegistrationDialogProps {
  assignedSite: Site;
  onClose: () => void;
}

export function VisitorRegistrationDialog({ assignedSite, onClose }: VisitorRegistrationDialogProps) {
  const [visitorName, setVisitorName] = useState('');
  const [visitorCompany, setVisitorCompany] = useState('');
  const [visitorIdCardImage, setVisitorIdCardImage] = useState<string | null>(null);
  const idCardInputRef = useRef<HTMLInputElement>(null);
  const firestore = useFirestore();
  const { toast } = useToast();

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
    if (!firestore || !visitorName || !visitorIdCardImage) {
      toast({ variant: 'destructive', title: 'Missing Information', description: 'Please provide name and ID card image.' });
      return;
    }
    try {
      // 1. Create the visitor user profile
      const newUser = {
        name: visitorName,
        company: visitorCompany,
        email: `visitor_${Date.now()}@gatepass.local`,
        role: 'Visitor' as const,
        status: 'Active' as const,
        avatarUrl: `https://picsum.photos/seed/${Date.now()}/200/200`,
        idCardImageUrl: visitorIdCardImage,
        createdAt: serverTimestamp()
      };
      const docRef = await addDoc(collection(firestore, "users"), newUser);
      toast({ title: 'Visitor Registered', description: `${visitorName} has been created.` });

      // 2. Immediately check them in
      await addDoc(collection(firestore, "gateActivity"), {
        userId: docRef.id,
        userName: newUser.name,
        userAvatar: newUser.avatarUrl,
        timestamp: serverTimestamp(),
        type: 'Check-in',
        gate: `${assignedSite.name} Main Gate`,
        siteId: assignedSite.id,
      });
      toast({ title: `Check-in Successful`, description: `${newUser.name} has been checked in.` });

      onClose();

    } catch (error) {
      console.error("Error registering visitor:", error);
      toast({ variant: 'destructive', title: 'Registration Failed', description: 'Could not create visitor profile.' });
    }
  };

  return (
    <>
      <DialogHeader>
        <DialogTitle>Register New Visitor</DialogTitle>
        <DialogDescription>Enter the visitor's details to grant access.</DialogDescription>
      </DialogHeader>

      <div className="grid gap-4 py-4">
        <Input placeholder="Full Name" value={visitorName} onChange={(e) => setVisitorName(e.target.value)} />
        <Input placeholder="Company (Optional)" value={visitorCompany} onChange={(e) => setVisitorCompany(e.target.value)} />
        <Input type="file" accept="image/*" capture="environment" className="hidden" ref={idCardInputRef} onChange={handleIdCardSelect} />
        <Button variant="outline" onClick={() => idCardInputRef.current?.click()}>
          <CameraIcon className="mr-2 h-4 w-4" />
          {visitorIdCardImage ? 'Recapture ID Card' : 'Capture ID Card'}
        </Button>
        {visitorIdCardImage && <Image src={visitorIdCardImage} alt="ID card preview" width={200} height={125} className="rounded-md border object-contain mx-auto" />}
      </div>
      <DialogFooter>
        <Button onClick={handleRegisterVisitorAndCheckIn} disabled={!visitorName || !visitorIdCardImage}>Register and Check-in</Button>
      </DialogFooter>
      <DialogClose asChild>
          <Button variant="ghost" size="icon" className="absolute top-4 right-4" onClick={onClose}>
              <X className="h-4 w-4" />
          </Button>
      </DialogClose>
    </>
  );
}
