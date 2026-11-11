"use client";

import { useEffect, useRef } from "react";

// A wizard swaps its whole step in place, so a keyboard or screen reader user would otherwise stay
// on a control that no longer exists and the page would keep the old scroll position. When the
// title changes the page returns to the top and the new heading takes focus. The first render is
// left alone: arriving on a page must not steal focus from the browser.
export function StepHeading({ title, focusOnChange }: { title: string; focusOnChange: boolean }) {
  const headingRef = useRef<HTMLHeadingElement>(null);
  const previousTitle = useRef(title);

  useEffect(() => {
    if (previousTitle.current === title) return;
    previousTitle.current = title;
    window.scrollTo({ top: 0, behavior: "instant" });
    if (focusOnChange) headingRef.current?.focus({ preventScroll: true });
  }, [focusOnChange, title]);

  return <h1 ref={headingRef} tabIndex={-1}>{title}</h1>;
}
