// @vitest-environment node

import { NextRequest } from "next/server";
import { beforeEach, vi } from "vitest";

const supabaseState = vi.hoisted(() => ({
  authenticated: false,
  refreshCookies: [] as Array<{
    name: string;
    value: string;
    options?: { httpOnly?: boolean; path?: string };
  }>,
}));

vi.mock("@supabase/ssr", () => ({
  createServerClient: (
    _url: string,
    _anonKey: string,
    options: {
      cookies: {
        setAll(
          cookies: Array<{
            name: string;
            value: string;
            options?: { httpOnly?: boolean; path?: string };
          }>,
        ): void;
      };
    },
  ) => ({
    auth: {
      getUser: async () => {
        if (supabaseState.refreshCookies.length) {
          options.cookies.setAll(supabaseState.refreshCookies);
        }
        return {
          data: {
            user: supabaseState.authenticated ? { id: "user-1" } : null,
          },
        };
      },
    },
  }),
}));

vi.mock("@/infrastructure/supabase/env", () => ({
  getPublicSupabaseEnvironment: () => ({
    url: "https://project.supabase.co",
    anonKey: "anon-key",
  }),
}));

import { config, middleware } from "./middleware";

describe("session middleware", () => {
  beforeEach(() => {
    supabaseState.authenticated = false;
    supabaseState.refreshCookies = [];
  });

  it("propagates refreshed Supabase cookies to the response", async () => {
    supabaseState.authenticated = true;
    supabaseState.refreshCookies = [
      {
        name: "sb-session",
        value: "refreshed",
        options: { httpOnly: true, path: "/" },
      },
    ];

    const response = await middleware(
      new NextRequest("https://fortune.test/records"),
    );

    expect(response.cookies.get("sb-session")?.value).toBe("refreshed");
  });

  it("preserves non-Supabase cookies for downstream route handlers", async () => {
    supabaseState.refreshCookies = [
      {
        name: "sb-session",
        value: "refreshed",
        options: { httpOnly: true, path: "/" },
      },
    ];

    const response = await middleware(
      new NextRequest("https://fortune.test/api/consents", {
        headers: {
          cookie: "myeongro_guest=signed-token",
        },
      }),
    );

    expect(response.headers.get("x-middleware-request-cookie")).toContain(
      "myeongro_guest=signed-token",
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
    supabaseState.authenticated = true;

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
