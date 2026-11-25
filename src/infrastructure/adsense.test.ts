// @vitest-environment node
import routes from "@/infrastructure/site-routes.json";

import { adsTxtLine, adsenseClient, adsenseScriptSrc, isAdRoute } from "./adsense";

describe("AdSense configuration", () => {
  it("stays off unless a well-formed publisher ID is configured", () => {
    expect(adsenseClient(undefined)).toBeNull();
    expect(adsenseClient("")).toBeNull();
    expect(adsenseClient("pub-1234567890123456")).toBeNull();
    expect(adsenseClient("ca-pub-12ab")).toBeNull();
    expect(adsenseClient(" ca-pub-1234567890123456 ")).toBe("ca-pub-1234567890123456");
  });

  it("builds the script URL and the Google ads.txt record from the ID", () => {
    expect(adsenseScriptSrc("ca-pub-1234567890123456"))
      .toBe("https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-1234567890123456");
    expect(adsTxtLine("ca-pub-1234567890123456"))
      .toBe("google.com, pub-1234567890123456, DIRECT, f08c47fec0942fa0");
  });

  it("limits ads to read-only public content pages", () => {
    for (const path of ["/", "/about", "/faq", "/guide/tarot", "/zodiac/rat", "/saju/dictionary/ten-gods/bigyeon", "/updates"]) {
      expect(isAdRoute(path)).toBe(true);
    }
    for (const path of ["/tarot", "/tarot/daily", "/tarot/draw", "/saju", "/saju/results/abc", "/manseryeok", "/terms", "/privacy", "/records", "/account", "/login", "/signup/age", "/faqs", "/zodiacs"]) {
      expect(isAdRoute(path)).toBe(false);
    }
  });

  it("never marks a private route as an ad route and only covers registered public pages", () => {
    for (const prefix of routes.privateRoutePrefixes) {
      expect(isAdRoute(prefix)).toBe(false);
      expect(isAdRoute(`${prefix}/x`)).toBe(false);
    }
    const adPages = routes.publicPages.filter(isAdRoute);
    expect(adPages).toContain("/zodiac/rat");
    expect(adPages).not.toContain("/manseryeok");
  });
});
