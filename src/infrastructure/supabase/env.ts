function requireEnvironmentVariable(
  name: string,
  rawValue: string | undefined,
): string {
  const value = rawValue?.trim();
  if (!value) {
    throw new Error(
      `Missing required environment variable ${name}. Configure Supabase before creating a client.`,
    );
  }
  return value;
}

export function getPublicSupabaseEnvironment() {
  return {
    url: requireEnvironmentVariable(
      "NEXT_PUBLIC_SUPABASE_URL",
      process.env.NEXT_PUBLIC_SUPABASE_URL,
    ),
    anonKey: requireEnvironmentVariable(
      "NEXT_PUBLIC_SUPABASE_ANON_KEY",
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    ),
  };
}

export function getServerSupabaseEnvironment() {
  return {
    ...getPublicSupabaseEnvironment(),
    serviceRoleKey: requireEnvironmentVariable(
      "SUPABASE_SERVICE_ROLE_KEY",
      process.env.SUPABASE_SERVICE_ROLE_KEY,
    ),
  };
}
