"use client";

import { useEffect, useRef, useState } from "react";

import type { DailyCardContent } from "@/domain/daily-card-free";

import styles from "./daily-card-experience.module.css";

type Status = "idle" | "working" | "copied" | "error";

const SHARE_ERROR = "공유 링크를 만들지 못했어요. 잠시 뒤 다시 시도해 주세요.";
const COPIED_NOTE_MS = 3000;

async function fetchSharePath(cardId: string, variantIndex: number): Promise<string> {
  const response = await fetch("/api/tarot/daily-card-shares", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ cardId, variantIndex }),
  });
  const body: unknown = response.ok ? await response.json() : null;
  const path = (body as { path?: unknown } | null)?.path;
  if (typeof path !== "string" || !path.startsWith("/tarot/daily/")) throw new Error(SHARE_ERROR);
  return path;
}

function isAbort(error: unknown): boolean {
  return error instanceof DOMException && error.name === "AbortError";
}

// Phones open their own share sheet; elsewhere the link is copied instead. Browsers allow both only
// while the click's user activation lasts, so the link is fetched as soon as the result shows and
// the click hands it over without waiting on the network.
export function DailyCardShareButton({
  cardId,
  variantIndex,
  content,
}: {
  cardId: string;
  variantIndex: number;
  content: DailyCardContent;
}) {
  const [status, setStatus] = useState<Status>("idle");
  const sharePath = useRef<Promise<string> | null>(null);
  const resolvedPath = useRef<string | null>(null);
  const inFlight = useRef(false);

  function loadSharePath(): Promise<string> {
    if (!sharePath.current) {
      const request = fetchSharePath(cardId, variantIndex);
      sharePath.current = request;
      request.then((path) => {
        if (sharePath.current === request) resolvedPath.current = path;
      }, () => {
        // A failed lookup is retried on the next click.
        if (sharePath.current === request) sharePath.current = null;
      });
    }
    return sharePath.current;
  }

  useEffect(() => {
    sharePath.current = null;
    resolvedPath.current = null;
    void loadSharePath().catch(() => undefined);
    // loadSharePath reads the current card through the refs it resets.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cardId, variantIndex]);

  useEffect(() => {
    if (status !== "copied") return;
    const timer = window.setTimeout(() => setStatus("idle"), COPIED_NOTE_MS);
    return () => window.clearTimeout(timer);
  }, [status]);

  async function handOver(url: string) {
    if (typeof navigator.share === "function") {
      try {
        await navigator.share({ title: `오늘의 카드: ${content.cardName}`, text: `오늘의 카드: ${content.cardName} · ${content.title}`, url });
        setStatus("idle");
        return;
      } catch (error) {
        // Closing the share sheet is not a failure; any other refusal falls back to copying.
        if (isAbort(error)) {
          setStatus("idle");
          return;
        }
      }
    }
    await navigator.clipboard.writeText(url);
    setStatus("copied");
  }

  async function share() {
    if (inFlight.current) return;
    inFlight.current = true;
    setStatus("working");
    try {
      const path = resolvedPath.current ?? await loadSharePath();
      await handOver(new URL(path, window.location.origin).href);
    } catch {
      setStatus("error");
    } finally {
      inFlight.current = false;
    }
  }

  return (
    <div className={styles.share}>
      <button className="primary-button full-button" disabled={status === "working"} onClick={() => void share()} type="button">
        <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="18" cy="5" r="3" />
          <circle cx="6" cy="12" r="3" />
          <circle cx="18" cy="19" r="3" />
          <path d="M8.6 13.5l6.8 4M15.4 6.5l-6.8 4" />
        </svg>
        오늘의 카드 공유하기
      </button>
      <p className={styles.shareStatus} role="status">
        {status === "copied" ? "링크를 복사했어요" : ""}
      </p>
      {status === "error" ? <p className="form-error" role="alert">{SHARE_ERROR}</p> : null}
    </div>
  );
}
