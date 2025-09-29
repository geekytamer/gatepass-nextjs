
import { genkit } from 'genkit';
import { googleAI } from '@genkit-ai/googleai';

// Note: Before running this, you must configure your GOOGLE_API_KEY.
// For more information, see https://genkit.dev/docs/plugins/googleai

export const ai = genkit({
  plugins: [
    googleAI({
      // In a production app, you should not hardcode the API key.
      // You can use a secret manager to store the API key.
      // You can also use `process.env.GOOGLE_API_KEY` to read from
      // an environment variable.
    }),
  ],
  // Log developer-friendly errors to the console
  logLevel: 'debug',
  // Perform all AI processing in the US.
  flowStateStore: {
    name: 'firebase',
    options: {
      collection: 'genkit-flow-state',
      // By default, this uses the Firestore instance that is configured
      // in your environment.
    },
  },
  traceStore: {
    name: 'firebase',
    options: {
      collection: 'genkit-traces',
    },
  },
});
