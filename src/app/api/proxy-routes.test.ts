import { beforeEach, describe, expect, it, vi } from "vitest";

const { proxyBackendRequest } = vi.hoisted(() => ({
  proxyBackendRequest: vi.fn(),
}));

vi.mock("@/infrastructure/backend/proxy-client", () => ({
  proxyBackendRequest,
}));

import * as me from "./me/route";
import * as readingCredits from "./reading-credits/route";
import * as readingCreditPricing from "./reading-credits/pricing/route";
import * as readings from "./readings/route";
import * as sajuReadings from "./saju/readings/route";
import * as signup from "./signup/route";
import * as dailyCardSelections from "./tarot/daily-card-selections/route";
import * as tarotReadings from "./tarot/readings/route";

type Handler = (request: Request) => Promise<Response>;

// These routes forward the request as-is; cookie filtering lives in proxyBackendRequest.
describe("pass-through API routes", () => {
  beforeEach(() => {
    proxyBackendRequest.mockReset();
  });

  it.each([
    ["GET", "/api/me", me.GET, "/api/auth/me"],
    ["GET", "/api/reading-credits", readingCredits.GET, "/api/reading-credits"],
    ["GET", "/api/reading-credits/pricing", readingCreditPricing.GET, "/api/reading-credits/pricing"],
    ["GET", "/api/readings", readings.GET, "/api/readings"],
    ["POST", "/api/saju/readings", sajuReadings.POST, "/api/saju/readings"],
    ["GET", "/api/signup", signup.GET, "/api/signup"],
    ["POST", "/api/signup", signup.POST, "/api/signup"],
    ["DELETE", "/api/signup", signup.DELETE, "/api/signup"],
    ["POST", "/api/tarot/daily-card-selections", dailyCardSelections.POST, "/api/tarot/daily-card-selections"],
    ["POST", "/api/tarot/readings", tarotReadings.POST, "/api/tarot/readings"],
  ] as const)("proxies %s %s to the Spring endpoint", async (method, route, handler, path) => {
    const backendResponse = Response.json({ ok: true }, { status: 201 });
    proxyBackendRequest.mockResolvedValue(backendResponse);
    const request = new Request(`https://front.test${route}`, { method });

    const response = await (handler as Handler)(request);

    expect(proxyBackendRequest).toHaveBeenCalledWith({ request, path });
    expect(response).toBe(backendResponse);
  });
});
