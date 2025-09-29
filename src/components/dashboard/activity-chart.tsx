
'use client';

import React, { useState, useEffect } from 'react';
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from 'recharts';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartConfig,
} from '@/components/ui/chart';
import { useFirestore } from '@/firebase';
import { collection, onSnapshot, query, where, Timestamp } from 'firebase/firestore';
import { subHours, format, startOfHour, eachHourOfInterval, parseISO } from 'date-fns';
import type { GateActivity } from '@/lib/types';
import { Skeleton } from '../ui/skeleton';

const chartConfig = {
  checkIn: {
    label: 'Check-ins',
    color: 'hsl(var(--chart-1))',
  },
  checkOut: {
    label: 'Check-outs',
    color: 'hsl(var(--chart-2))',
  },
} satisfies ChartConfig;

export function ActivityChart() {
  const [chartData, setChartData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const firestore = useFirestore();

  useEffect(() => {
    if (!firestore) return;

    setLoading(true);
    const now = new Date();
    const startTime = subHours(now, 24);

    const activityQuery = query(
      collection(firestore, 'gateActivity'),
      where('timestamp', '>=', startTime)
    );

    const unsubscribe = onSnapshot(activityQuery, (snapshot) => {
      const activities = snapshot.docs.map(doc => {
          const data = doc.data();
          // Firestore Timestamps need to be converted to JS Dates
          const timestamp = data.timestamp instanceof Timestamp ? data.timestamp.toDate() : parseISO(data.timestamp);
          return { ...data, timestamp } as GateActivity;
      });

      const last24Hours = eachHourOfInterval({
        start: startOfHour(startTime),
        end: startOfHour(now),
      });

      const processedData = last24Hours.map(hour => {
        const checkIns = activities.filter(a => 
            a.type === 'Check-in' &&
            startOfHour(a.timestamp).getTime() === hour.getTime()
        ).length;
        
        const checkOuts = activities.filter(a => 
            a.type === 'Check-out' &&
            startOfHour(a.timestamp).getTime() === hour.getTime()
        ).length;

        return {
          hour: format(hour, 'ha'),
          checkIn: checkIns,
          checkOut: checkOuts,
        };
      });

      setChartData(processedData);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [firestore]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Gate Activity</CardTitle>
        <CardDescription>Check-ins and check-outs over the last 24 hours.</CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
           <div className="h-[300px] w-full">
                <Skeleton className="h-full w-full" />
           </div>
        ) : (
            <ChartContainer config={chartConfig} className="h-[300px] w-full">
                <BarChart data={chartData} margin={{ top: 20, right: 20, left: -10, bottom: 0 }}>
                    <CartesianGrid vertical={false} strokeDasharray="3 3" />
                    <XAxis
                    dataKey="hour"
                    tickLine={false}
                    axisLine={false}
                    tickMargin={8}
                    tickFormatter={(value, index) => index % 3 === 0 ? value : ''}
                    />
                    <YAxis
                        tickLine={false}
                        axisLine={false}
                        tickMargin={8}
                        width={30}
                        allowDecimals={false}
                    />
                    <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
                    <Bar dataKey="checkIn" fill="var(--color-checkIn)" radius={4} />
                    <Bar dataKey="checkOut" fill="var(--color-checkOut)" radius={4} />
                </BarChart>
            </ChartContainer>
        )}
      </CardContent>
    </Card>
  );
}
