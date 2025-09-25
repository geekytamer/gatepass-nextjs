import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { getRecentGateActivity } from '@/services/gateActivityService';
import { formatDistanceToNow } from 'date-fns';

export async function RecentActivity() {
  const recentActivity = await getRecentGateActivity(5);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Gate Activity</CardTitle>
        <CardDescription>A log of the latest check-ins and check-outs.</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>User</TableHead>
              <TableHead>Gate</TableHead>
              <TableHead>Type</TableHead>
              <TableHead className="text-right">Time</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {recentActivity.map((activity) => (
              <TableRow key={activity.id}>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <Avatar className="h-9 w-9">
                      <AvatarImage src={activity.userAvatar} alt={activity.userName} />
                      <AvatarFallback>{activity.userName.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div className="font-medium">{activity.userName}</div>
                  </div>
                </TableCell>
                <TableCell>{activity.gate}</TableCell>
                <TableCell>
                   <Badge variant={activity.type === 'Check-in' ? 'default' : 'secondary'} className={activity.type === 'Check-in' ? 'bg-green-500/20 text-green-700 border-transparent hover:bg-green-500/30' : 'bg-red-500/20 text-red-700 border-transparent hover:bg-red-500/30'}>
                    {activity.type}
                  </Badge>
                </TableCell>
                <TableCell className="text-right text-muted-foreground">
                  {formatDistanceToNow(new Date(activity.timestamp), { addSuffix: true })}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
