import { adsTxtLine, adsenseClient } from "@/infrastructure/adsense";

// Served only when the AdSense publisher ID is configured; otherwise there is no ads.txt.
export function GET() {
  const client = adsenseClient();
  if (!client) {
    return new Response("Not Found", { status: 404, headers: { "content-type": "text/plain; charset=utf-8" } });
  }
  return new Response(`${adsTxtLine(client)}\n`, { headers: { "content-type": "text/plain; charset=utf-8" } });
}
