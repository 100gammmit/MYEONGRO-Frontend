import { createServerSupabaseClient } from "./server-client";

export async function getAuthenticatedUserId(): Promise<string | null> {
  const client = await createServerSupabaseClient();
  const { data, error } = await client.auth.getUser();
  if (error) return null;
  return data.user?.id ?? null;
}
