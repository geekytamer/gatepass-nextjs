import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { getUser } from '@/services/userService';
import { User, Building, Mail } from 'lucide-react';
import { QrCode } from '@/components/qr-code';
import { Badge } from '@/components/ui/badge';
import { redirect } from 'next/navigation';

export default async function ProfilePage() {
    // In a real app, you'd get the logged-in user's ID
    const user = await getUser('usr_001'); 

    if (!user) {
        // Handle case where user is not found, maybe redirect to login
        redirect('/');
    }

  return (
    <div className="space-y-4 md:space-y-6">
      <header>
        <h1 className="text-3xl font-bold tracking-tight">My Profile & QR Code</h1>
        <p className="text-muted-foreground">Present this QR code at any gate for scanning.</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="md:col-span-1 flex flex-col items-center justify-center p-6 md:p-8 text-center">
            <Avatar className="h-24 w-24 mb-4">
                <AvatarImage src={user.avatarUrl} alt={user.name} />
                <AvatarFallback>{user.name.slice(0, 2).toUpperCase()}</AvatarFallback>
            </Avatar>
            <h2 className="text-2xl font-semibold">{user.name}</h2>
            <p className="text-muted-foreground">{user.email}</p>
            <Badge className="mt-4" variant="default">{user.role}</Badge>
        </Card>
        <Card className="md:col-span-2">
            <CardHeader>
                <CardTitle>Your Access QR Code</CardTitle>
                <CardDescription>This unique code contains your user ID. It can only be scanned by the GatePass system.</CardDescription>
            </CardHeader>
            <CardContent className="flex items-center justify-center p-4 sm:p-8">
                <div className="w-48 h-48 sm:w-64 sm:h-64 p-4 border rounded-lg bg-white">
                    <QrCode />
                </div>
            </CardContent>
        </Card>
      </div>
    </div>
  );
}
