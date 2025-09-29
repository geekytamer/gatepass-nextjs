
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

const DeleteUserInputSchema = z.object({
  uid: z.string().describe('The UID of the user to delete.'),
});

export type DeleteUserInput = z.infer<typeof DeleteUserInputSchema>;

// Initialize Firebase Admin SDK if not already initialized
if (!admin.apps.length) {
    // When running in a Google Cloud environment, the SDK will automatically
    // use the project's service account credentials.
    admin.initializeApp();
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
