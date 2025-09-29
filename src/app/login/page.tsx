
'use client';

import { ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useFirebaseApp } from '@/firebase';
import { signInWithEmailAndPassword, getAuth } from 'firebase/auth';
import { useRouter } from 'next/navigation';
import { useUser } from '@/firebase/auth/use-user';
import { useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';

const formSchema = z.object({
  email: z.string().email({ message: 'Please enter a valid email address.' }),
  password: z.string().min(6, { message: 'Password must be at least 6 characters.' }),
});

export default function LoginPage() {
    const router = useRouter();
    const app = useFirebaseApp();
    const { toast } = useToast();
    const { user, loading } = useUser();

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            email: '',
            password: '',
        },
    });

    // If user is already logged in, redirect to dashboard
    useEffect(() => {
        if (!loading && user) {
            router.push('/dashboard');
        }
    }, [user, loading, router]);


    const handleSignIn = async (values: z.infer<typeof formSchema>) => {
        if (!app) {
            console.error("Firebase app not initialized");
            toast({ variant: "destructive", title: "Error", description: "Firebase is not configured." });
            return;
        }

        const auth = getAuth(app);
        try {
            await signInWithEmailAndPassword(auth, values.email, values.password);
            router.push('/dashboard');
            toast({ title: "Login Successful", description: "Welcome back!" });
        } catch (error) {
            console.error("Authentication Error", error);
             toast({ variant: "destructive", title: "Login Failed", description: "Invalid email or password. Please try again." });
        }
    };
    
    if(loading || user) {
        // Show a simple loading state or a blank screen while redirecting
        return <div className="h-svh w-full bg-background" />;
    }

    return (
        <div className="flex min-h-svh items-center justify-center bg-background p-4">
            <Card className="w-full max-w-sm">
                <CardHeader className="text-center">
                    <div className="flex justify-center mb-4">
                         <div className="flex h-14 w-14 items-center justify-center bg-primary rounded-2xl">
                            <ShieldCheck className="text-primary-foreground h-8 w-8" />
                        </div>
                    </div>
                    <CardTitle className="text-2xl">Welcome to GatePass</CardTitle>
                    <CardDescription>Sign in to access the dashboard</CardDescription>
                </CardHeader>
                <CardContent>
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(handleSignIn)} className="space-y-4">
                            <FormField
                                control={form.control}
                                name="email"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Email</FormLabel>
                                        <FormControl>
                                            <Input type="email" placeholder="admin@gatepass.com" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                             <FormField
                                control={form.control}
                                name="password"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Password</FormLabel>
                                        <FormControl>
                                            <Input type="password" placeholder="••••••••" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
                                {form.formState.isSubmitting ? 'Signing In...' : 'Sign In'}
                            </Button>
                        </form>
                    </Form>
                </CardContent>
            </Card>
        </div>
    );
}
