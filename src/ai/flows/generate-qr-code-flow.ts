
'use server';
/**
 * @fileOverview A flow for generating a QR code from a text string.
 * It uses the 'qrcode' library to create a Base64 data URI for the image.
 *
 * - generateQrCode - The main function to trigger the QR code generation.
 * - GenerateQrCodeInput - The input type for the function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import QRCode from 'qrcode';

const GenerateQrCodeInputSchema = z.object({
  text: z.string().describe('The text to encode in the QR code.'),
});

export type GenerateQrCodeInput = z.infer<typeof GenerateQrCodeInputSchema>;

export async function generateQrCode(input: GenerateQrCodeInput): Promise<{ qrCodeDataUri?: string; error?: string }> {
  return generateQrCodeFlow(input);
}

const generateQrCodeFlow = ai.defineFlow(
  {
    name: 'generateQrCodeFlow',
    inputSchema: GenerateQrCodeInputSchema,
    outputSchema: z.object({
      qrCodeDataUri: z.string().optional(),
      error: z.string().optional(),
    }),
  },
  async ({ text }) => {
    try {
      const qrCodeDataUri = await QRCode.toDataURL(text, {
        errorCorrectionLevel: 'H',
        width: 256,
        margin: 2,
        color: {
            dark: '#0D1A2E',
            light: '#FFFFFF'
        }
      });
      return { qrCodeDataUri };
    } catch (error: any) {
      console.error('Failed to generate QR code:', error);
      return { error: 'Could not generate QR code.' };
    }
  }
);
