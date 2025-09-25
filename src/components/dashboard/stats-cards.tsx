import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Users, Hourglass, LogIn, Building } from 'lucide-react';
import { mockUsers, mockAccessRequests, mockGateActivity } from '@/lib/data';

export async function StatsCards() {
  const totalUsers = mockUsers.length;
  const pendingRequests = mockAccessRequests.filter(r => r.status === 'Pending').length;
  const checkedIn = mockGateActivity.filter(a => a.type === 'Check-in').length - mockGateActivity.filter(a => a.type === 'Check-out').length;
  const totalVisitors = mockUsers.filter(u => u.role === 'Visitor' || u.role === 'Worker').length;

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Users</CardTitle>
          <Users className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{totalUsers}</div>
          <p className="text-xs text-muted-foreground">All roles included</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Pending Requests</CardTitle>
          <Hourglass className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{pendingRequests}</div>
          <p className="text-xs text-muted-foreground">Awaiting manager approval</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Currently Checked-In</CardTitle>
          <LogIn className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{checkedIn > 0 ? checkedIn : 0}</div>
          <p className="text-xs text-muted-foreground">Personnel on-site now</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Visitors & Workers</CardTitle>
          <Building className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{totalVisitors}</div>
          <p className="text-xs text-muted-foreground">Registered external personnel</p>
        </CardContent>
      </Card>
    </div>
  );
}
