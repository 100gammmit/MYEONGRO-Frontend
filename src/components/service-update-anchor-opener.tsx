"use client";

import { useEffect } from "react";

// Notice details start folded, so a link to /updates#<id> (a correction pointing at its original,
// or a banner) opens that notice's details instead of landing on a closed summary.
export function ServiceUpdateAnchorOpener() {
  useEffect(() => {
    function openTarget() {
      let id: string;
      try {
        id = decodeURIComponent(window.location.hash.slice(1));
      } catch {
        return;
      }
      if (!id) return;
      const details = document.getElementById(id)?.querySelector("details");
      if (details) details.open = true;
    }
    openTarget();
    window.addEventListener("hashchange", openTarget);
    return () => window.removeEventListener("hashchange", openTarget);
  }, []);

  return null;
}
