// Google AdSense stays off until the publisher ID is configured. The privacy notice's advertising
// section and this ID must ship in the same deployment (MYEONGRO-Docs privacy-data-policy).
const CLIENT_PATTERN = /^ca-pub-\d{10,20}$/;

// Google's certification authority ID for AdSense in ads.txt.
const GOOGLE_ADS_TXT_CERTIFICATION_ID = "f08c47fec0942fa0";

// Read-only content pages that may load the ad script. AI reading entry screens, the free daily
// card, the manseryeok calculator, legal documents and every personal screen stay ad-free.
const AD_ROUTE_PREFIXES = ["/about", "/faq", "/guide", "/zodiac", "/saju/dictionary", "/updates"] as const;

export function adsenseClient(value: string | undefined = process.env.NEXT_PUBLIC_ADSENSE_CLIENT): string | null {
  const client = value?.trim();
  return client && CLIENT_PATTERN.test(client) ? client : null;
}

export function isAdRoute(pathname: string): boolean {
  return pathname === "/" || AD_ROUTE_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
}

export function adsenseScriptSrc(client: string): string {
  return `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${client}`;
}

/** "ca-pub-123" → "google.com, pub-123, DIRECT, f08c47fec0942fa0" */
export function adsTxtLine(client: string): string {
  return `google.com, ${client.replace(/^ca-/, "")}, DIRECT, ${GOOGLE_ADS_TXT_CERTIFICATION_ID}`;
}
