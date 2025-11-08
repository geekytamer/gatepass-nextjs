
'use client'

import { useState } from 'react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { cn } from '@/lib/utils';
import { CalendarIcon, Check, InfinityIcon } from 'lucide-react';
import { format, addDays } from 'date-fns';
import type { AccessRequest } from '@/lib/types';

const formSchema = z.object({
  validFrom: z.date({ required_error: "A start date is required." }),
  expiryType: z.enum(['date', 'permanent']),
  expiresAt: z.date().optional(),
}).refine(data => {
    if (data.expiryType === 'date' && !data.expiresAt) return false;
    return true;
}, {
    message: "Expiry date is required.",
    path: ['expiresAt'],
}).refine(data => {
    if (data.expiryType === 'date' && data.expiresAt) {
        return data.expiresAt > data.validFrom;
    }
    return true;
}, {
    message: "Expiry date must be after the start date.",
    path: ['expiresAt'],
});

interface ApprovalDialogProps {
  request: AccessRequest;
  onOpenChange: (open: boolean) => void;
  onConfirm: (requestId: string, validFrom: Date, expiresAt: Date | 'Permanent') => void;
}

export function ApprovalDialog({ request, onOpenChange, onConfirm }: ApprovalDialogProps) {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      validFrom: new Date(),
      expiryType: 'date',
      expiresAt: addDays(new Date(), 30),
    },
  });
  
  const expiryType = form.watch('expiryType');

  function onSubmit(values: z.infer<typeof formSchema>) {
    const expiresAt = values.expiryType === 'permanent' ? 'Permanent' : values.expiresAt!;
    onConfirm(request.id, values.validFrom, expiresAt);
  }

  return (
    <Dialog open={true} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Approve Access Request</DialogTitle>
          <DialogDescription>Set the validity period for this access request.</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
                control={form.control}
                name="validFrom"
                render={({ field }) => (
                <FormItem className="flex flex-col">
                    <FormLabel>Access Start Date</FormLabel>
                    <Popover>
                        <PopoverTrigger asChild>
                        <FormControl>
                            <Button
                            variant={"outline"}
                            className={cn("pl-3 text-left font-normal", !field.value && "text-muted-foreground")}
                            >
                            {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                        </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={field.onChange}
                            disabled={(date) => date < new Date(new Date().setHours(0,0,0,0))}
                            initialFocus
                        />
                        </PopoverContent>
                    </Popover>
                    <FormMessage />
                </FormItem>
                )}
            />
            <FormField
                control={form.control}
                name="expiryType"
                render={({ field }) => (
                    <FormItem className="space-y-3">
                        <FormLabel>Access Expiry</FormLabel>
                        <FormControl>
                            <RadioGroup
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                            className="flex flex-col space-y-1"
                            >
                            <FormItem className="flex items-center space-x-3 space-y-0">
                                <FormControl>
                                <RadioGroupItem value="date" />
                                </FormControl>
                                <FormLabel className="font-normal">Set expiry date</FormLabel>
                            </FormItem>
                            <FormItem className="flex items-center space-x-3 space-y-0">
                                <FormControl>
                                <RadioGroupItem value="permanent" />
                                </FormControl>
                                <FormLabel className="font-normal flex items-center gap-2">Permanent access <InfinityIcon className="h-4 w-4" /></FormLabel>
                            </FormItem>
                            </RadioGroup>
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                )}
            />
            {expiryType === 'date' && (
                <FormField
                    control={form.control}
                    name="expiresAt"
                    render={({ field }) => (
                    <FormItem className="flex flex-col">
                        <FormLabel>Access Expiry Date</FormLabel>
                        <Popover>
                            <PopoverTrigger asChild>
                            <FormControl>
                                <Button
                                variant={"outline"}
                                className={cn("pl-3 text-left font-normal", !field.value && "text-muted-foreground")}
                                >
                                {field.value ? format(field.value, "PPP") : <span>Pick an expiry date</span>}
                                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                </Button>
                            </FormControl>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                                mode="single"
                                selected={field.value}
                                onSelect={field.onChange}
                                disabled={(date) => date < new Date(new Date().setHours(0,0,0,0))}
                            />
                            </PopoverContent>
                        </Popover>
                        <FormMessage />
                    </FormItem>
                    )}
                />
            )}
            <DialogFooter>
              <Button type="submit">
                <Check className="mr-2 h-4 w-4" />
                Confirm Approval
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
