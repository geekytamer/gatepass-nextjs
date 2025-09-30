
'use client'

import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import type { Site, User, CertificateType } from "@/lib/types";
import React from "react";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { ChevronsUpDown, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "../ui/command";
import { Badge } from "../ui/badge";

const formSchema = z.object({
  name: z.string().min(2, { message: "Site name must be at least 2 characters." }),
  managerIds: z.array(z.string()).min(1, { message: "At least one manager must be selected." }),
  requiredCertificates: z.array(z.string()).optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface EditSiteFormProps {
    site: Site;
    onUpdateSite: (siteId: string, data: Omit<Site, 'id'>) => Promise<boolean>;
    users: User[];
    certificateTypes: CertificateType[];
    isLoadingUsers: boolean;
    isLoadingCerts: boolean;
    closeDialog: () => void;
}

export function EditSiteForm({ site, onUpdateSite, users, certificateTypes, isLoadingUsers, isLoadingCerts, closeDialog }: EditSiteFormProps) {
    const form = useForm<FormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            name: site.name,
            managerIds: site.managerIds,
            requiredCertificates: site.requiredCertificates || [],
        },
    });

    const managers = users.filter(u => u.role === 'Manager' || u.role === 'Admin');

    async function onSubmit(values: FormValues) {
        const success = await onUpdateSite(site.id, {
            name: values.name,
            managerIds: values.managerIds,
            requiredCertificates: values.requiredCertificates || [],
        });
        if (success) {
            closeDialog();
        }
    }

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8 pt-4">
                 <div className="space-y-6 max-h-[70vh] overflow-y-auto pr-4">
                    <FormField control={form.control} name="name" render={({ field }) => (
                        <FormItem><FormLabel>Site Name</FormLabel><FormControl><Input placeholder="e.g., Main Headquarters" {...field} /></FormControl><FormMessage /></FormItem>
                    )} />

                    <FormField
                        control={form.control}
                        name="managerIds"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel>Site Managers</FormLabel>
                            <Popover>
                                <PopoverTrigger asChild>
                                    <FormControl>
                                        <Button
                                        variant="outline"
                                        role="combobox"
                                        className={cn(
                                            "w-full justify-between h-auto min-h-10",
                                            !field.value?.length && "text-muted-foreground"
                                        )}
                                        disabled={isLoadingUsers}
                                        >
                                        <div className="flex flex-wrap gap-1">
                                            {isLoadingUsers ? "Loading managers..." :
                                                field.value?.length > 0 ? (
                                                    users.filter(u => field.value.includes(u.id)).map(user => (
                                                        <Badge key={user.id} variant="secondary" className="mr-1">
                                                            {user.name}
                                                        </Badge>
                                                    ))
                                                ) : "Select managers..."}
                                        </div>
                                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                        </Button>
                                    </FormControl>
                                </PopoverTrigger>
                                <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                                <Command>
                                  <CommandInput placeholder="Search managers..." />
                                  <CommandList>
                                    <CommandEmpty>No managers found.</CommandEmpty>
                                    <CommandGroup>
                                    {managers.map((manager) => (
                                        <CommandItem
                                        value={manager.name}
                                        key={manager.id}
                                        onSelect={() => {
                                            const currentValues = form.getValues("managerIds");
                                            const newValue = currentValues.includes(manager.id)
                                                ? currentValues.filter(id => id !== manager.id)
                                                : [...currentValues, manager.id];
                                            form.setValue("managerIds", newValue, { shouldValidate: true });
                                        }}
                                        >
                                        <Check
                                            className={cn(
                                            "mr-2 h-4 w-4",
                                            field.value.includes(manager.id)
                                                ? "opacity-100"
                                                : "opacity-0"
                                            )}
                                        />
                                        {manager.name}
                                        </CommandItem>
                                    ))}
                                    </CommandGroup>
                                  </CommandList>
                                </Command>
                                </PopoverContent>
                            </Popover>
                            <FormMessage />
                            </FormItem>
                        )}
                    />

                     <FormField
                        control={form.control}
                        name="requiredCertificates"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel>Required Certificates</FormLabel>
                            <Popover>
                                <PopoverTrigger asChild>
                                    <FormControl>
                                        <Button
                                        variant="outline"
                                        role="combobox"
                                        className={cn(
                                            "w-full justify-between h-auto min-h-10",
                                            !field.value?.length && "text-muted-foreground"
                                        )}
                                        disabled={isLoadingCerts}
                                        >
                                        <div className="flex flex-wrap gap-1">
                                            {isLoadingCerts ? "Loading certificates..." :
                                                field.value?.length > 0 ? (
                                                    certificateTypes.filter(cert => field.value.includes(cert.name)).map(cert => (
                                                        <Badge key={cert.id} variant="secondary" className="mr-1">
                                                            {cert.name}
                                                        </Badge>
                                                    ))
                                                ) : "Select required certificates..."}
                                        </div>
                                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                        </Button>
                                    </FormControl>
                                </PopoverTrigger>
                                <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                                <Command>
                                  <CommandInput placeholder="Search certificates..." />
                                  <CommandList>
                                    <CommandEmpty>No certificates found.</CommandEmpty>
                                    <CommandGroup>
                                    {certificateTypes.map((cert) => (
                                        <CommandItem
                                        value={cert.name}
                                        key={cert.id}
                                        onSelect={() => {
                                            const currentValues = form.getValues("requiredCertificates") || [];
                                            const newValue = currentValues.includes(cert.name)
                                                ? currentValues.filter(c => c !== cert.name)
                                                : [...currentValues, cert.name];
                                            form.setValue("requiredCertificates", newValue, { shouldValidate: true });
                                        }}
                                        >
                                        <Check
                                            className={cn(
                                            "mr-2 h-4 w-4",
                                            field.value?.includes(cert.name)
                                                ? "opacity-100"
                                                : "opacity-0"
                                            )}
                                        />
                                        {cert.name}
                                        </CommandItem>
                                    ))}
                                    </CommandGroup>
                                  </CommandList>
                                </Command>
                                </PopoverContent>
                            </Popover>
                            <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>
                <div className="flex justify-end pt-8">
                    <Button type="submit" disabled={form.formState.isSubmitting}>
                        {form.formState.isSubmitting ? 'Saving...' : 'Save Changes'}
                    </Button>
                </div>
            </form>
        </Form>
    )
}
