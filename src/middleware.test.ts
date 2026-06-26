// @vitest-environment node

import { NextRequest } from "next/server";
import { beforeEach, vi } from "vitest";

const sessionState = vi.hoisted(() => ({
  user: null as null | { id: string },
  getSpringSessionUser: vi.fn(),
}));

vi.mock("@/infrastructure/backend/session-auth", () => ({
  getSpringSessionUser: sessionState.getSpringSessionUser,
}));

import { config, middleware } from "./middleware";

describe("session middleware", () => {
  beforeEach(() => {
    sessionState.user = null;
    sessionState.getSpringSessionUser.mockReset();
    sessionState.getSpringSessionUser.mockImplementation(async () => sessionState.user);
  });

  it("checks the Spring session with the incoming cookie header", async () => {
    await middleware(
      new NextRequest("https://fortune.test/api/consents", {
        headers: {
          cookie: "JSESSIONID=session; myeongro_guest=signed-token",
        },
      }),
    );

    expect(sessionState.getSpringSessionUser).toHaveBeenCalledWith(
      "JSESSIONID=session; myeongro_guest=signed-token",
    );
  });

  it("redirects a guest from a records descendant and preserves the destination", async () => {
    const response = await middleware(
      new NextRequest("https://fortune.test/records/reading-1?tab=detail"),
    );

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe(
      "https://fortune.test/login?next=%2Frecords%2Freading-1%3Ftab%3Ddetail",
    );
  });

  it("allows an authenticated user through to records", async () => {
    sessionState.user = { id: "user-1" };

    const response = await middleware(
      new NextRequest("https://fortune.test/records/reading-1"),
    );

    expect(response.status).toBe(200);
    expect(response.headers.get("location")).toBeNull();
  });

  it.each([
    "/_next/static/chunk.js",
    "/_next/image",
    "/favicon.ico",
    "/assets/poster.avif",
    "/assets/site.webmanifest",
    "/media/intro.mp4",
    "/media/intro.webm",
    "/media/sound.mp3",
    "/media/sound.ogg",
    "/assets/guide.pdf",
    "/assets/manifest.json",
  ])("excludes static asset path %s", (pathname) => {
    const matcher = new RegExp(`^${config.matcher[0]}$`);
    expect(matcher.test(pathname)).toBe(false);
  });

  it.each([
    "/",
    "/login",
    "/records",
    "/records/reading-1",
    "/records/report.pdf",
    "/poster.avif",
    "/manifest.json",
  ])(
    "matches application path %s",
    (pathname) => {
      const matcher = new RegExp(`^${config.matcher[0]}$`);
      expect(matcher.test(pathname)).toBe(true);
    },
  );
});
