
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
import { Badge } from '@/components/ui/badge';
import type { Site, User } from '@/lib/types';
import { Loader2 } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

interface SitesTableProps {
  sites: Site[];
  users: User[];
  isLoading?: boolean;
}

export function SitesTable({ sites, users, isLoading = false }: SitesTableProps) {
  
  const getManagerName = (userId: string) => {
    return users.find(u => u.id === userId)?.name || 'Unknown User';
  }

  const getManagerAvatar = (userId: string) => {
    return users.find(u => u.id === userId)?.avatarUrl || '';
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>All Sites</CardTitle>
        <CardDescription>A list of all registered sites in the system.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Site Name</TableHead>
                <TableHead>Managers</TableHead>
                <TableHead>Required Certificates</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                  <TableRow>
                      <TableCell colSpan={3} className="h-24 text-center">
                          <Loader2 className="mx-auto h-6 w-6 animate-spin text-muted-foreground" />
                      </TableCell>
                  </TableRow>
              ) : sites.length > 0 ? (
                sites.map((site) => (
                  <TableRow key={site.id}>
                    <TableCell className="font-medium whitespace-nowrap">{site.name}</TableCell>
                    <TableCell>
                      <div className="flex items-center -space-x-2">
                        {site.managerIds.map(id => (
                           <TooltipProvider key={id} delayDuration={100}>
                            <Tooltip>
                              <TooltipTrigger>
                                <Avatar className="h-8 w-8 border-2 border-background">
                                  <AvatarImage src={getManagerAvatar(id)} />
                                  <AvatarFallback>{getManagerName(id).charAt(0)}</AvatarFallback>
                                </Avatar>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>{getManagerName(id)}</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {site.requiredCertificates.map((cert, index) => (
                          <Badge key={index} variant="secondary">{cert}</Badge>
                        ))}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                    <TableCell colSpan={3} className="h-24 text-center">
                        No sites found. Create one to get started.
                    </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
