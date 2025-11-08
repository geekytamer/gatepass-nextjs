
'use client';

import React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import type { Contractor, User, AccessRequest } from '@/lib/types';
import { Loader2, ClipboardList, User as UserIcon } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface ContractorsTableProps {
  contractors: Contractor[];
  users: User[];
  accessRequests: AccessRequest[];
  isLoading?: boolean;
}

export function ContractorsTable({ contractors, users, accessRequests, isLoading = false }: ContractorsTableProps) {
  
  const getContractorPersonnelCount = (contractorId: string) => {
    return users.filter(u => u.contractorId === contractorId && (u.role === 'Worker' || u.role === 'Supervisor')).length;
  }

  const getActiveRequestCount = (contractorId: string) => {
    return accessRequests.filter(req => req.contractorId === contractorId && (req.status === 'Pending' || req.status === 'Approved')).length;
  }
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>All Contractors</CardTitle>
        <CardDescription>A list of all contractor companies in the system.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Contractor Name</TableHead>
                <TableHead>Personnel</TableHead>
                <TableHead>Active Requests</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={3} className="h-24 text-center"><Loader2 className="mx-auto h-6 w-6 animate-spin text-muted-foreground" /></TableCell></TableRow>
              ) : contractors.length > 0 ? (
                contractors.map((contractor) => (
                  <TableRow key={contractor.id}>
                    <TableCell className="font-medium whitespace-nowrap">{contractor.name}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <UserIcon className="h-4 w-4 text-muted-foreground" />
                        <span className="font-semibold">{getContractorPersonnelCount(contractor.id)}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <ClipboardList className="h-4 w-4 text-muted-foreground" />
                        <span className="font-semibold">{getActiveRequestCount(contractor.id)}</span>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow><TableCell colSpan={3} className="h-24 text-center">No contractors found.</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
