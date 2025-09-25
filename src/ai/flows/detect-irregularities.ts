'use server';

/**
 * @fileOverview Detects irregularities in gate activity using AI.
 *
 * - detectIrregularities - A function that takes gate activity data and returns a report on any identified irregularities.
 * - DetectIrregularitiesInput - The input type for the detectIrregularities function, representing gate activity data.
 * - DetectIrregularitiesOutput - The return type for the detectIrregularities function, providing a report on any irregularities found.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const DetectIrregularitiesInputSchema = z.object({
  activityData: z
    .string()
    .describe(
      'A JSON string containing gate activity data, including timestamps, user IDs, access points, and access types (entry/exit).'
    ),
});
export type DetectIrregularitiesInput = z.infer<typeof DetectIrregularitiesInputSchema>;

const DetectIrregularitiesOutputSchema = z.object({
  report: z
    .string()
    .describe(
      'A report summarizing any detected irregularities in the gate activity data, including the type of irregularity, timestamp, and affected user/access point.'
    ),
});
export type DetectIrregularitiesOutput = z.infer<typeof DetectIrregularitiesOutputSchema>;

export async function detectIrregularities(
  input: DetectIrregularitiesInput
): Promise<DetectIrregularitiesOutput> {
  return detectIrregularitiesFlow(input);
}

const detectIrregularitiesPrompt = ai.definePrompt({
  name: 'detectIrregularitiesPrompt',
  input: {schema: DetectIrregularitiesInputSchema},
  output: {schema: DetectIrregularitiesOutputSchema},
  prompt: `You are a security expert analyzing gate activity data to identify irregularities.

  Analyze the following gate activity data and generate a report summarizing any detected irregularities, including the type of irregularity, timestamp, and affected user/access point.

  Gate Activity Data: {{{activityData}}}

  If there are no irregularities, state that no irregularities were detected.
  `,
});

const detectIrregularitiesFlow = ai.defineFlow(
  {
    name: 'detectIrregularitiesFlow',
    inputSchema: DetectIrregularitiesInputSchema,
    outputSchema: DetectIrregularitiesOutputSchema,
  },
  async input => {
    const {output} = await detectIrregularitiesPrompt(input);
    return output!;
  }
);
