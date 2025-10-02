
'use server';
/**
 * @fileOverview A Genkit flow for deleting a Firebase user.
 * This flow uses the Firebase Admin SDK to delete a user from Firebase Authentication.
 * It must be called from a secure, server-side context.
 *
 * - deleteUser - A function that deletes a user.
 * - DeleteUserInput - The input type for the deleteUser function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import * as admin from 'firebase-admin';
import { initializeApp } from 'firebase-admin/app';

const DeleteUserInputSchema = z.object({
  uid: z.string().describe('The UID of the user to delete.'),
});

export type DeleteUserInput = z.infer<typeof DeleteUserInputSchema>;

function initializeFirebaseAdmin() {
  if (admin.apps.length === 0) {
      if (process.env.FIREBASE_SERVICE_ACCOUNT) {
        // Option 1: JSON string env
        const serviceAccount = JSON.parse(
          process.env.FIREBASE_SERVICE_ACCOUNT as string
        );
        initializeApp({
          credential: admin.credential.cert(serviceAccount),
        });
      } else if (
        process.env.FIREBASE_PROJECT_ID &&
        process.env.FIREBASE_CLIENT_EMAIL &&
        process.env.FIREBASE_PRIVATE_KEY
      ) {
        if (
          !process.env.FIREBASE_PROJECT_ID ||
          !process.env.FIREBASE_CLIENT_EMAIL ||
          !process.env.FIREBASE_PRIVATE_KEY
        ) {
          throw new Error("Missing Firebase Admin env vars");
        }
  
        if (!process.env.FIREBASE_PRIVATE_KEY.includes("BEGIN PRIVATE KEY")) {
          throw new Error(
            "FIREBASE_PRIVATE_KEY is present but formatted incorrectly (missing BEGIN PRIVATE KEY)"
          );
        }
  
        // Option 2: Split env vars
        initializeApp({
          credential: admin.credential.cert({
            projectId: process.env.FIREBASE_PROJECT_ID,
            clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
            privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n"),
          }),
        });
      } else {
        // Option 3: Google Cloud environment
        initializeApp();
      }
    }
}

export async function deleteUser(input: DeleteUserInput): Promise<{ success: boolean; error?: string }> {
  return deleteUserFlow(input);
}

const deleteUserFlow = ai.defineFlow(
  {
    name: 'deleteUserFlow',
    inputSchema: DeleteUserInputSchema,
    outputSchema: z.object({ success: z.boolean(), error: z.string().optional() }),
  },
  async ({ uid }) => {
    initializeFirebaseAdmin();
    
    try {
      await admin.auth().deleteUser(uid);
      console.log(`Successfully deleted user with UID: ${uid} from Firebase Auth.`);
      return { success: true };
    } catch (error: any) {
      console.error(`Error deleting user with UID: ${uid}`, error);
      
      let errorMessage = `An unknown error occurred while deleting user ${uid}.`;
      if (error.code === 'auth/user-not-found') {
          errorMessage = `User with UID ${uid} not found in Firebase Authentication. They may have already been deleted.`;
          // If user doesn't exist in Auth, we can consider it a "success" for our purposes
          // as the end state (user is gone from Auth) is achieved.
          return { success: true };
      } else if (error.message) {
          errorMessage = error.message;
      }
      
      return { success: false, error: errorMessage };
    }
  }
);
