
'use client';

import { ShieldCheck, KeyRound } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useFirebaseApp, useFirestore } from '@/firebase';
import { updatePassword, getAuth } from 'firebase/auth';
import { useRouter } from 'next/navigation';
import { useUser } from '@/firebase/auth/use-user';
import { useToast } from '@/hooks/use-toast';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { doc, updateDoc } from 'firebase/firestore';

const formSchema = z.object({
  newPassword: z.string().min(8, { message: 'Password must be at least 8 characters.' }),
  confirmPassword: z.string(),
}).refine(data => data.newPassword === data.confirmPassword, {
  message: "Passwords do not match.",
  path: ["confirmPassword"],
});

export default function ActivateAccountPage() {
    const router = useRouter();
    const app = useFirebaseApp();
    const firestore = useFirestore();
    const { toast } = useToast();
    const { user, loading } = useUser();

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            newPassword: '',
            confirmPassword: '',
        },
    });

    const handleActivation = async (values: z.infer<typeof formSchema>) => {
        if (!app || !firestore || !user) {
            console.error("Firebase not initialized or user not found");
            toast({ variant: "destructive", title: "Error", description: "An unexpected error occurred." });
            return;
        }

        const auth = getAuth(app);
        const currentUser = auth.currentUser;

        if (!currentUser) {
             toast({ variant: "destructive", title: "Authentication Error", description: "Could not verify your session. Please log in again." });
             router.push('/login');
             return;
        }

        try {
            // Step 1: Update the password in Firebase Authentication
            await updatePassword(currentUser, values.newPassword);
            
            // Step 2: Update the user's status in Firestore to 'Active'
            const userRef = doc(firestore, "users", currentUser.uid);
            await updateDoc(userRef, { status: 'Active' });

            toast({ title: "Account Activated!", description: "Your password has been changed and your account is now active." });
            router.push('/dashboard');

        } catch (error) {
            console.error("Account Activation Error", error);
             toast({ variant: "destructive", title: "Activation Failed", description: "Could not update your password. You may need to log out and log back in." });
        }
    };
    
    if (loading) {
        return <div className="h-svh w-full bg-background flex items-center justify-center">Loading...</div>;
    }

    return (
        <div className="flex min-h-svh items-center justify-center bg-background p-4">
            <Card className="w-full max-w-md">
                <CardHeader className="text-center">
                    <div className="flex justify-center mb-4">
                         <div className="flex h-14 w-14 items-center justify-center bg-primary rounded-2xl">
                            <KeyRound className="text-primary-foreground h-8 w-8" />
                        </div>
                    </div>
                    <CardTitle className="text-2xl">Activate Your Account</CardTitle>
                    <CardDescription>To secure your account, please create a new password.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(handleActivation)} className="space-y-4">
                            <FormField
                                control={form.control}
                                name="newPassword"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>New Password</FormLabel>
                                        <FormControl>
                                            <Input type="password" placeholder="••••••••" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                             <FormField
                                control={form.control}
                                name="confirmPassword"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Confirm New Password</FormLabel>
                                        <FormControl>
                                            <Input type="password" placeholder="••••••••" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
                                {form.formState.isSubmitting ? 'Activating...' : 'Set Password and Activate'}
                            </Button>
                        </form>
                    </Form>
                </CardContent>
            </Card>
        </div>
    );
}
