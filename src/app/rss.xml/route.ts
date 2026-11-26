import { SERVICE_UPDATES } from "@/domain/service-updates/registry";
import { serviceUpdatesFeed } from "@/infrastructure/service-updates-feed";

// Like /updates, which notices are published depends on the current Korea calendar date.
export const dynamic = "force-dynamic";

export function GET() {
  return new Response(serviceUpdatesFeed(SERVICE_UPDATES), {
    headers: { "content-type": "application/rss+xml; charset=utf-8" },
  });
}
