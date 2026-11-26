import { getPublishedServiceUpdates, koreaDateFromInstant, type ServiceUpdate } from "@/domain/service-updates/model";
import { SERVICE_UPDATES_FEED_PATH, SITE_ORIGIN } from "@/infrastructure/site-metadata";

const XML_ESCAPES: Readonly<Record<string, string>> = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&apos;" };

// C0 control characters other than tab and newlines are illegal in XML 1.0 and would void the whole feed.
const XML_ILLEGAL = /[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g;

function escapeXml(value: string): string {
  return value.replace(XML_ILLEGAL, "").replace(/[&<>"']/g, (character) => XML_ESCAPES[character]);
}

function absoluteUrl(href: string): string {
  return new URL(href, SITE_ORIGIN).href;
}

// RFC 822 date at Korea midnight, the day the notice was published.
function rssDate(koreaDate: string): string {
  return new Date(`${koreaDate}T00:00:00+09:00`).toUTCString();
}

// Crawlers collect the item link, so it points at the page the notice introduces;
// every notice shares /updates, which on its own would look like one page repeated.
function itemLink(update: ServiceUpdate): string {
  return absoluteUrl(update.links?.[0]?.href ?? `/updates#${update.id}`);
}

/** RSS 2.0 of the notices already published on the Korea date `today`, newest first. */
export function serviceUpdatesFeed(updates: readonly ServiceUpdate[], today = koreaDateFromInstant()): string {
  const published = [...getPublishedServiceUpdates(updates, today)].sort((left, right) => (
    // Dates are validated YYYY-MM-DD, so string order is calendar order.
    right.publishedDate.localeCompare(left.publishedDate) || left.id.localeCompare(right.id)
  ));
  const items = published.map((update) => [
    "    <item>",
    `      <title>${escapeXml(update.title)}</title>`,
    `      <link>${escapeXml(itemLink(update))}</link>`,
    `      <description>${escapeXml(update.summary)}</description>`,
    `      <pubDate>${rssDate(update.publishedDate)}</pubDate>`,
    `      <guid isPermaLink="false">${escapeXml(update.id)}</guid>`,
    "    </item>",
  ].join("\n"));
  const lastBuildDate = published[0] ? [`    <lastBuildDate>${rssDate(published[0].publishedDate)}</lastBuildDate>`] : [];

  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">',
    "  <channel>",
    "    <title>명로 업데이트 소식</title>",
    `    <link>${absoluteUrl("/updates")}</link>`,
    "    <description>명로의 새 기능과 콘텐츠, 정책 변경 소식</description>",
    "    <language>ko</language>",
    `    <atom:link href="${absoluteUrl(SERVICE_UPDATES_FEED_PATH)}" rel="self" type="application/rss+xml"/>`,
    ...lastBuildDate,
    ...items,
    "  </channel>",
    "</rss>",
    "",
  ].join("\n");
}
