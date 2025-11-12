
'use client';

import React, { useState, useEffect } from 'react';
import { Pie, PieChart, Cell } from 'recharts';
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
  ChartLegend,
  ChartLegendContent,
  ChartConfig
} from '@/components/ui/chart';
import { useFirestore } from '@/firebase';
import { collection, onSnapshot, query, where, Query } from 'firebase/firestore';
import type { AccessRequest } from '@/lib/types';
import { Skeleton } from '../ui/skeleton';

interface ContractorAccessChartProps {
    siteId: string;
}

export function ContractorAccessChart({ siteId }: ContractorAccessChartProps) {
  const [chartData, setChartData] = useState<any[]>([]);
  const [chartConfig, setChartConfig] = useState<ChartConfig>({});
  const [loading, setLoading] = useState(true);
  const firestore = useFirestore();

  useEffect(() => {
    if (!firestore) return;

    setLoading(true);
    let requestsQuery: Query = query(
      collection(firestore, 'accessRequests'),
      where('status', '==', 'Approved')
    );

    if (siteId !== 'all') {
        requestsQuery = query(requestsQuery, where('siteId', '==', siteId));
    }

    const unsubscribe = onSnapshot(requestsQuery, (snapshot) => {
      const requests = snapshot.docs.map(doc => doc.data() as AccessRequest);

      const requestsByContractor = requests.reduce((acc, request) => {
        const contractorName = request.contractorName || 'Unknown';
        acc[contractorName] = (acc[contractorName] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const processedData = Object.entries(requestsByContractor).map(([name, count]) => ({
        name,
        count,
      })).sort((a, b) => b.count - a.count);

      const newChartConfig: ChartConfig = {};
      const colors = ['hsl(var(--chart-1))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))', 'hsl(var(--chart-5))'];

      processedData.forEach((item, index) => {
        newChartConfig[item.name] = {
          label: item.name,
          color: colors[index % colors.length],
        };
      });

      setChartData(processedData);
      setChartConfig(newChartConfig);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [firestore, siteId]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Approved Access by Contractor</CardTitle>
        <CardDescription>
            {siteId === 'all' ? 'Distribution of approved requests across all contractors and sites.' : 'Distribution for the selected site.'}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex items-center justify-center">
        {loading ? (
           <div className="h-[250px] w-[250px]">
                <Skeleton className="h-full w-full rounded-full" />
           </div>
        ) : chartData.length > 0 ? (
            <ChartContainer config={chartConfig} className="mx-auto aspect-square h-[250px]">
                <PieChart>
                    <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel />} />
                    <Pie data={chartData} dataKey="count" nameKey="name" innerRadius={60}>
                       {chartData.map((entry) => (
                         <Cell key={entry.name} fill={chartConfig[entry.name]?.color} />
                       ))}
                    </Pie>
                    <ChartLegend content={<ChartLegendContent nameKey="name" />} />
                </PieChart>
            </ChartContainer>
        ) : (
            <div className="h-[250px] flex items-center justify-center text-muted-foreground">
                No approved requests found.
            </div>
        )}
      </CardContent>
    </Card>
  );
}
