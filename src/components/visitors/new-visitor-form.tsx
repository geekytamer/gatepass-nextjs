
'use client'

import { z } from "zod";
import { useFieldArray, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import type { User, UserRole, Certificate } from "@/lib/types";
import { FileUp, Trash2 } from "lucide-react";
import React from "react";
import { certificateTypes } from "@/lib/certificate-types";

const MAX_FILE_SIZE = 4 * 1024 * 1024; // 4MB
const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp", "application/pdf"];


const formSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters." }),
  company: z.string().min(2, { message: "Company must be at least 2 characters." }),
  email: z.string().email({ message: "Please enter a valid email." }),
  role: z.enum(['Visitor', 'Worker']),
  notes: z.string().optional(),
  certificates: z.array(z.object({
      name: z.string({ required_error: "Please select a certificate type."}).min(1, "Certificate name is required."),
      file: z.any()
        .refine((file) => file, "File is required.")
        .refine((file) => file.size <= MAX_FILE_SIZE, `Max file size is 4MB.`)
        .refine(
          (file) => ACCEPTED_IMAGE_TYPES.includes(file.type),
          "Only .jpg, .png, .webp, and .pdf formats are supported."
        )
  })).optional(),
});

type FormValues = z.infer<typeof formSchema>;

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
            certificates: [],
        },
    });

    const { fields, append, remove } = useFieldArray({
      control: form.control,
      name: "certificates",
    });

    const fileToBase64 = (file: File): Promise<string> => {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = error => reject(error);
      });
    };

    async function onSubmit(values: FormValues) {
        let certificates: Certificate[] = [];
        if (values.certificates) {
            try {
                 certificates = await Promise.all(
                    values.certificates.map(async (cert) => ({
                        name: cert.name,
                        fileDataUrl: await fileToBase64(cert.file),
                    }))
                );
            } catch (error) {
                 console.error("Error converting files to Base64:", error);
                 toast({
                    variant: "destructive",
                    title: "File Error",
                    description: "Could not process one or more certificate files.",
                });
                return;
            }
        }

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
                                                <FormLabel>Certificate Name</FormLabel>
                                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                    <FormControl><SelectTrigger><SelectValue placeholder="Select certificate type" /></SelectTrigger></FormControl>
                                                    <SelectContent>
                                                        {certificateTypes.map(type => (
                                                            <SelectItem key={type} value={type}>{type}</SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                     <FormField
                                        control={form.control}
                                        name={`certificates.${index}.file`}
                                        render={({ field: { onChange, value, ...rest }}) => (
                                            <FormItem>
                                                <FormLabel>File</FormLabel>
                                                <FormControl>
                                                   <Input
                                                      type="file"
                                                      onChange={e => onChange(e.target.files?.[0])}
                                                      className="max-w-[200px]"
                                                      accept={ACCEPTED_IMAGE_TYPES.join(",")}
                                                      {...rest}
                                                    />
                                                </FormControl>
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
                                onClick={() => append({ name: '', file: null })}
                            >
                                <FileUp className="mr-2 h-4 w-4" />
                                Add Certificate
                            </Button>
                            <FormDescription>Attach relevant certificates like safety training or work orders.</FormDescription>
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
