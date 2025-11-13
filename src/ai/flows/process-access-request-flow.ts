
'use server';
/**
 * @fileOverview Processes a group access request from a supervisor.
 * - Creates user profiles for new workers in Firebase.
 * - Sends QR code emails to new workers.
 * - Creates the access request document in Firestore.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import * as admin from 'firebase-admin';
import { sendVisitorWelcomeEmail } from './send-visitor-welcome-email-flow';
import { getFirestore } from 'firebase-admin/firestore';
import { User, Certificate } from '@/lib/types';


const certificateSchema = z.object({
    name: z.string(),
    expiryDate: z.string().optional(),
});

const WorkerDataSchema = z.object({
    id: z.string(),
    name: z.string(),
    email: z.string(),
    certificates: z.array(certificateSchema).optional(),
});

const ProcessAccessRequestInputSchema = z.object({
  supervisorId: z.string(),
  supervisorName: z.string(),
  contractorId: z.string(),
  operatorId: z.string(),
  siteId: z.string(),
  contractNumber: z.string(),
  focalPoint: z.string(),
  workerList: z.array(WorkerDataSchema).describe("A list of verified worker objects."),
});
export type ProcessAccessRequestInput = z.infer<typeof ProcessAccessRequestInputSchema>;

const ProcessAccessRequestOutputSchema = z.object({
  success: z.boolean(),
  requestId: z.string().optional(),
  workersProcessed: z.number(),
  error: z.string().optional(),
});
export type ProcessAccessRequestOutput = z.infer<typeof ProcessAccessRequestOutputSchema>;


export async function processAccessRequest(input: ProcessAccessRequestInput): Promise<ProcessAccessRequestOutput> {
  return processAccessRequestFlow(input);
}


const processAccessRequestFlow = ai.defineFlow(
  {
    name: 'processAccessRequestFlow',
    inputSchema: ProcessAccessRequestInputSchema,
    outputSchema: ProcessAccessRequestOutputSchema,
  },
  async (input) => {
    
    if (admin.apps.length === 0) {
      admin.initializeApp();
    }
    const firestore = getFirestore();

    const workers = input.workerList;
    if (workers.length === 0) {
      return { success: false, error: "Worker list is empty.", workersProcessed: 0 };
    }

    const processedUserIds: string[] = [];

    try {
      for (const workerData of workers) {
        // 1. Check if user already exists
        const usersRef = firestore.collection('users');
        const querySnapshot = await usersRef.where('email', '==', workerData.email).limit(1).get();

        let userId: string;

        if (!querySnapshot.empty) {
            // User exists, get their ID
            userId = querySnapshot.docs[0].id;
            console.log(`User with email ${workerData.email} already exists with UID: ${userId}`);
        } else {
            // 2. User does not exist, create them
            console.log(`User with email ${workerData.email} not found. Creating new profile.`);
            
            // Create user in Firebase Auth
            const userRecord = await admin.auth().createUser({
                email: workerData.email,
                displayName: workerData.name,
                emailVerified: true, // Assuming data from 3rd party is verified
            });
            userId = userRecord.uid;
            console.log(`Created new auth user with UID: ${userId}`);

            // Create user profile in Firestore
            const newUserProfile: Partial<User> = {
                name: workerData.name,
                email: workerData.email,
                idNumber: workerData.id, // Save the worker's employee ID
                company: (await firestore.collection('contractors').doc(input.contractorId).get()).data()?.name,
                contractorId: input.contractorId,
                role: 'Worker',
                status: 'Active',
                certificates: workerData.certificates || [],
            };
            await firestore.collection('users').doc(userId).set(newUserProfile);
            console.log(`Created Firestore profile for UID: ${userId}`);

            // 3. Email QR code to the new user
            await sendVisitorWelcomeEmail({
                userId: userId,
                userName: workerData.name,
                userEmail: workerData.email!,
            });
        }
        processedUserIds.push(userId);
      }

      // 4. Create the Access Request document
      const operatorDoc = await firestore.collection('operators').doc(input.operatorId).get();
      const contractorDoc = await firestore.collection('contractors').doc(input.contractorId).get();
      const siteDoc = await firestore.collection('sites').doc(input.siteId).get();

      const accessRequestData = {
        supervisorId: input.supervisorId,
        supervisorName: input.supervisorName,
        operatorId: input.operatorId,
        operatorName: operatorDoc.data()?.name || 'Unknown Operator',
        contractorId: input.contractorId,
        contractorName: contractorDoc.data()?.name || 'Unknown Contractor',
        siteId: input.siteId,
        siteName: siteDoc.data()?.name || 'Unknown Site',
        contractNumber: input.contractNumber,
        focalPoint: input.focalPoint,
        workerIds: processedUserIds,
        status: 'Pending',
        requestedAt: admin.firestore.FieldValue.serverTimestamp(),
      };

      const requestRef = await firestore.collection('accessRequests').add(accessRequestData);
      console.log(`Successfully created access request ${requestRef.id}`);

      return {
        success: true,
        requestId: requestRef.id,
        workersProcessed: processedUserIds.length,
      };

    } catch (error: any) {
      console.error('Error processing access request:', error);
      return { success: false, error: error.message, workersProcessed: 0 };
    }
  }
);
