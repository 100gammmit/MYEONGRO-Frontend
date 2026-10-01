import { describe, expect, it } from "vitest";

describe("release legal configuration", () => {
  it("allows complete legal metadata and released document versions", async () => {
    const { assertReleaseLegalConfiguration } = await import("./release-validation");

    expect(() =>
      assertReleaseLegalConfiguration({
        legalMetadata: {
          operatorName: "홍길동",
          privacyEmail: "privacy@example.com",
          effectiveDate: "2026-09-20",
        },
        documentVersions: ["2026-08-28", "2026-09-20", "2026-09-20"],
      }),
    ).not.toThrow();
  });

  it("rejects a draft terms version", async () => {
    const { assertReleaseLegalConfiguration } = await import("./release-validation");

    expect(() =>
      assertReleaseLegalConfiguration({
        legalMetadata: {
          operatorName: "홍길동",
          privacyEmail: "privacy@example.com",
          effectiveDate: "2026-09-20",
        },
        documentVersions: ["draft-terms", "2026-09-20", "2026-09-20"],
      }),
    ).toThrow(/Production legal configuration is incomplete/);
  });

    it("rejects placeholder legal metadata", async () => {
        const { assertReleaseLegalConfiguration } = await import("./release-validation");

        expect(() =>
            assertReleaseLegalConfiguration({
                legalMetadata: {
                    operatorName: "[운영자명]",
                    privacyEmail: "privacy@example.com",
                    effectiveDate: "2026-10-01",
                },
                documentVersions: ["2026-09-27", "2026-09-25", "2026-09-25"],
            }),
        ).toThrow(/Production legal configuration is incomplete/);
    });
});
