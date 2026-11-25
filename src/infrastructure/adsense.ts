// The publisher ID is used for the site verification tag and ads.txt.
const CLIENT_PATTERN = /^ca-pub-\d{16}$/;

// Google's certification authority ID for AdSense in ads.txt.
const GOOGLE_ADS_TXT_CERTIFICATION_ID = "f08c47fec0942fa0";

export function adsenseClient(value: string | undefined = process.env.NEXT_PUBLIC_ADSENSE_CLIENT): string | null {
  const client = value?.trim();
  return client && CLIENT_PATTERN.test(client) ? client : null;
}

export function adsTxtLine(client: string): string {
  return `google.com, ${client.replace(/^ca-/, "")}, DIRECT, ${GOOGLE_ADS_TXT_CERTIFICATION_ID}`;
}
