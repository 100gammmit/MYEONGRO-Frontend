import { normalizeNextPath } from "./next-path";

describe("normalizeNextPath", () => {
  it.each([
    ["/records", "/records"],
    ["/records/reading-1?tab=detail#result", "/records/reading-1?tab=detail#result"],
    ["/records/../login?next=%2Frecords#continue", "/login?next=%2Frecords#continue"],
  ])("accepts a local absolute path: %s", (input, expected) => {
    expect(normalizeNextPath(input)).toBe(expected);
  });

  it.each([
    null,
    "",
    "records",
    "%2Frecords%2Freading-1",
    "//evil.example/path",
    "/\\evil.example",
    "\\evil.example",
    "https://evil.example/records",
    "javascript:alert(1)",
    "/%5Cevil.example",
    "/%252F%252Fevil.example",
    "/%255Cevil.example",
    "/https%253A%252F%252Fevil.example",
    "/%2500records",
    "/%09//evil.example",
    "/%0A//evil.example",
    "/%0D//evil.example",
    "/%2509//evil.example",
    "/%250A//evil.example",
    "/%250D//evil.example",
    "/%7Frecords",
    "/%252525252F%252525252Fevil.example",
    "%E0%A4%A",
    "%252Frecords",
  ])("rejects unsafe or malformed destinations: %s", (input) => {
    expect(normalizeNextPath(input)).toBe("/records");
  });
});
