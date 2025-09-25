import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { mockUsers } from '@/lib/data';
import { User, Building, Mail } from 'lucide-react';
import { QrCode } from '@/components/qr-code';
import { Badge } from '@/components/ui/badge';

export default function ProfilePage() {
    const user = mockUsers[0]; // Assume logged-in user is the admin for this mock

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-bold tracking-tight">My Profile & QR Code</h1>
        <p className="text-muted-foreground">Present this QR code at any gate for scanning.</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="md:col-span-1 flex flex-col items-center justify-center p-8 text-center">
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
            <CardContent className="flex items-center justify-center p-8">
                <div className="w-64 h-64 p-4 border rounded-lg bg-white">
                    <QrCode />
                </div>
            </CardContent>
        </Card>
      </div>
    </div>
  );
}
