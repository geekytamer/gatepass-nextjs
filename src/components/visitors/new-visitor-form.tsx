
'use client'

import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import type { User, UserRole } from "@/lib/types";

const formSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters." }),
  company: z.string().min(2, { message: "Company must be at least 2 characters." }),
  email: z.string().email({ message: "Please enter a valid email." }),
  role: z.enum(['Visitor', 'Contractor', 'Worker', 'Other']),
  accessLevel: z.enum(['Limited', 'Standard', 'Elevated']),
  notes: z.string().optional(),
});

type FormValues = {
  name: string;
  company: string;
  email: string;
  role: 'Visitor' | 'Contractor' | 'Worker' | 'Other';
  accessLevel: 'Limited' | 'Standard' | 'Elevated';
  notes?: string | undefined;
}

interface NewVisitorFormProps {
    onNewVisitor: (visitor: Omit<User, 'id' | 'avatarUrl'>) => void;
}

export function NewVisitorForm({ onNewVisitor }: NewVisitorFormProps) {
    const { toast } = useToast();

    const form = useForm<FormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            name: "",
            company: "",
            email: "",
            notes: "",
            role: "Visitor",
            accessLevel: "Limited",
        },
    });

    function onSubmit(values: FormValues) {
        onNewVisitor({
            name: values.name,
            email: values.email,
            company: values.company,
            role: values.role as UserRole,
        });

        toast({
            title: "Profile Created!",
            description: `A new profile for ${values.name} has been created.`,
        });
        form.reset();
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Create New Visitor Profile</CardTitle>
                <CardDescription>Enter the visitor's details below to create a new profile.</CardDescription>
            </CardHeader>
            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)}>
                    <CardContent className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <FormField control={form.control} name="name" render={({ field }) => (
                                <FormItem><FormLabel>Full Name</FormLabel><FormControl><Input placeholder="John Doe" {...field} /></FormControl><FormMessage /></FormItem>
                            )} />
                            <FormField control={form.control} name="company" render={({ field }) => (
                                <FormItem><FormLabel>Company</FormLabel><FormControl><Input placeholder="Acme Inc." {...field} /></FormControl><FormMessage /></FormItem>
                            )} />
                        </div>
                        <FormField control={form.control} name="email" render={({ field }) => (
                            <FormItem><FormLabel>Email Address</FormLabel><FormControl><Input type="email" placeholder="john.doe@acme.com" {...field} /></FormControl><FormMessage /></FormItem>
                        )} />

                         <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <FormField control={form.control} name="role" render={({ field }) => (
                                <FormItem><FormLabel>Role</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value}>
                                    <FormControl><SelectTrigger><SelectValue placeholder="Select a role" /></SelectTrigger></FormControl>
                                    <SelectContent>
                                        <SelectItem value="Visitor">Visitor</SelectItem>
                                        <SelectItem value="Contractor">Contractor</SelectItem>
                                        <SelectItem value="Worker">Worker</