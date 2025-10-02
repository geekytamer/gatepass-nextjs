
'use server';
/**
 * @fileOverview A Genkit flow for creating a new Firebase user.
 * This flow uses the Firebase Admin SDK to create a user in Firebase Authentication
 * and is intended to be called from a secure, server-side context (like an admin panel).
 *
 * - createUser - A function that creates a new user.
 * - CreateUserInput - The input type for the createUser function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import * as admin from 'firebase-admin';
import { initializeApp } from 'firebase-admin/app';

// Defines the expected input for creating a user
const CreateUserInputSchema = z.object({
  email: z.string().email().describe('The email address for the new user.'),
  password: z.string().min(6).describe('The temporary password for the new user.'),
  displayName: z.string().min(2).describe('The full name of the new user.'),
});

export type CreateUserInput = z.infer<typeof CreateUserInputSchema>;

// Initializes Firebase Admin SDK if not already done.
// This function is idempotent.
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

/**
 * Exported function to be called from the application server-side code.
 * It wraps the Genkit flow.
 */
export async function createUser(input: CreateUserInput): Promise<{ uid?: string; success: boolean; error?: string }> {
  return createUserFlow(input);
}

/**
 * The main Genkit flow for creating a user.
 */
const createUserFlow = ai.defineFlow(
  {
    name: 'createUserFlow',
    inputSchema: CreateUserInputSchema,
    outputSchema: z.object({
      uid: z.string().optional(),
      success: z.boolean(),
      error: z.string().optional(),
    }),
  },
  async ({ email, password, displayName }) => {
    initializeFirebaseAdmin();
    
    try {
      const userRecord = await admin.auth().createUser({
        email,
        password,
        displayName,
        emailVerified: false, // User will verify by changing password
      });
      
      console.log(`Successfully created new user with UID: ${userRecord.uid}`);
      return { uid: userRecord.uid, success: true };

    } catch (error: any) {
      console.error(`Error creating user:`, error);
      
      let errorMessage = 'An unknown error occurred while creating the user.';
      if (error.code === 'auth/email-already-exists') {
          errorMessage = 'This email address is already in use by another account.';
      } else if (error.message) {
          errorMessage = error.message;
      }
      
      return { success: false, error: errorMessage };
    }
  }
);
