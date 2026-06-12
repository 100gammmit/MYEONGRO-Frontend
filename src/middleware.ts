import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { getRecordsLoginRedirect } from "@/infrastructure/auth/records-guard";
import { getPublicSupabaseEnvironment } from "@/infrastructure/supabase/env";

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request });
  const { url, anonKey } = getPublicSupabaseEnvironment();
  const supabase = createServerClient(url, anonKey, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: (cookiesToSet) => {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => {
          response.cookies.set(name, value, options);
        });
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (
    request.nextUrl.pathname === "/records" ||
    request.nextUrl.pathname.startsWith("/records/")
  ) {
    const loginUrl = getRecordsLoginRedirect(request.nextUrl, Boolean(user));
    if (loginUrl) {
      const redirectResponse = NextResponse.redirect(loginUrl);
      response.cookies.getAll().forEach((cookie) => {
        redirectResponse.cookies.set(cookie);
      });
      return redirectResponse;
    }
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static(?:/|$)|_next/image(?:/|$)|favicon\\.ico$|assets(?:/|$)|images(?:/|$)|fonts(?:/|$)|media(?:/|$)).*)",
  ],
};
