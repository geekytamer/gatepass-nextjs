"use server";

import { createUser } from "@/ai/flows/create-user-flow";
import { updateUser } from "@/ai/flows/update-user-flow";
import { deleteUser } from "@/ai/flows/delete-user-flow";

export async function serverCreateUser(
  input: Parameters<typeof createUser>[0]
) {
  return createUser(input);
}

export async function serverUpdateUser(
  input: Parameters<typeof updateUser>[0]
) {
  return updateUser(input);
}

export async function serverDeleteUser(
  input: Parameters<typeof deleteUser>[0]
) {
  return deleteUser(input);
}
