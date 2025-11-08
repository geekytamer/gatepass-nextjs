
'use server';
/**
 * @fileOverview A flow to generate and send a QR code welcome email to visitors/workers.
 * This flow orchestrates two other flows:
 * 1. `generateQrCodeFlow` to create the QR code image.
 * 2. `sendEmailFlow` to dispatch the email.
 *
 * - sendVisitorWelcomeEmail - The main function to trigger the email sending process.
 * - SendVisitorWelcomeEmailInput - The input type for the function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { sendEmail } from './send-email-flow';
import { generateQrCode } from './generate-qr-code-flow';

const SendVisitorWelcomeEmailInputSchema = z.object({
  userId: z.string().describe('The unique ID of the user to generate the QR code for.'),
  userName: z.string().describe('The name of the user.'),
  userEmail: z.string().email().describe('The email address to send the QR code to.'),
});

export type SendVisitorWelcomeEmailInput = z.infer<typeof SendVisitorWelcomeEmailInputSchema>;

export async function sendVisitorWelcomeEmail(input: SendVisitorWelcomeEmailInput) {
  return sendVisitorWelcomeEmailFlow(input);
}

const sendVisitorWelcomeEmailFlow = ai.defineFlow(
  {
    name: 'sendVisitorWelcomeEmailFlow',
    inputSchema: SendVisitorWelcomeEmailInputSchema,
    outputSchema: z.object({
      success: z.boolean(),
      error: z.string().optional(),
    }),
  },
  async ({ userId, userName, userEmail }) => {
    try {
      // 1. Generate the QR code as a data URI
      const qrCodeResult = await generateQrCode({ text: userId });
      if (!qrCodeResult.qrCodeDataUri) {
        throw new Error(qrCodeResult.error || 'Failed to generate QR code.');
      }

      // 2. Construct the email body with the embedded QR code
      const emailBody = `
        <div style="font-family: sans-serif; padding: 20px; color: #333;">
          <h1 style="color: #0D1A2E;">Welcome to GatePass, ${userName}!</h1>
          <p>Your personal QR code for site access is ready. Please present this code at the gate for scanning.</p>
          <p>This code is unique to you and should not be shared.</p>
          <div style="padding: 20px; background-color: #f0f4f8; border-radius: 8px; text-align: center;">
            <img src="${qrCodeResult.qrCodeDataUri}" alt="Your Personal QR Code" style="width: 200px; height: 200px; image-rendering: pixelated;"/>
          </div>
          <p style="margin-top: 20px; font-size: 12px; color: #777;">
            This is an automated message. Please do not reply.
          </p>
        </div>
      `;

      // 3. Send the email
      const emailResult = await sendEmail({
        to: userEmail,
        subject: 'Your GatePass Access QR Code',
        body: emailBody,
      });

      if (!emailResult.success) {
        throw new Error(emailResult.error || 'Failed to send the email.');
      }

      console.log(`Successfully sent QR code email to ${userEmail}`);
      return { success: true };
    } catch (error: any) {
      console.error('Error in sendVisitorWelcomeEmailFlow:', error);
      return { success: false, error: error.message };
    }
  }
);
