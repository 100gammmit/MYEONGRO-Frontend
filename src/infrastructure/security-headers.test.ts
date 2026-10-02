import { PHASE_DEVELOPMENT_SERVER } from "next/constants";
import { describe, expect, it } from "vitest";

import nextConfig from "../../next.config";
import { SECURITY_HEADERS } from "./security-headers";

describe("security headers", () => {
  it("are applied to every path", async () => {
    const rules = await nextConfig(PHASE_DEVELOPMENT_SERVER).headers?.();

    expect(rules).toEqual([{ source: "/:path*", headers: [...SECURITY_HEADERS] }]);
  });

  it("forbid framing and keep scripts unrestricted for Next.js inline bootstrapping", () => {
    const headers = Object.fromEntries(SECURITY_HEADERS.map(({ key, value }) => [key, value]));

    expect(headers["X-Frame-Options"]).toBe("DENY");
    expect(headers["Content-Security-Policy"]).toContain("frame-ancestors 'none'");
    expect(headers["Content-Security-Policy"]).not.toMatch(/script-src|default-src/);
    expect(headers["Strict-Transport-Security"]).toMatch(/^max-age=31536000/);
    expect(headers["X-Content-Type-Options"]).toBe("nosniff");
  });
});
