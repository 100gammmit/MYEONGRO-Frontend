import { beforeEach, describe, expect, it, vi } from "vitest";

import { GET } from "./route";

describe("GET /auth/login/[provider]", () => {
  beforeEach(() => {
    vi.stubEnv("BACKEND_API_URL", "https://api.example.com/");
  });

  it("redirects from the frontend host to the sibling Spring OAuth host", async () => {
    const response = await GET(
      new Request("https://www.example.com/auth/login/kakao?next=%2Frecords%2Freading-1%3Ftab%3Ddetail"),
      { params: Promise.resolve({ provider: "kakao" }) },
    );

    expect(response.status).toBe(302);
    expect(response.headers.get("location")).toBe(
      "https://api.example.com/oauth2/authorization/kakao?next=%2Frecords%2Freading-1%3Ftab%3Ddetail",
    );
  });

  it("redirects to Spring Google OAuth with a normalized next path", async () => {
    const response = await GET(
      new Request("https://front.test/auth/login/google?next=%2Faccount"),
      { params: Promise.resolve({ provider: "google" }) },
    );

    expect(response.status).toBe(302);
    expect(response.headers.get("location")).toBe(
      "https://api.example.com/oauth2/authorization/google?next=%2Faccount",
    );
  });

  it("falls back to the records page for unsafe next values", async () => {
    const response = await GET(
      new Request("https://front.test/auth/login/kakao?next=https%3A%2F%2Fevil.test"),
      { params: Promise.resolve({ provider: "kakao" }) },
    );

    expect(response.headers.get("location")).toBe(
      "https://api.example.com/oauth2/authorization/kakao?next=%2Frecords",
    );
  });

  it("rejects unsupported providers", async () => {
    const response = await GET(
      new Request("https://front.test/auth/login/unknown"),
      { params: Promise.resolve({ provider: "unknown" }) },
    );

    expect(response.status).toBe(404);
    expect(await response.json()).toEqual({ code: "UNSUPPORTED_OAUTH_PROVIDER" });
  });
});
