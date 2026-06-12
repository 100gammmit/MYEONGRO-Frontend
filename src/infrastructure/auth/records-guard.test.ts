import { getRecordsLoginRedirect } from "./records-guard";

describe("getRecordsLoginRedirect", () => {
  it("preserves the requested records destination for a guest", () => {
    expect(
      getRecordsLoginRedirect(
        new URL("https://fortune.test/records/reading-1?tab=detail"),
        false,
      )?.toString(),
    ).toBe(
      "https://fortune.test/login?next=%2Frecords%2Freading-1%3Ftab%3Ddetail",
    );
  });

  it("allows authenticated users to reach records", () => {
    expect(
      getRecordsLoginRedirect(new URL("https://fortune.test/records"), true),
    ).toBeNull();
  });
});
