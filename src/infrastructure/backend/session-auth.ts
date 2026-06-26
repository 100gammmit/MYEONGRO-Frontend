import { toBackendUrl } from "./url";

export interface SpringSessionUser {
  id: string;
  displayName?: string | null;
}

interface MeResponse {
  authenticated?: boolean;
  user?: {
    id?: unknown;
    displayName?: unknown;
  };
}

export async function getSpringSessionUser(
  cookieHeader?: string | null,
): Promise<SpringSessionUser | null> {
  const response = await fetch(toBackendUrl("/api/me"), {
    headers: cookieHeader ? { cookie: cookieHeader } : undefined,
    cache: "no-store",
  });

  if (!response.ok) return null;

  const body = await response.json() as MeResponse;
  if (body.authenticated !== true || typeof body.user?.id !== "string") {
    return null;
  }

  return {
    id: body.user.id,
    displayName: typeof body.user.displayName === "string"
      ? body.user.displayName
      : null,
  };
}
