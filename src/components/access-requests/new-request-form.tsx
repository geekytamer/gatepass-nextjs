
'use client'

import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import { Calendar as CalendarIcon, FileUp, X } from "lucide-react";

import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import type { AccessRequest, User } from "@/lib/types";
import { useFirestore } from "@/firebase";
import { doc, onSnapshot } from "firebase/firestore";
import { useEffect, useState, useRef } from "react";


const MAX_FILE_SIZE = 4 * 1024 * 1024; // 4MB
const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"];


const formSchema = z.object({
  accessDate: z.date({
    required_error: "An access date is required.",
  }),
  reason: z.string().min(10, {
    message: "Reason must be at least 10 characters.",
  }).max(200, {
      message: "Reason must not be longer than 200 characters.",
  }),
  certificate: z.any()
    .refine((file) => !file || file.size <= MAX_FILE_SIZE, `Max file size is 4MB.`)
    .refine(
      (file) => !file || ACCEPTED_IMAGE_TYPES.includes(file.type),
      "Only .jpg, .jpeg, .png and .webp formats are supported."
    ).optional(),
});

interface NewRequestFormProps {
    currentUserId: string;
    onNewRequest: (request: Omit<AccessRequest, 'id'|'status'|'requestedAt'>) => void;
}

export function NewRequestForm({ currentUserId, onNewRequest }: NewRequestFormProps) {
    const { toast } = useToast();
    const [userName, setUserName] = useState("User");
    const [userAvatar, setUserAvatar] = useState("");
    const firestore = useFirestore();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [preview, setPreview] = useState<string | null>(null);

    useEffect(() => {
        if (!firestore) return;
        const userRef = doc(firestore, 'users', currentUserId);
        const unsubscribe = onSnapshot(userRef, (docSnap) => {
             if (docSnap.exists()) {
                const user = docSnap.data() as User;
                setUserName(user.name);
                setUserAvatar(user.avatarUrl);
            }
        });
        return () => unsubscribe();
    }, [currentUserId, firestore]);

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            reason: "",
        },
    });

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            form.setValue('certificate', file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setPreview(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };
    
    const  handleRemoveFile = () => {
        form.setValue('certificate', null);
        setPreview(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    }


    const fileToBase64 = (file: File): Promise<string> => {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = error => reject(error);
      });
    };

    async function onSubmit(values: z.infer<typeof formSchema>) {
        let certificateDataUrl: string | undefined = undefined;
        if (values.certificate) {
            try {
                certificateDataUrl = await fileToBase64(values.certificate);
            } catch (error) {
                console.error("Error converting file to Base64:", error);
                toast({
                    variant: "destructive",
                    title: "File Error",
                    description: "Could not process the selected file.",
                });
                return;
            }
        }

        onNewRequest({
            userId: currentUserId,
            userName: userName,
            userAvatar: userAvatar,
            date: format(values.accessDate, "yyyy-MM-dd"),
            reason: values.reason,
            certificateDataUrl,
        });

        toast({
            title: "Request Submitted!",
            description: "Your access request has been sent for approval.",
        });
        form.reset();
        handleRemoveFile();
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Submit a New Access Request</CardTitle>
                <CardDescription>Fill out the details below to request access for a specific date.</CardDescription>
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
                            name="certificate"
                            render={() => (
                                <FormItem>
                                    <FormLabel>Attach Certificate (Optional)</FormLabel>
                                    <FormControl>
                                        <div className="flex items-center gap-4">
                                            <Button type="button" variant="outline" onClick={() => fileInputRef.current?.click()}>
                                                <FileUp className="mr-2 h-4 w-4" />
                                                Choose File
                                            </Button>
                                             <Input
                                                ref={fileInputRef}
                                                type="file"
                                                className="hidden"
                                                onChange={handleFileChange}
                                                accept={ACCEPTED_IMAGE_TYPES.join(",")}
                                            />
                                            {preview && (
                                                <div className="relative group">
                                                    <img src={preview} alt="File preview" className="h-16 w-auto rounded-md border" />
                                                    <Button type="button" variant="destructive" size="icon" className="absolute -top-2 -right-2 h-5 w-5 rounded-full opacity-0 group-hover:opacity-100" onClick={handleRemoveFile}>
                                                        <X className="h-3 w-3" />
                                                    </Button>
                                                </div>
                                            )}
                                        </div>
                                    </FormControl>
                                    <FormDescription>
                                        Attach a supporting document or certificate (e.g., safety training, work order). Max 4MB.
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
