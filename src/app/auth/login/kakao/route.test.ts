import { beforeEach, describe, expect, it, vi } from "vitest";

import { GET } from "./route";

describe("GET /auth/login/kakao", () => {
  beforeEach(() => {
    vi.stubEnv("BACKEND_API_URL", "https://spring.test/");
  });

  it("redirects to Spring Kakao OAuth with a normalized next path", () => {
    const response = GET(
      new Request("https://front.test/auth/login/kakao?next=%2Frecords%2Freading-1%3Ftab%3Ddetail"),
    );

    expect(response.status).toBe(302);
    expect(response.headers.get("location")).toBe(
      "https://spring.test/oauth2/authorization/kakao?next=%2Frecords%2Freading-1%3Ftab%3Ddetail",
    );
  });

  it("falls back to the records page for unsafe next values", () => {
    const response = GET(
      new Request("https://front.test/auth/login/kakao?next=https%3A%2F%2Fevil.test"),
    );

    expect(response.headers.get("location")).toBe(
      "https://spring.test/oauth2/authorization/kakao?next=%2Frecords",
    );
  });
});
