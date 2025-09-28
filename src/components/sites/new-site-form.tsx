
'use client'

import { z } from "zod";
import { useFieldArray, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import type { Site, User } from "@/lib/types";
import { Plus, Trash2, X } from "lucide-react";
import React from "react";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "../ui/command";
import { Check } from "lucide-react";


const formSchema = z.object({
  name: z.string().min(2, { message: "Site name must be at least 2 characters." }),
  managerIds: z.array(z.string()).min(1, { message: "At least one manager must be selected." }),
  requiredCertificates: z.array(z.object({
      name: z.string().min(1, "Certificate name cannot be empty."),
  })),
});

type FormValues = z.infer<typeof formSchema>;

interface NewSiteFormProps {
    onNewSite: (site: Omit<Site, 'id'>) => void;
    users: User[];
    isLoadingUsers: boolean;
}

export function NewSiteForm({ onNewSite, users, isLoadingUsers }: NewSiteFormProps) {
    const { toast } = useToast();

    const form = useForm<FormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            name: "",
            managerIds: [],
            requiredCertificates: [],
        },
    });

    const { fields, append, remove } = useFieldArray({
      control: form.control,
      name: "requiredCertificates",
    });
    
    const managers = users.filter(u => u.role === 'Manager' || u.role === 'Admin');

    function onSubmit(values: FormValues) {
        onNewSite({
            name: values.name,
            managerIds: values.managerIds,
            requiredCertificates: values.requiredCertificates.map(c => c.name),
        });

        form.reset();
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Create a New Site</CardTitle>
                <CardDescription>Enter the site details below.</CardDescription>
            </CardHeader>
            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)}>
                    <CardContent className="space-y-6">
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
                                            >
                                            <div className="flex flex-wrap gap-1">
                                                {field.value?.length > 0 ? (
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
                                            value={manager.id}
                                            key={manager.id}
                                            onSelect={() => {
                                                const currentValues = form.getValues("managerIds");
                                                const newValue = currentValues.includes(manager.id)
                                                    ? currentValues.filter(id => id !== manager.id)
                                                    : [...currentValues, manager.id];
                                                form.setValue("managerIds", newValue);
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

                        <div className="space-y-2">
                          <FormLabel>Required Certificates</FormLabel>
                            {fields.map((field, index) => (
                                <div key={field.id} className="flex items-center gap-2">
                                    <FormField
                                        control={form.control}
                                        name={`requiredCertificates.${index}.name`}
                                        render={({ field }) => (
                                            <FormItem className="flex-1">
                                                <FormControl>
                                                  <Input placeholder="e.g., H2S Training" {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <Button type="button" variant="ghost" size="icon" className="shrink-0 text-destructive" onClick={() => remove(index)}>
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                            ))}
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                className="mt-2"
                                onClick={() => append({ name: '' })}
                            >
                                <Plus className="mr-2 h-4 w-4" />
                                Add Certificate Requirement
                            </Button>
                        </div>
                    </CardContent>
                    <CardFooter>
                        <Button type="submit">Create Site</Button>
                    </CardFooter>
                </form>
            </Form>
        </Card>
    )
}
