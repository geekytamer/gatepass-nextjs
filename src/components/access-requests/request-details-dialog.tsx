
'use client'

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { AccessRequest, User } from "@/lib/types";
import { format, isBefore, parseISO } from 'date-fns';
import { Briefcase, Building, Calendar, Contact, FileBadge, Hash, ShieldAlert, User as UserIcon, Users } from "lucide-react";
import { useWorkerData } from "@/hooks/use-worker-data";

interface RequestDetailsDialogProps {
  request: AccessRequest;
  allUsers: User[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const isCertificateExpired = (expiryDate?: string) => {
    if (!expiryDate) return false;
    return isBefore(parseISO(expiryDate), new Date());
};

const WorkerDetails = ({ worker, site }: { worker: User, site: { requiredCertificates: string[] }}) => {
    const { workerData, loading } = useWorkerData(worker.idNumber);
    const requiredCerts = site.requiredCertificates || [];

    const getCertificateStatus = (certName: string) => {
        const userCert = worker.certificates?.find(c => c.name === certName);
        if (!userCert) return { status: 'Missing', cert: null };
        if (isCertificateExpired(userCert.expiryDate)) return { status: 'Expired', cert: userCert };
        return { status: 'Valid', cert: userCert };
    };

    return (
        <div className="p-3 rounded-md bg-muted/50 border flex flex-col gap-2">
            <div className="font-semibold">{worker.name}</div>
            <div className="text-sm text-muted-foreground flex items-center gap-2">
                <Briefcase className="h-4 w-4" />
                <span>{loading ? 'Loading...' : workerData?.jobTitle || 'N/A'}</span>
            </div>
            {requiredCerts.length > 0 && (
                 <div>
                    {requiredCerts.map(certName => {
                        const { status } = getCertificateStatus(certName);
                        const isExpired = status === 'Expired';
                        const isMissing = status === 'Missing';
                        return (
                            <Badge key={certName} variant={isExpired || isMissing ? "destructive" : "secondary"} className="font-normal mr-1 mb-1">
                                {isExpired || isMissing ? <ShieldAlert className="h-3 w-3 mr-1.5" /> : <FileBadge className="h-3 w-3 mr-1.5" />}
                                {certName} {isExpired ? '(Expired)' : ''} {isMissing ? '(Missing)' : ''}
                            </Badge>
                        )
                    })}
                </div>
            )}
        </div>
    );
};


export function RequestDetailsDialog({ request, allUsers, open, onOpenChange }: RequestDetailsDialogProps) {

  const workersInRequest = request.workerIds.map(id => allUsers.find(u => u.id === id)).filter(Boolean) as User[];
  const siteDetails = { requiredCertificates: [] }; // In a real scenario, you'd fetch site details

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-xl w-[90vw] overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Access Request Details</SheetTitle>
          <SheetDescription>
            Read-only view of the request submitted by {request.supervisorName}.
          </SheetDescription>
        </SheetHeader>
        <div className="space-y-6 py-6">
            
            <div className="space-y-4 p-4 rounded-lg border bg-background">
                <h3 className="font-semibold text-lg">Contract Information</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="grid w-full items-center gap-1.5">
                        <Label htmlFor="operatorName">Operator</Label>
                        <Input id="operatorName" value={request.operatorName} readOnly disabled icon={Building} />
                    </div>
                     <div className="grid w-full items-center gap-1.5">
                        <Label htmlFor="siteName">Site</Label>
                        <Input id="siteName" value={request.siteName} readOnly disabled icon={Building} />
                    </div>
                     <div className="grid w-full items-center gap-1.5">
                        <Label htmlFor="contractNumber">Contract Number</Label>
                        <Input id="contractNumber" value={request.contractNumber} readOnly disabled icon={Hash} />
                    </div>
                    <div className="grid w-full items-center gap-1.5">
                        <Label htmlFor="focalPoint">Focal Point</Label>
                        <Input id="focalPoint" value={request.focalPoint} readOnly disabled icon={Contact} />
                    </div>
                </div>
            </div>

            <div className="space-y-4 p-4 rounded-lg border bg-background">
                <h3 className="font-semibold text-lg flex items-center gap-2"><Users className="h-5 w-5"/>Personnel ({workersInRequest.length})</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {workersInRequest.map(worker => (
                        <WorkerDetails key={worker.id} worker={worker} site={siteDetails} />
                    ))}
                </div>
            </div>

        </div>
        <SheetFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Close</Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

// Add icon prop to Input component's interface
declare module "react" {
    interface InputHTMLAttributes<T> extends HTMLAttributes<T> {
        icon?: React.ElementType;
    }
}
