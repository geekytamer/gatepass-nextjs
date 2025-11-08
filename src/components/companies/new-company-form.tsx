
'use client'

import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Plus } from "lucide-react";

const formSchema = z.object({
  name: z.string().min(2, { message: "Company name must be at least 2 characters." }),
});

type FormValues = z.infer<typeof formSchema>;

interface NewCompanyFormProps {
    companyType: 'operator' | 'contractor';
    onAddCompany: (name: string, type: 'operator' | 'contractor') => void;
}

export function NewCompanyForm({ companyType, onAddCompany }: NewCompanyFormProps) {
    const form = useForm<FormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: { name: "" },
    });

    function onSubmit(values: FormValues) {
        onAddCompany(values.name, companyType);
        form.reset();
    }

    const typeCapitalized = companyType.charAt(0).toUpperCase() + companyType.slice(1);

    return (
        <Card>
            <CardHeader>
                <CardTitle>Add New {typeCapitalized}</CardTitle>
                <CardDescription>Create a new {companyType} company record.</CardDescription>
            </CardHeader>
            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)}>
                    <CardContent>
                        <FormField
                            control={form.control}
                            name="name"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>{typeCapitalized} Name</FormLabel>
                                    <FormControl>
                                        <Input placeholder={`e.g., ${typeCapitalized} Inc.`} {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </CardContent>
                    <CardFooter>
                        <Button type="submit">
                            <Plus className="mr-2 h-4 w-4" />
                            Add {typeCapitalized}
                        </Button>
                    </CardFooter>
                </form>
            </Form>
        </Card>
    )
}
