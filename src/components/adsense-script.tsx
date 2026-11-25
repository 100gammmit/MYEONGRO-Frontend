"use client";

import Script from "next/script";
import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";

import { adsenseScriptSrc, isAdRoute } from "@/infrastructure/adsense";

/**
 * Loads the AdSense script only on ad pages. A loaded script cannot be removed, so moving from an
 * ad page to an ad-free screen reloads that screen and leaves no script behind.
 */
export function AdSenseScript({ client }: { client: string | null }) {
  const pathname = usePathname();
  const adRoute = client !== null && isAdRoute(pathname);
  const loaded = useRef(false);

  useEffect(() => {
    if (adRoute) {
      loaded.current = true;
    } else if (loaded.current) {
      window.location.reload();
    }
  }, [adRoute]);

  return adRoute && client ? (
    <Script async crossOrigin="anonymous" src={adsenseScriptSrc(client)} strategy="afterInteractive" />
  ) : null;
}
