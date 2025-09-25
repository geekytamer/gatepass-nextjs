'use client';

import { Bar, BarChart, CartesianGrid, XAxis, YAxis, ResponsiveContainer } from 'recharts';
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
import { subHours, format, eachHourOfInterval, startOfHour } from 'date-fns';

const now = new Date();
const last24Hours = eachHourOfInterval({
  start: subHours(now, 24),
  end: now,
});

const chartData = last24Hours.map(hour => {
  const formattedHour = format(startOfHour(hour), 'ha');
  return {
    hour: formattedHour,
    checkIn: Math.floor(Math.random() * 20) + 5,
    checkOut: Math.floor(Math.random() * 15) + 3,
  };
});

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
  return (
    <Card>
      <CardHeader>
        <CardTitle>Gate Activity</CardTitle>
        <CardDescription>Check-ins and check-outs over the last 24 hours.</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
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
                    />
                    <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
                    <Bar dataKey="checkIn" fill="var(--color-checkIn)" radius={4} />
                    <Bar dataKey="checkOut" fill="var(--color-checkOut)" radius={4} />
                </BarChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
