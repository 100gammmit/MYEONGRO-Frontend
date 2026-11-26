// @vitest-environment node
import type { ServiceUpdate } from "@/domain/service-updates/model";
import { SERVICE_UPDATES } from "@/domain/service-updates/registry";

import { serviceUpdatesFeed } from "./service-updates-feed";

function update(overrides: Partial<ServiceUpdate> & Pick<ServiceUpdate, "id" | "publishedDate">): ServiceUpdate {
  return {
    category: "release",
    noticeLevel: "routine",
    title: "제목",
    summary: "요약",
    changes: ["변경"],
    effectiveDate: overrides.publishedDate,
    ...overrides,
  };
}

function items(feed: string): string[] {
  return [...feed.matchAll(/<item>[\s\S]*?<\/item>/g)].map(([item]) => item);
}

describe("serviceUpdatesFeed", () => {
  it("links each item to the page its notice introduces, newest first", () => {
    const feed = serviceUpdatesFeed([
      update({ id: "older", publishedDate: "2026-11-18", links: [{ href: "/zodiac", label: "보기" }] }),
      update({ id: "newer", publishedDate: "2026-11-21", links: [{ href: "/manseryeok", label: "보기" }] }),
    ], "2026-11-26");

    const [newer, older] = items(feed);
    expect(newer).toContain("<link>https://www.myeongro.com/manseryeok</link>");
    expect(newer).toContain('<guid isPermaLink="false">newer</guid>');
    expect(newer).toContain("<pubDate>Fri, 20 Nov 2026 15:00:00 GMT</pubDate>");
    expect(older).toContain("<link>https://www.myeongro.com/zodiac</link>");
    expect(feed).toContain("<lastBuildDate>Fri, 20 Nov 2026 15:00:00 GMT</lastBuildDate>");
    expect(feed).toContain('<atom:link href="https://www.myeongro.com/rss.xml" rel="self" type="application/rss+xml"/>');
  });

  it("falls back to the notice anchor when it introduces no page", () => {
    const [item] = items(serviceUpdatesFeed([update({ id: "policy-note", publishedDate: "2026-11-20", category: "policy" })], "2026-11-26"));
    expect(item).toContain("<link>https://www.myeongro.com/updates#policy-note</link>");
  });

  it("leaves out notices whose Korea publication date has not arrived", () => {
    const feed = serviceUpdatesFeed([
      update({ id: "today", publishedDate: "2026-11-26" }),
      update({ id: "tomorrow", publishedDate: "2026-11-27" }),
    ], "2026-11-26");
    expect(items(feed)).toHaveLength(1);
    expect(feed).not.toContain("tomorrow");
  });

  it("escapes markup characters in notice text", () => {
    const feed = serviceUpdatesFeed([update({ id: "escape", publishedDate: "2026-11-20", title: "A & B <C>", summary: `"따옴표" 'x'` })], "2026-11-26");
    expect(feed).toContain("<title>A &amp; B &lt;C&gt;</title>");
    expect(feed).toContain("<description>&quot;따옴표&quot; &apos;x&apos;</description>");
  });

  it("is a well-formed channel with no items before any notice is published", () => {
    const feed = serviceUpdatesFeed([], "2026-11-26");
    expect(items(feed)).toEqual([]);
    expect(feed).not.toContain("lastBuildDate");
    expect(feed).toMatch(/^<\?xml version="1\.0" encoding="UTF-8"\?>\n<rss version="2\.0"/);
    expect(feed).toContain("<link>https://www.myeongro.com/updates</link>");
  });

  it("gives every registered notice a distinct guid", () => {
    const guids = [...serviceUpdatesFeed(SERVICE_UPDATES, "2099-12-31").matchAll(/<guid[^>]*>([^<]+)<\/guid>/g)].map(([, guid]) => guid);
    expect(guids).toHaveLength(SERVICE_UPDATES.length);
    expect(new Set(guids).size).toBe(guids.length);
  });
});
