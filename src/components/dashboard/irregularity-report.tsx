'use client';
import { useState } from 'react';
import { AlertTriangle, Sparkles, Loader2 } from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { detectIrregularities } from '@/ai/flows/detect-irregularities';
import { useToast } from '@/hooks/use-toast';
import { getAllGateActivity } from '@/services/gateActivityService';

export function IrregularityReport() {
  const [report, setReport] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleDetection = async () => {
    setIsLoading(true);
    setReport('');
    try {
      const activity = await getAllGateActivity();
      const activityData = JSON.stringify(activity);
      const result = await detectIrregularities({ activityData });
      setReport(result.report);
    } catch (error) {
      console.error('Error detecting irregularities:', error);
      toast({
        variant: 'destructive',
        title: 'AI Analysis Failed',
        description: 'Could not generate the irregularity report. Please try again.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="h-full flex flex-col">
      <CardHeader>
        <div className="flex items-center gap-2">
            <Sparkles className="h-6 w-6 text-primary" />
            <CardTitle>AI Irregularity Detection</CardTitle>
        </div>
        <CardDescription>
          Use AI to analyze gate activity for suspicious patterns.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-grow">
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <div className="flex flex-col items-center gap-2 text-muted-foreground">
                <Loader2 className="h-8 w-8 animate-spin" />
                <p>Analyzing activity...</p>
            </div>
          </div>
        ) : report ? (
          <div className="prose prose-sm max-w-none text-foreground dark:prose-invert">
            <p className='flex items-start gap-2'><AlertTriangle className='h-4 w-4 text-destructive flex-shrink-0 mt-1' /> <span>{report}</span></p>
          </div>
        ) : (
            <div className="flex items-center justify-center h-full">
                 <div className="text-center text-muted-foreground">
                    <p>Click the button below to start the analysis.</p>
                 </div>
            </div>
        )}
      </CardContent>
      <CardFooter>
        <Button onClick={handleDetection} disabled={isLoading} className="w-full">
          {isLoading ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Sparkles className="mr-2 h-4 w-4" />
          )}
          Analyze Now
        </Button>
      </CardFooter>
    </Card>
  );
}
