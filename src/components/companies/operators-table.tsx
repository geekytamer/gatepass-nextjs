
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
import type { Operator, User, Site } from '@/lib/types';
import { Loader2, Building2, User as UserIcon } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface OperatorsTableProps {
  operators: Operator[];
  users: User[];
  sites: Site[];
  isLoading?: boolean;
}

export function OperatorsTable({ operators, users, sites, isLoading = false }: OperatorsTableProps) {
  
  const getOperatorPersonnel = (operatorId: string) => {
    return users.filter(u => (u.role === 'Admin' || u.role === 'Manager' || u.role === 'Operator Admin') && u.operatorId === operatorId);
  }

  const getSiteCount = (operatorId: string) => {
    return sites.filter(s => s.operatorId === operatorId).length;
  }
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>All Operators</CardTitle>
        <CardDescription>A list of all operator companies in the system.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Operator Name</TableHead>
                <TableHead>Personnel</TableHead>
                <TableHead>Sites</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={3} className="h-24 text-center"><Loader2 className="mx-auto h-6 w-6 animate-spin text-muted-foreground" /></TableCell></TableRow>
              ) : operators.length > 0 ? (
                operators.map((operator) => {
                  const personnel = getOperatorPersonnel(operator.id);
                  return (
                    <TableRow key={operator.id}>
                      <TableCell className="font-medium whitespace-nowrap">{operator.name}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                           <UserIcon className="h-4 w-4 text-muted-foreground" />
                           <span className="font-semibold">{personnel.length}</span>
                        </div>
                      </TableCell>
                       <TableCell>
                        <div className="flex items-center gap-2">
                           <Building2 className="h-4 w-4 text-muted-foreground" />
                           <span className="font-semibold">{getSiteCount(operator.id)}</span>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              ) : (
                <TableRow><TableCell colSpan={3} className="h-24 text-center">No operators found.</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
