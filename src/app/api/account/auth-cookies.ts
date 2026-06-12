interface AuthCookieStore {
  getAll(): Array<{ name: string; value: string }>;
  set(
    name: string,
    value: string,
    options: { expires: Date; maxAge: number; path: string },
  ): void;
}

function isSupabaseAuthCookie(name: string): boolean {
  return name.startsWith("sb-") || name.startsWith("supabase-auth-token");
}

export function clearSupabaseAuthCookies(cookieStore: AuthCookieStore): void {
  cookieStore
    .getAll()
    .filter(({ name }) => isSupabaseAuthCookie(name))
    .forEach(({ name }) => {
      cookieStore.set(name, "", {
        expires: new Date(0),
        maxAge: 0,
        path: "/",
      });
    });
}
