"use client";

import { useRef, useState } from "react";

import type { DailyCardContent } from "@/domain/daily-card-free";

import styles from "./daily-card-experience.module.css";

type Status = { kind: "idle" | "working" } | { kind: "copied" } | { kind: "error" };

const SHARE_ERROR = "공유 링크를 만들지 못했어요. 잠시 뒤 다시 시도해 주세요.";

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

// Phones open their own share sheet; elsewhere the link is copied instead.
export function DailyCardShareButton({
  cardId,
  variantIndex,
  content,
}: {
  cardId: string;
  variantIndex: number;
  content: DailyCardContent;
}) {
  const [status, setStatus] = useState<Status>({ kind: "idle" });
  const inFlight = useRef(false);

  async function share() {
    if (inFlight.current) return;
    inFlight.current = true;
    setStatus({ kind: "working" });
    try {
      const url = new URL(await fetchSharePath(cardId, variantIndex), window.location.origin).href;
      if (typeof navigator.share === "function") {
        try {
          await navigator.share({ title: `오늘의 카드: ${content.cardName}`, text: `오늘의 카드: ${content.cardName} · ${content.title}`, url });
          setStatus({ kind: "idle" });
        } catch (error) {
          // Closing the share sheet is not a failure.
          setStatus(error instanceof DOMException && error.name === "AbortError" ? { kind: "idle" } : { kind: "error" });
        }
        return;
      }
      await navigator.clipboard.writeText(url);
      setStatus({ kind: "copied" });
    } catch {
      setStatus({ kind: "error" });
    } finally {
      inFlight.current = false;
    }
  }

  return (
    <div className={styles.share}>
      <button className="primary-button full-button" disabled={status.kind === "working"} onClick={() => void share()} type="button">
        <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="18" cy="5" r="3" />
          <circle cx="6" cy="12" r="3" />
          <circle cx="18" cy="19" r="3" />
          <path d="M8.6 13.5l6.8 4M15.4 6.5l-6.8 4" />
        </svg>
        오늘의 카드 공유하기
      </button>
      <p className={styles.shareStatus} role="status">
        {status.kind === "copied" ? "링크를 복사했어요" : ""}
      </p>
      {status.kind === "error" ? <p className="form-error" role="alert">{SHARE_ERROR}</p> : null}
    </div>
  );
}
