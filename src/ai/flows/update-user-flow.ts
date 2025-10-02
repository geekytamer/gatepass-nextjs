'use server';
/**
 * @fileOverview A Genkit flow for updating a Firebase user.
 * This flow uses the Firebase Admin SDK to update user details in Firebase Authentication.
 *
 * - updateUser - A function that updates a user.
 * - UpdateUserInput - The input type for the updateUser function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import * as admin from 'firebase-admin';
import { initializeApp } from 'firebase-admin/app';

const UpdateUserInputSchema = z.object({
  uid: z.string().describe('The UID of the user to update.'),
  email: z.string().email().optional().describe("The user's new email address."),
  displayName: z.string().min(2).optional().describe("The user's new full name."),
});

export type UpdateUserInput = z.infer<typeof UpdateUserInputSchema>;

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

export async function updateUser(input: UpdateUserInput): Promise<{ success: boolean; error?: string }> {
  return updateUserFlow(input);
}

const updateUserFlow = ai.defineFlow(
  {
    name: 'updateUserFlow',
    inputSchema: UpdateUserInputSchema,
    outputSchema: z.object({
      success: z.boolean(),
      error: z.string().optional(),
    }),
  },
  async (input) => {
    initializeFirebaseAdmin();
    
    const { uid, ...updateData } = input;

    if (Object.keys(updateData).length === 0) {
      return { success: true }; // Nothing to update in Auth
    }

    try {
      await admin.auth().updateUser(uid, updateData);
      console.log(`Successfully updated user with UID: ${uid} in Firebase Auth.`);
      return { success: true };
    } catch (error: any) {
      console.error(`Error updating user ${uid}:`, error);
      
      let errorMessage = `An unknown error occurred while updating user ${uid}.`;
      if (error.code === 'auth/email-already-exists') {
        errorMessage = 'This email address is already in use by another account.';
      } else if (error.code === 'auth/user-not-found') {
        errorMessage = `User with UID ${uid} not found.`;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      return { success: false, error: errorMessage };
    }
  }
);
