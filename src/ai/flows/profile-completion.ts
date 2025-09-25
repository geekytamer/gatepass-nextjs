
// src/ai/flows/profile-completion.ts
'use server';

/**
 * @fileOverview This file defines a Genkit flow for suggesting relevant profile information
 * based on visitor data for security guards creating visitor profiles.
 *
 * @exports suggestProfileCompletion - The main function to trigger the profile completion suggestion flow.
 * @exports ProfileCompletionInput - The input type for the suggestProfileCompletion function.
 * @exports ProfileCompletionOutput - The output type for the suggestProfileCompletion function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const ProfileCompletionInputSchema = z.object({
  visitorName: z.string().describe('The name of the visitor.'),
  company: z.string().describe('The company the visitor belongs to.'),
  notes: z.string().optional().describe('Any additional notes about the visitor.'),
});

export type ProfileCompletionInput = z.infer<typeof ProfileCompletionInputSchema>;

const ProfileCompletionOutputSchema = z.object({
  suggestedRole: z.enum(['Visitor', 'Contractor', 'Worker', 'Other']).describe('Suggested role for the visitor (e.g., Visitor, Contractor).'),
  suggestedAccessLevel: z.enum(['Limited', 'Standard', 'Elevated']).describe('Suggested access level for the visitor (e.g., Limited, Standard).'),
  suggestedNotes: z.string().optional().describe('Suggested notes about the visitor based on their information.'),
});

export type ProfileCompletionOutput = z.infer<typeof ProfileCompletionOutputSchema>;

export async function suggestProfileCompletion(input: ProfileCompletionInput): Promise<ProfileCompletionOutput> {
  return profileCompletionFlow(input);
}

const profileCompletionPrompt = ai.definePrompt({
  name: 'profileCompletionPrompt',
  input: { schema: ProfileCompletionInputSchema },
  output: { schema: ProfileCompletionOutputSchema },
  prompt: `You are an AI assistant helping security guards to quickly create visitor profiles.

  Based on the following visitor information, suggest a role, an access level, and any relevant notes.
  - If the company is 'Guest', the role is likely 'Visitor'.
  - If the company name includes 'Construct', 'Electric', 'Plumbing', etc. the role is likely 'Worker' or 'Contractor'.
  - Default to 'Visitor' and 'Limited' access if unsure.

  Visitor Name: {{{visitorName}}}
  Company: {{{company}}}
  Notes: {{{notes}}}

  Please provide your suggestions in a structured format.
  `, 
});

const profileCompletionFlow = ai.defineFlow(
  {
    name: 'profileCompletionFlow',
    inputSchema: ProfileCompletionInputSchema,
    outputSchema: ProfileCompletionOutputSchema,
  },
  async input => {
    const { output } = await profileCompletionPrompt(input);
    return output!;
  }
);
