
'use client';

import { ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth, useFirebaseApp } from '@/firebase';
import { GoogleAuthProvider, signInWithPopup, getAuth } from 'firebase/auth';
import { useRouter } from 'next/navigation';
import { useUser } from '@/firebase/auth/use-user';
import { useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';

const GoogleIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" width="24px" height="24px" {...props}>
        <path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12s5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24s8.955,20,20,20s20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z" />
        <path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z" />
        <path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.222,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z" />
        <path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571l6.19,5.238C39.904,36.336,44,30.651,44,24C44,22.659,43.862,21.35,43.611,20.083z" />
    </svg>
);


export default function LoginPage() {
    const router = useRouter();
    const app = useFirebaseApp();
    const { toast } = useToast();
    const { user, loading } = useUser();

    // If user is already logged in, redirect to dashboard
    useEffect(() => {
        if (!loading && user) {
            router.push('/dashboard');
        }
    }, [user, loading, router]);


    const handleSignIn = async () => {
        if (!app) {
            console.error("Firebase app not initialized");
            toast({ variant: "destructive", title: "Error", description: "Firebase is not configured." });
            return;
        }

        const auth = getAuth(app);
        const provider = new GoogleAuthProvider();

        try {
            await signInWithPopup(auth, provider);
            router.push('/dashboard');
            toast({ title: "Login Successful", description: "Welcome back!" });
        } catch (error) {
            console.error("Authentication Error", error);
            toast({ variant: "destructive", title: "Login Failed", description: "Could not sign in with Google." });
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
                    <Button className="w-full" onClick={handleSignIn}>
                        <GoogleIcon className="mr-2"/>
                        Sign in with Google
                    </Button>
                </CardContent>
            </Card>
        </div>
    );
}

