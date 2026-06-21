import { createServerSupabaseClient } from "./server-client";

export async function getAuthenticatedUserId(): Promise<string | null> {
  const client = await createServerSupabaseClient();
  const { data, error } = await client.auth.getUser();
  if (error) return null;
  return data.user?.id ?? null;
}

export async function getAuthenticatedAccessToken(): Promise<string | null> {
  const client = await createServerSupabaseClient();
  const { data, error } = await client.auth.getSession();
  if (error) return null;
  return data.session?.access_token ?? null;
}
