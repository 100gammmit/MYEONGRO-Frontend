"use client";

import Script from "next/script";
import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";

import { adsenseScriptSrc, isAdRoute } from "@/infrastructure/adsense";

/** The same-origin path a plain left click on this link would open, or null. */
function internalLinkPath(event: MouseEvent): string | null {
  if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
    return null;
  }
  const anchor = event.target instanceof Element ? event.target.closest("a[href]") : null;
  if (!(anchor instanceof HTMLAnchorElement) || (anchor.target && anchor.target !== "_self") || anchor.hasAttribute("download")) {
    return null;
  }
  const url = new URL(anchor.href, window.location.href);
  return url.origin === window.location.origin ? url.pathname : null;
}

/**
 * Loads the AdSense script only on ad pages. A loaded script cannot be removed, so once it is loaded
 * a link to an ad-free screen opens as a full page load instead of a client-side transition, and any
 * other client-side move to such a screen reloads it. Either way no script stays behind.
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

  useEffect(() => {
    // Capture phase runs before Next.js Link's handler; stopping it here lets the browser follow
    // the link natively, so the ad-free page is never rendered next to the loaded script.
    function onClick(event: MouseEvent) {
      if (!loaded.current) return;
      const path = internalLinkPath(event);
      if (path !== null && !isAdRoute(path)) event.stopImmediatePropagation();
    }
    // Back/forward has already changed the URL; reload it before Next.js restores the screen.
    function onPopState(event: PopStateEvent) {
      if (!loaded.current || isAdRoute(window.location.pathname)) return;
      event.stopImmediatePropagation();
      window.location.reload();
    }
    window.addEventListener("click", onClick, true);
    window.addEventListener("popstate", onPopState, true);
    return () => {
      window.removeEventListener("click", onClick, true);
      window.removeEventListener("popstate", onPopState, true);
    };
  }, []);

  return adRoute && client ? (
    <Script async crossOrigin="anonymous" src={adsenseScriptSrc(client)} strategy="afterInteractive" />
  ) : null;
}
