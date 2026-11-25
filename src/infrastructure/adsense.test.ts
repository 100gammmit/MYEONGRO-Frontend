// @vitest-environment node
import { adsTxtLine, adsenseClient } from "./adsense";

describe("AdSense site verification", () => {
  it("accepts only a publisher ID with the ca-pub prefix and 16 digits", () => {
    expect(adsenseClient("")).toBeNull();
    expect(adsenseClient("pub-1234567890123456")).toBeNull();
    expect(adsenseClient("ca-pub-123456789012345")).toBeNull();
    expect(adsenseClient("ca-pub-12345678901234567")).toBeNull();
    expect(adsenseClient("ca-pub-12ab")).toBeNull();
    expect(adsenseClient(" ca-pub-1234567890123456 ")).toBe("ca-pub-1234567890123456");
  });

  it("builds the Google ads.txt record from the publisher ID", () => {
    expect(adsTxtLine("ca-pub-1234567890123456"))
      .toBe("google.com, pub-1234567890123456, DIRECT, f08c47fec0942fa0");
  });
});
