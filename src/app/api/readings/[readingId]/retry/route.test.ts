import { beforeEach, describe, expect, it, vi } from "vitest";

const proxyBackendRequest = vi.fn();

vi.mock("@/infrastructure/backend/proxy-client", () => ({
  proxyBackendRequest,
}));

describe("/api/readings/[readingId]/retry route", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
  });

  it("preserves the failed reading retry contract", async () => {
    proxyBackendRequest.mockResolvedValue(Response.json({
      reading: { id: "failed-reading-1", status: "completed" },
    }));
    const request = new Request(
      "https://front.test/api/readings/failed-reading-1/retry",
      { method: "POST" },
    );
    const { POST } = await import("./route");

    const response = await POST(request, {
      params: Promise.resolve({ readingId: "failed-reading-1" }),
    });

    expect(proxyBackendRequest).toHaveBeenCalledWith({
      request,
      path: "/api/readings/failed-reading-1/retry",
    });
    expect(response.status).toBe(200);
  });
});
