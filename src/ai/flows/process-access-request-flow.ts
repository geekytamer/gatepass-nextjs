
'use server';
/**
 * @fileOverview Processes a group access request from a supervisor.
 * - Fetches worker details from a (mocked) third-party service.
 * - Creates user profiles for new workers in Firebase.
 * - Sends QR code emails to new workers.
 * - Creates the access request document in Firestore.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import * as admin from 'firebase-admin';
import { sendVisitorWelcomeEmail } from './send-visitor-welcome-email-flow';
import { getFirestore } from 'firebase-admin/firestore';
import { User } from '@/lib/types';


// Mock third-party service call
async function fetchWorkerDataFromThirdParty(workerId: string): Promise<Omit<User, 'id' | 'role' | 'status' | 'avatarUrl'>> {
    console.log(`Fetching data for worker ID: ${workerId}`);
    // In a real scenario, this would be an API call to an HR system.
    // We'll return mock data for demonstration.
    await new Promise(resolve => setTimeout(resolve, 50)); // Simulate network delay
    return {
        name: `Worker ${workerId}`,
        email: `worker.${workerId}@contractor.com`,
        company: 'Default Contractor Inc.',
        // Add other relevant fields that your third-party service provides
    };
}


const ProcessAccessRequestInputSchema = z.object({
  supervisorId: z.string(),
  supervisorName: z.string(),
  contractorId: z.string(),
  operatorId: z.string(),
  siteId: z.string(),
  contractNumber: z.string(),
  focalPoint: z.string(),
  workerIdList: z.string().describe("A comma-separated string of worker IDs"),
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

    const workerIds = input.workerIdList.split(',').map(id => id.trim()).filter(id => id);
    if (workerIds.length === 0) {
      return { success: false, error: "Worker ID list is empty.", workersProcessed: 0 };
    }

    const processedUserIds: string[] = [];

    try {
      for (const workerId of workerIds) {
        // 1. Check if user already exists
        const usersRef = firestore.collection('users');
        const querySnapshot = await usersRef.where('email', '==', `worker.${workerId}@contractor.com`).limit(1).get();

        let userId: string;

        if (!querySnapshot.empty) {
            // User exists, get their ID
            userId = querySnapshot.docs[0].id;
            console.log(`User ${workerId} already exists with UID: ${userId}`);
        } else {
            // 2. User does not exist, fetch data and create them
            console.log(`User ${workerId} not found. Creating new profile.`);
            const workerData = await fetchWorkerDataFromThirdParty(workerId);

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
                company: workerData.company,
                contractorId: input.contractorId,
                role: 'Worker',
                status: 'Active',
                avatarUrl: `https://picsum.photos/seed/${userId}/200/200`,
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
