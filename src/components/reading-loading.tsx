"use client";

import { useEffect, useState } from "react";

import { BrandMark } from "./brand-mark";

const STEP_MS = 4_000;
const SLOW_GENERATION_MS = 20_000;

export type ReadingLoadingMessages = readonly [string, string, string, string];

// One message per stroke of the brand mark; after the fourth the centre card breathes until the response arrives.
// Progress lives here, so every wait starts again from the first stroke.
export function ReadingLoading({ messages }: { messages: ReadingLoadingMessages }) {
  const [index, setIndex] = useState(0);
  const [slow, setSlow] = useState(false);

  useEffect(() => {
    const stepTimer = globalThis.setInterval(() => {
      setIndex((current) => Math.min(current + 1, messages.length - 1));
    }, STEP_MS);
    const slowTimer = globalThis.setTimeout(() => setSlow(true), SLOW_GENERATION_MS);
    return () => {
      globalThis.clearInterval(stepTimer);
      globalThis.clearTimeout(slowTimer);
    };
  }, [messages.length]);

  return (
    <div className="wizard-card reading-loading">
      <BrandMark breathing={index === messages.length - 1} lit={index + 1} size={104} />
      <div aria-live="polite">
        <p>{messages[index]}</p>
        {slow ? <p className="muted">조금 더 걸리고 있어요. 잠시만 기다려 주세요.</p> : null}
      </div>
    </div>
  );
}
