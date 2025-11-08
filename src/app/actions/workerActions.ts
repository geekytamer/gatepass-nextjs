"use server";

import { fetchWorkerData } from "@/ai/flows/fetch-worker-data-flow";

export async function serverFetchWorkerData(
  input: Parameters<typeof fetchWorkerData>[0]
) {
  return fetchWorkerData(input);
}
