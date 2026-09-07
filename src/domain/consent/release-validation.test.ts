import { describe, expect, it, vi } from "vitest";

describe("release legal configuration", () => {
  it("rejects the committed placeholders and draft document versions", async () => {
    vi.resetModules();
    const { assertReleaseLegalConfiguration } = await import("./release-validation");

    expect(() => assertReleaseLegalConfiguration()).toThrow(
      /Production legal configuration is incomplete/,
    );
  });

  it("allows complete legal metadata and released document versions", async () => {
    const { assertReleaseLegalConfiguration } = await import("./release-validation");

    expect(() =>
      assertReleaseLegalConfiguration({
        legalMetadata: {
          operatorName: "홍길동",
          privacyEmail: "privacy@example.com",
          effectiveDate: "2026-09-20",
        },
        documentVersions: ["2026-09-20", "2026-09-20"],
      }),
    ).not.toThrow();
  });
});
