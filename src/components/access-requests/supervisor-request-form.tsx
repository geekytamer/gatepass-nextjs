
'use client'

import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ChevronsUpDown } from "lucide-react";

import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import type { Operator, Site, Contractor, User } from "@/lib/types";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState, useMemo } from "react";
import { processAccessRequest } from "@/ai/flows/process-access-request-flow";

const formSchema = z.object({
  operatorId: z.string({ required_error: "Please select an operator." }),
  siteId: z.string({ required_error: "Please select a site." }),
  contractNumber: z.string().min(1, { message: "Contract number is required." }),
  focalPoint: z.string().min(2, { message: "Focal point name is required." }),
  workerIds: z.string().min(1, { message: "Please enter at least one Worker ID." }),
});

interface SupervisorRequestFormProps {
    supervisor: User;
    operators: Operator[];
    sites: Site[];
    contractors: Contractor[];
    isLoading: boolean;
}

export function SupervisorRequestForm({ supervisor, operators, sites, contractors, isLoading }: SupervisorRequestFormProps) {
    const { toast } = useToast();
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            operatorId: "",
            siteId: "",
            contractNumber: "",
            focalPoint: "",
            workerIds: "",
        },
    });
    
    const selectedOperatorId = form.watch("operatorId");
    const availableSites = useMemo(() => {
        return sites.filter(site => site.operatorId === selectedOperatorId);
    }, [sites, selectedOperatorId]);

    async function onSubmit(values: z.infer<typeof formSchema>) {
        if (!supervisor.contractorId) {
            toast({ variant: "destructive", title: "Error", description: "Your user profile is not linked to a contractor."});
            return;
        }

        setIsSubmitting(true);
        try {
            const result = await processAccessRequest({
                supervisorId: supervisor.id,
                supervisorName: supervisor.name,
                contractorId: supervisor.contractorId,
                operatorId: values.operatorId,
                siteId: values.siteId,
                contractNumber: values.contractNumber,
                focalPoint: values.focalPoint,
                workerIdList: values.workerIds,
            });

            if (result.success) {
                toast({
                    title: "Request Submitted!",
                    description: `Access request for ${result.workersProcessed} worker(s) has been sent for approval.`,
                });
                form.reset();
            } else {
                throw new Error(result.error || "Failed to process the request.");
            }

        } catch (error: any) {
            console.error("Error submitting group access request:", error);
            toast({ variant: "destructive", title: "Submission Error", description: error.message || "Could not submit your request." });
        } finally {
            setIsSubmitting(false);
        }
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Submit Group Access Request</CardTitle>
                <CardDescription>Fill out the contract details and provide the list of workers requiring access.</CardDescription>
            </CardHeader>
            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)}>
                    <CardContent className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                           <FormField
                                control={form.control}
                                name="operatorId"
                                render={({ field }) => (
                                    <FormItem>
                                    <FormLabel>Operator</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value} disabled={isLoading}>
                                        <FormControl>
                                        <SelectTrigger>
                                            <SelectValue placeholder={isLoading ? "Loading..." : "Select an operator"} />
                                        </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                        {operators.map(op => (
                                            <SelectItem key={op.id} value={op.id}>{op.name}</SelectItem>
                                        ))}
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                    </FormItem>
                                )}
                            />
                             <FormField
                                control={form.control}
                                name="siteId"
                                render={({ field }) => (
                                    <FormItem>
                                    <FormLabel>Site</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value} disabled={!selectedOperatorId || isLoading}>
                                        <FormControl>
                                        <SelectTrigger>
                                            <SelectValue placeholder={!selectedOperatorId ? "Select an operator first" : "Select a site"} />
                                        </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                        {availableSites.map(site => (
                                            <SelectItem key={site.id} value={site.id}>{site.name}</SelectItem>
                                        ))}
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <FormField
                                control={form.control}
                                name="contractNumber"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Contract Number</FormLabel>
                                        <FormControl><Input placeholder="e.g., C-123-XYZ" {...field} /></FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="focalPoint"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Operator Focal Point</FormLabel>
                                        <FormControl><Input placeholder="e.g., Site Manager Name" {...field} /></FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>
                        <FormField
                            control={form.control}
                            name="workerIds"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Worker IDs</FormLabel>
                                    <FormControl>
                                        <Textarea placeholder="Enter a comma-separated list of worker employee IDs..." {...field} />
                                    </FormControl>
                                    <FormDescription>
                                        Provide the unique IDs for each worker. The system will fetch their details.
                                    </FormDescription>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </CardContent>
                    <CardFooter>
                        <Button type="submit" disabled={isSubmitting}>
                            {isSubmitting ? "Submitting..." : "Submit Group Request"}
                        </Button>
                    </CardFooter>
                </form>
            </Form>
        </Card>
    )
}
