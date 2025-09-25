
'use client'

import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import { Calendar as CalendarIcon, UploadCloud } from "lucide-react";

import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import type { AccessRequest } from "@/lib/types";
import { PlaceHolderImages } from "@/lib/placeholder-images";

const formSchema = z.object({
  accessDate: z.date({
    required_error: "An access date is required.",
  }),
  reason: z.string().min(10, {
    message: "Reason must be at least 10 characters.",
  }).max(200, {
      message: "Reason must not be longer than 200 characters.",
  }),
  documentation: z.instanceof(File).optional(),
});

interface NewRequestFormProps {
    currentUserId: string;
    onNewRequest: (request: Omit<AccessRequest, 'id'|'status'|'requestedAt'>) => void;
}

export function NewRequestForm({ currentUserId, onNewRequest }: NewRequestFormProps) {
    const { toast } = useToast();

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            reason: "",
        },
    });

    function onSubmit(values: z.infer<typeof formSchema>) {
        // In a real app, you'd get the user's actual name and avatar.
        onNewRequest({
            userId: currentUserId,
            userName: "Mike Worker",
            userAvatar: PlaceHolderImages[4].imageUrl,
            date: format(values.accessDate, "yyyy-MM-dd"),
            reason: values.reason,
        });

        toast({
            title: "Request Submitted!",
            description: "Your access request has been sent for approval.",
        });
        form.reset();
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Submit a New Access Request</CardTitle>
                <CardDescription>Fill out the details below to request access. Workers must upload required documentation.</CardDescription>
            </CardHeader>
            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)}>
                    <CardContent className="space-y-6">
                        <FormField
                            control={form.control}
                            name="accessDate"
                            render={({ field }) => (
                                <FormItem className="flex flex-col">
                                <FormLabel>Access Date</FormLabel>
                                <Popover>
                                    <PopoverTrigger asChild>
                                    <FormControl>
                                        <Button
                                        variant={"outline"}
                                        className={cn(
                                            "w-full md:w-[240px] pl-3 text-left font-normal",
                                            !field.value && "text-muted-foreground"
                                        )}
                                        >
                                        {field.value ? (
                                            format(field.value, "PPP")
                                        ) : (
                                            <span>Pick a date</span>
                                        )}
                                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                        </Button>
                                    </FormControl>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0" align="start">
                                    <Calendar
                                        mode="single"
                                        selected={field.value}
                                        onSelect={field.onChange}
                                        disabled={(date) =>
                                            date < new Date(new Date().setHours(0,0,0,0))
                                        }
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
                            name="reason"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Reason for Access</FormLabel>
                                    <FormControl>
                                        <Textarea placeholder="e.g., Scheduled maintenance on server room A." {...field} />
                                    </FormControl>
                                    <FormDescription>
                                        Please provide a clear and concise reason for your visit.
                                    </FormDescription>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="documentation"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Upload Documentation (for Workers)</FormLabel>
                                    <FormControl>
                                        <div className="relative">
                                             <UploadCloud className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                                            <Input type="file" className="pl-10" onChange={(e) => field.onChange(e.target.files?.[0])} />
                                        </div>
                                    </FormControl>
                                     <FormDescription>
                                        Upload work orders, safety certifications, etc.
                                    </FormDescription>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </CardContent>
                    <CardFooter>
                        <Button type="submit">Submit Request</Button>
                    </CardFooter>
                </form>
            </Form>
        </Card>
    )
}
