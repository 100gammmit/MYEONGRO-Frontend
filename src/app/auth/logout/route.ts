import { toBackendUrl } from "@/infrastructure/backend/url";
import { createLogoutHandler } from "./handler";

export async function POST(request: Request) {
  return createLogoutHandler({
    logout: async (logoutRequest) => {
      const cookie = logoutRequest.headers.get("cookie");
      return fetch(toBackendUrl("/api/auth/logout"), {
        method: "POST",
        headers: cookie ? { cookie } : undefined,
        cache: "no-store",
      });
    },
  })(request);
}
