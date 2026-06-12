import { createBrowserClient } from "@supabase/ssr";

import { getPublicSupabaseEnvironment } from "./env";

export function createBrowserSupabaseClient() {
  const { url, anonKey } = getPublicSupabaseEnvironment();
  return createBrowserClient(url, anonKey);
}
