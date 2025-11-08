
'use server';
/**
 * @fileOverview A Genkit flow for fetching worker data from a mock service.
 * In a real-world scenario, this would connect to an external HR or employee database.
 *
 * - fetchWorkerData - A function that simulates fetching worker details.
 * - FetchWorkerDataInput - The input type for the function.
 * - FetchWorkerDataOutput - The output type for the function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { Certificate } from '@/lib/types';

const FetchWorkerDataInputSchema = z.object({
  workerId: z.string().describe('The unique ID of the worker to fetch.'),
});
export type FetchWorkerDataInput = z.infer<typeof FetchWorkerDataInputSchema>;

const CertificateSchema = z.object({
    name: z.string(),
    expiryDate: z.string().optional(),
});

const FetchWorkerDataOutputSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string().email(),
  company: z.string(),
  age: z.number(),
  nationality: z.string(),
  jobTitle: z.string(),
  idNumber: z.string(),
  certificates: z.array(CertificateSchema),
}).nullable();
export type FetchWorkerDataOutput = z.infer<typeof FetchWorkerDataOutputSchema>;


/**
 * Exported function to be called from the application server-side code.
 * It wraps the Genkit flow.
 */
export async function fetchWorkerData(input: FetchWorkerDataInput): Promise<FetchWorkerDataOutput> {
  return fetchWorkerDataFlow(input);
}

/**
 * The main Genkit flow for fetching worker data.
 */
const fetchWorkerDataFlow = ai.defineFlow(
  {
    name: 'fetchWorkerDataFlow',
    inputSchema: FetchWorkerDataInputSchema,
    outputSchema: FetchWorkerDataOutputSchema,
  },
  async ({ workerId }) => {
    console.log(`[Flow] Fetching data for worker ID: ${workerId}`);
    
    // Simulate a network delay
    await new Promise(resolve => setTimeout(resolve, 300 + Math.random() * 400));
    
    // Mock Database of workers
    const mockWorkerDatabase: { [id: string]: Omit<NonNullable<FetchWorkerDataOutput>, 'id'> } = {
        "EMP101": { 
            name: "Alice Johnson", 
            email: "alice.j@contractor-a.com", 
            company: "Alpha Services",
            age: 34,
            nationality: "American",
            jobTitle: "Senior Welder",
            idNumber: "US-123456",
            certificates: [
                { name: "Scaffolding Safety", expiryDate: "2025-08-15" },
                { name: "Working at Heights", expiryDate: "2026-01-20" },
            ]
        },
        "EMP102": { 
            name: "Bob Williams", 
            email: "bob.w@contractor-a.com", 
            company: "Alpha Services",
            age: 42,
            nationality: "British",
            jobTitle: "Electrician",
            idNumber: "GB-789012",
            certificates: [
                { name: "Electrical Safety", expiryDate: "2024-11-30" },
            ]
        },
        "EMP201": { 
            name: "Charlie Brown", 
            email: "charlie.b@contractor-b.net", 
            company: "Beta Solutions",
            age: 28,
            nationality: "Canadian",
            jobTitle: "Pipefitter",
            idNumber: "CA-345678",
            certificates: [
                 { name: "Confined Space Entry", expiryDate: "2025-06-01" },
            ]
        },
        "EMP202": { 
            name: "Diana Miller", 
            email: "diana.m@contractor-b.net", 
            company: "Beta Solutions",
            age: 39,
            nationality: "Australian",
            jobTitle: "HSE Advisor",
            idNumber: "AU-901234",
            certificates: [
                { name: "NEBOSH IGC", expiryDate: "2027-03-10" },
                { name: "First Aid", expiryDate: "2025-02-28" },
            ]
        },
        "EMP301": { 
            name: "Ethan Davis", 
            email: "ethan.d@contractor-c.org", 
            company: "Gamma Tech",
            age: 51,
            nationality: "German",
            jobTitle: "Lead Inspector",
            idNumber: "DE-567890",
            certificates: [
                 { name: "API 510 Inspector", expiryDate: "2026-10-05" },
            ]
        },
    };

    const worker = mockWorkerDatabase[workerId.toUpperCase()];

    if (worker) {
        console.log(`[Flow] Found worker: ${worker.name}`);
        return {
            id: workerId,
            ...worker,
        };
    } else {
        console.log(`[Flow] Worker ID ${workerId} not found.`);
        return null;
    }
  }
);
