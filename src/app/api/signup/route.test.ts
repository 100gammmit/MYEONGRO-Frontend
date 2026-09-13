import { beforeEach, describe, expect, it, vi } from "vitest";

const { proxyBackendRequest } = vi.hoisted(() => ({
  proxyBackendRequest: vi.fn(),
}));

vi.mock("@/infrastructure/backend/proxy-client", () => ({
  proxyBackendRequest,
}));

import { DELETE, GET, POST } from "./route";

describe("/api/signup route proxy", () => {
  beforeEach(() => {
    proxyBackendRequest.mockReset();
    proxyBackendRequest.mockResolvedValue(Response.json({ pending: true }));
  });

  it.each([
    ["GET", GET, "/api/signup"],
    ["POST", POST, "/api/signup/adult-eligibility"],
    ["DELETE", DELETE, "/api/signup"],
  ] as const)("proxies %s to the signup backend endpoint", async (method, handler, path) => {
    const request = new Request("https://front.test/api/signup", { method });

    await handler(request);

    expect(proxyBackendRequest).toHaveBeenCalledWith({ request, path });
  });
});
