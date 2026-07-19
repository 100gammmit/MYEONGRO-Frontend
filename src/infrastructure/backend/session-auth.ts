import { toBackendUrl } from "./url";

export interface SpringSessionUser {
  id: string;
  displayName?: string | null;
}

export type SpringSessionState =
  | { status: "authenticated"; user: SpringSessionUser }
  | { status: "unauthenticated"; user: null }
  | { status: "unavailable"; user: null };

interface MeResponse {
  authenticated?: boolean;
  user?: {
    id?: unknown;
    displayName?: unknown;
  };
}

export async function getSpringSessionState(
  cookieHeader?: string | null,
): Promise<SpringSessionState> {
  let response: Response;
  try {
    response = await fetch(toBackendUrl("/api/auth/me"), {
      headers: cookieHeader ? { cookie: cookieHeader } : undefined,
      cache: "no-store",
    });
  } catch {
    return { status: "unavailable", user: null };
  }

  if (response.status === 401) {
    return { status: "unauthenticated", user: null };
  }
  if (!response.ok) {
    return { status: "unavailable", user: null };
  }

  let body: MeResponse;
  try {
    body = await response.json() as MeResponse;
  } catch {
    return { status: "unavailable", user: null };
  }
  if (body.authenticated === false) {
    return { status: "unauthenticated", user: null };
  }
  if (body.authenticated !== true || typeof body.user?.id !== "string") {
    return { status: "unavailable", user: null };
  }

  return {
    status: "authenticated",
    user: {
      id: body.user.id,
      displayName: typeof body.user.displayName === "string"
        ? body.user.displayName
        : null,
    },
  };
}

export async function getSpringSessionUser(
  cookieHeader?: string | null,
): Promise<SpringSessionUser | null> {
  const state = await getSpringSessionState(cookieHeader);
  return state.status === "authenticated" ? state.user : null;
}
