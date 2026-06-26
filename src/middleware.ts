import { NextResponse, type NextRequest } from "next/server";
import { getRecordsLoginRedirect } from "@/infrastructure/auth/records-guard";
import { getSpringSessionUser } from "@/infrastructure/backend/session-auth";

export async function middleware(request: NextRequest) {
  const response = NextResponse.next({ request });
  const user = await getSpringSessionUser(request.headers.get("cookie"));

  if (
    request.nextUrl.pathname === "/records" ||
    request.nextUrl.pathname.startsWith("/records/")
  ) {
    const loginUrl = getRecordsLoginRedirect(request.nextUrl, Boolean(user));
    if (loginUrl) {
      return NextResponse.redirect(loginUrl);
    }
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static(?:/|$)|_next/image(?:/|$)|favicon\\.ico$|assets(?:/|$)|images(?:/|$)|fonts(?:/|$)|media(?:/|$)).*)",
  ],
};
