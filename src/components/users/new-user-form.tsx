
'use client'

import { z } from "zod";
import { useFieldArray, useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import type { User, UserRole, Certificate, CertificateType, Site, Contractor, Operator } from "@/lib/types";
import { CalendarIcon, FileText, Trash2, Info } from "lucide-react";
import React, { useEffect, useState } from "react";
import { useFirestore } from "@/firebase";
import { collection, onSnapshot } from "firebase/firestore";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { Calendar } from "../ui/calendar";
import { Alert, AlertDescription, AlertTitle } from "../ui/alert";
import { useMediaQuery } from "react-responsive";


const formSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters." }),
  email: z.string().email({ message: "Please enter a valid email." }),
  role: z.enum(['Admin', 'Manager', 'Security', 'Visitor', 'Worker', 'Supervisor']),
  notes: z.string().optional(),
  certificates: z.array(z.object({
      name: z.string({ required_error: "Please select a certificate type."}).min(1, "Certificate name is required."),
      expiryDate: z.date().optional(),
  })).optional(),
  assignedSiteId: z.string().optional(),
  contractorId: z.string().optional(),
  operatorId: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface NewUserFormProps {
    onNewUser: (user: Omit<User, 'id' | 'avatarUrl' | 'status' | 'idCardImageUrl' | 'idNumber'>) => void;
    sites: Site[];
    contractors: Contractor[];
    operators: Operator[];
    isLoading: boolean;
}

export function NewUserForm({ onNewUser, sites, contractors, operators, isLoading }: NewUserFormProps) {
    const [certificateTypes, setCertificateTypes] = useState<CertificateType[]>([]);
    const [loadingCerts, setLoadingCerts] = useState(true);
    const firestore = useFirestore();
    const roles: UserRole[] = ['Admin', 'Manager', 'Security', 'Visitor', 'Worker', 'Supervisor'];

    const form = useForm<FormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            name: "",
            email: "",
            notes: "",
            role: "Worker",
            certificates: [],
            assignedSiteId: "",
            contractorId: "",
            operatorId: "",
        },
    });

    const selectedRole = useWatch({
      control: form.control,
      name: 'role'
    });

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


    const { fields, append, remove } = useFieldArray({
      control: form.control,
      name: "certificates",
    });

    async function onSubmit(values: FormValues) {
        const certificates: Certificate[] = values.certificates ? values.certificates.map(cert => ({
            name: cert.name,
            expiryDate: cert.expiryDate ? format(cert.expiryDate, "yyyy-MM-dd") : undefined,
        })) : [];

        const selectedContractor = contractors.find(c => c.id === values.contractorId);

        const newUser: Omit<User, 'id' | 'avatarUrl' | 'status' | 'idCardImageUrl' | 'idNumber'> = {
            ...values,
            company: selectedContractor?.name || '',
            role: values.role as UserRole,
            certificates: certificates,
        };
        
        if(values.role !== 'Security') {
            delete newUser.assignedSiteId;
        }
        if(values.role !== 'Worker' && values.role !== 'Supervisor') {
            delete newUser.contractorId;
            delete newUser.company;
        }
        if(values.role !== 'Admin' && values.role !== 'Manager') {
            delete newUser.operatorId;
        }

        onNewUser(newUser);

        form.reset();
    }

    return (
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8 pt-4">
          <div className="space-y-6 overflow-y-visible sm:max-h-[70vh] sm:overflow-y-auto px-1 sm:pr-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Full Name</FormLabel>
                    <FormControl>
                      <Input placeholder="John Doe" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email Address</FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        placeholder="john.doe@example.com"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
               <FormField
                control={form.control}
                name="role"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Role</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a role" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {roles.map((role) => (
                          <SelectItem key={role} value={role}>
                            {role}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
               {(selectedRole === "Worker" || selectedRole === "Supervisor") && (
                <FormField
                    control={form.control}
                    name="contractorId"
                    render={({ field }) => (
                    <FormItem>
                        <FormLabel>Contractor Company</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value} disabled={isLoading}>
                            <FormControl><SelectTrigger>
                                <SelectValue placeholder={isLoading ? "Loading..." : "Assign a contractor"}/>
                            </SelectTrigger></FormControl>
                            <SelectContent>
                                {contractors.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                            </SelectContent>
                        </Select>
                        <FormMessage />
                    </FormItem>
                    )}
                />
                )}
                 {(selectedRole === "Admin" || selectedRole === "Manager") && (
                <FormField
                    control={form.control}
                    name="operatorId"
                    render={({ field }) => (
                    <FormItem>
                        <FormLabel>Operator Company</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value} disabled={isLoading}>
                            <FormControl><SelectTrigger>
                                <SelectValue placeholder={isLoading ? "Loading..." : "Assign an operator"}/>
                            </SelectTrigger></FormControl>
                            <SelectContent>
                                {operators.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                            </SelectContent>
                        </Select>
                        <FormMessage />
                    </FormItem>
                    )}
                />
                )}
            </div>

            {selectedRole === "Security" && (
              <FormField
                control={form.control}
                name="assignedSiteId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Assigned Site</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      value={field.value}
                      disabled={isLoading}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue
                            placeholder={
                              isLoading
                                ? "Loading sites..."
                                : "Select a site to assign"
                            }
                          />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {sites.map((site) => (
                          <SelectItem key={site.id} value={site.id}>
                            {site.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      Assign this security user to a specific site.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes (Optional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="e.g., Senior project manager for the new construction wing."
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="space-y-4">
              <FormLabel>Certificates (Optional)</FormLabel>
              <FormDescription>
                Log certificates like safety training or work permits.
              </FormDescription>
              {fields.map((field, index) => (
                <div
                  key={field.id}
                  className="flex items-end gap-4 p-4 border rounded-md relative"
                >
                  <FormField
                    control={form.control}
                    name={`certificates.${index}.name`}
                    render={({ field }) => (
                      <FormItem className="flex-1">
                        <FormLabel>Certificate Type</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                          disabled={loadingCerts}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue
                                placeholder={
                                  loadingCerts
                                    ? "Loading..."
                                    : "Select certificate type"
                                }
                              />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {certificateTypes.map((type) => (
                              <SelectItem key={type.id} value={type.name}>
                                {type.name}
                              </SelectItem>
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
                        {(() => {
                          const isMobile = useMediaQuery({ maxWidth: 768 });

                          return isMobile ? (
                            // ✅ Native mobile date picker
                            <FormControl>
                              <input
                                type="date"
                                value={
                                  field.value
                                    ? format(field.value, "yyyy-MM-dd")
                                    : ""
                                }
                                onChange={(e) =>
                                  field.onChange(
                                    e.target.value
                                      ? new Date(e.target.value)
                                      : undefined
                                  )
                                }
                                className="w-[200px] rounded-md border border-input bg-background px-3 py-2 text-sm"
                              />
                            </FormControl>
                          ) : (
                            // 🖥️ Desktop calendar
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
                              <PopoverContent
                                className="w-auto p-0"
                                align="start"
                              >
                                <Calendar
                                  mode="single"
                                  selected={field.value}
                                  onSelect={field.onChange}
                                  initialFocus
                                />
                              </PopoverContent>
                            </Popover>
                          );
                        })()}
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="text-destructive"
                    onClick={() => remove(index)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => append({ name: "" })}
              >
                <FileText className="mr-2 h-4 w-4" />
                Add Certificate Record
              </Button>
            </div>
          </div>
          <div className="flex justify-end pt-8">
            <Button type="submit">Create User Profile</Button>
          </div>
        </form>
      </Form>
    );
}
