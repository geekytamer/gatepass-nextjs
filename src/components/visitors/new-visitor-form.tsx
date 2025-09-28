
'use client'

import { z } from "zod";
import { useFieldArray, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import type { User, UserRole, Certificate, CertificateType } from "@/lib/types";
import { CalendarIcon, FileText, Trash2 } from "lucide-react";
import React, { useEffect, useState } from "react";
import { useFirestore } from "@/firebase";
import { collection, onSnapshot } from "firebase/firestore";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { Calendar } from "../ui/calendar";


const formSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters." }),
  company: z.string().min(2, { message: "Company must be at least 2 characters." }),
  email: z.string().email({ message: "Please enter a valid email." }),
  role: z.enum(['Visitor', 'Worker']),
  notes: z.string().optional(),
  certificates: z.array(z.object({
      name: z.string({ required_error: "Please select a certificate type."}).min(1, "Certificate name is required."),
      expiryDate: z.date().optional(),
  })).optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface NewVisitorFormProps {
    onNewVisitor: (visitor: Omit<User, 'id' | 'avatarUrl'>) => void;
}

export function NewVisitorForm({ onNewVisitor }: NewVisitorFormProps) {
    const { toast } = useToast();
    const [certificateTypes, setCertificateTypes] = useState<CertificateType[]>([]);
    const [loadingCerts, setLoadingCerts] = useState(true);
    const firestore = useFirestore();

    useEffect(() => {
        if (!firestore) return;
        setLoadingCerts(true);
        const certsUnsub = onSnapshot(collection(firestore, "certificateTypes"), (snapshot) => {
            const certsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as CertificateType));
            setCertificateTypes(certsData);
            setLoadingCerts(false);
        });
        return () => certsUnsub();
    }, [firestore]);

    const form = useForm<FormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            name: "",
            company: "",
            email: "",
            notes: "",
            role: "Visitor",
            certificates: [],
        },
    });

    const { fields, append, remove } = useFieldArray({
      control: form.control,
      name: "certificates",
    });

    async function onSubmit(values: FormValues) {
        const certificates: Certificate[] = values.certificates ? values.certificates.map(cert => ({
            name: cert.name,
            expiryDate: cert.expiryDate ? format(cert.expiryDate, "yyyy-MM-dd") : undefined,
        })) : [];

        onNewVisitor({
            name: values.name,
            email: values.email,
            company: values.company,
            role: values.role as UserRole,
            certificates: certificates,
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
                                        <SelectItem value="Worker">Worker</SelectItem>
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                                </FormItem>
                            )} />
                        </div>

                        <FormField control={form.control} name="notes" render={({ field }) => (
                            <FormItem>
                                <FormLabel>Notes (Optional)</FormLabel>
                                <FormControl>
                                    <Textarea placeholder="e.g., Attending the 2pm marketing meeting in room 301." {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )} />

                        <div className="space-y-4">
                          <FormLabel>Certificates (Optional)</FormLabel>
                            {fields.map((field, index) => (
                                <div key={field.id} className="flex items-end gap-4 p-4 border rounded-md relative">
                                    <FormField
                                        control={form.control}
                                        name={`certificates.${index}.name`}
                                        render={({ field }) => (
                                            <FormItem className="flex-1">
                                                <FormLabel>Certificate Type</FormLabel>
                                                <Select onValueChange={field.onChange} defaultValue={field.value} disabled={loadingCerts}>
                                                    <FormControl><SelectTrigger><SelectValue placeholder={loadingCerts ? "Loading..." : "Select certificate type"} /></SelectTrigger></FormControl>
                                                    <SelectContent>
                                                        {certificateTypes.map(type => (
                                                            <SelectItem key={type.id} value={type.name}>{type.name}</SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name={`certificates.${index}.expiryDate`}
                                        render={({ field }) => (
                                            <FormItem className="flex flex-col">
                                            <FormLabel>Expiry Date</FormLabel>
                                            <Popover>
                                                <PopoverTrigger asChild>
                                                <FormControl>
                                                    <Button
                                                    variant={"outline"}
                                                    className={cn(
                                                        "w-[200px] pl-3 text-left font-normal",
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
                                                    initialFocus
                                                />
                                                </PopoverContent>
                                            </Popover>
                                            <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <Button type="button" variant="ghost" size="icon" className="text-destructive" onClick={() => remove(index)}>
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                            ))}
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => append({ name: '' })}
                            >
                                <FileText className="mr-2 h-4 w-4" />
                                Add Certificate Record
                            </Button>
                            <FormDescription>Log certificates written on ID cards, like safety training or work permits.</FormDescription>
                        </div>
                    </CardContent>
                    <CardFooter>
                        <Button type="submit">Create Profile</Button>
                    </CardFooter>
                </form>
            </Form>
        </Card>
    )
}
