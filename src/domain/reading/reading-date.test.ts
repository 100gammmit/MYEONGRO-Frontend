import { formatReadingDate } from "./reading-date";

describe("formatReadingDate", () => {
  it("shows the Korean date for an early-morning reading stored on the previous UTC day", () => {
    // 20:00 UTC on the 15th is 05:00 KST on the 16th.
    expect(formatReadingDate("2026-09-15T20:00:00Z")).toBe("2026. 9. 16.");
  });

  it("changes the date exactly at Korean midnight", () => {
    expect(formatReadingDate("2026-09-15T14:59:59Z")).toBe("2026. 9. 15.");
    expect(formatReadingDate("2026-09-15T15:00:00Z")).toBe("2026. 9. 16.");
  });
});
