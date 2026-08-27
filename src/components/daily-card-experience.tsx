"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import {
  DAILY_CARD_CONTENT_VERSION,
  getDailyCardStorageKey,
  getDailyCardContent,
  getKoreanDate,
  parseDailyCardSelectionResponse,
  parseStoredDailyCard,
  serializeStoredDailyCard,
  type DailyCardStorageScope,
  type StoredDailyCard,
} from "@/domain/daily-card-free";
import { ReadingShell } from "./reading-shell";
import styles from "./daily-card-experience.module.css";

const SLOT_COUNT = 5;

type State =
  | { status: "choosing"; selectedSlot: number | null }
  | { status: "loading"; selectedSlot: number; drawId: string }
  | { status: "result"; stored: StoredDailyCard }
  | { status: "error"; selectedSlot: number; drawId: string; message: string };

export function DailyCardExperience({
  storageScope,
}: {
  storageScope: DailyCardStorageScope | null;
}) {
  const [state, setState] = useState<State>({ status: "choosing", selectedSlot: null });
  const requestInFlight = useRef(false);
  const resultHeadingRef = useRef<HTMLHeadingElement>(null);
  const storageKey = storageScope === null ? null : getDailyCardStorageKey(storageScope);

  const restore = useCallback(() => {
    if (storageKey === null) {
      setState({ status: "choosing", selectedSlot: null });
      return;
    }
    let stored: StoredDailyCard | null = null;
    try {
      stored = parseStoredDailyCard(localStorage.getItem(storageKey));
      if (!stored) localStorage.removeItem(storageKey);
    } catch {
      // Storage can be unavailable in privacy-focused browsers; the current view still works.
    }
    setState(stored
      ? { status: "result", stored }
      : { status: "choosing", selectedSlot: null });
  }, [storageKey]);

  useEffect(() => {
    restore();
    let timer: number | undefined;
    const scheduleNextDay = () => {
      if (timer !== undefined) window.clearTimeout(timer);
      timer = window.setTimeout(() => {
        restore();
        scheduleNextDay();
      }, millisecondsUntilNextKoreanDay());
    };
    scheduleNextDay();
    const onVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        restore();
        scheduleNextDay();
      }
    };
    document.addEventListener("visibilitychange", onVisibilityChange);
    return () => {
      if (timer !== undefined) window.clearTimeout(timer);
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, [restore]);

  const content = useMemo(() => state.status === "result"
    ? getDailyCardContent(state.stored.cardId, state.stored.variantIndex)
    : null, [state]);

  useEffect(() => {
    if (state.status === "result" && content) resultHeadingRef.current?.focus();
  }, [content, state.status]);

  async function confirmSelection(selectedSlot: number, existingDrawId?: string) {
    if (requestInFlight.current) return;
    requestInFlight.current = true;
    const drawId = existingDrawId ?? globalThis.crypto.randomUUID();
    setState({ status: "loading", selectedSlot, drawId });
    try {
      const response = await fetch("/api/tarot/daily-card-selections", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          drawId,
          selectedSlot,
          contentVersion: DAILY_CARD_CONTENT_VERSION,
        }),
      });
      if (!response.ok) {
        throw new Error(response.status === 409
          ? "콘텐츠가 새로 바뀌었어요. 페이지를 새로고침해 주세요."
          : "오늘의 카드를 확인하지 못했어요. 잠시 뒤 다시 시도해 주세요.");
      }
      const selection = parseDailyCardSelectionResponse(await response.json());
      if (selection.dateKst !== getKoreanDate()) {
        if (storageKey !== null) {
          try {
            localStorage.removeItem(storageKey);
          } catch {
            // Storage can be unavailable; discarding the stale in-memory response is enough.
          }
        }
        setState({ status: "choosing", selectedSlot: null });
        return;
      }
      const stored: StoredDailyCard = {
        schemaVersion: 1,
        drawId,
        ...selection,
      };
      if (storageKey !== null) {
        try {
          localStorage.setItem(storageKey, serializeStoredDailyCard(stored));
        } catch {
          // Keep the result in memory if localStorage is unavailable.
        }
      }
      setState({ status: "result", stored });
    } catch (error) {
      setState({
        status: "error",
        selectedSlot,
        drawId,
        message: error instanceof Error
          ? error.message
          : "오늘의 카드를 확인하지 못했어요. 잠시 뒤 다시 시도해 주세요.",
      });
    } finally {
      requestInFlight.current = false;
    }
  }

  if (state.status === "result" && content) {
    return (
      <ReadingShell eyebrow="FREE DAILY TAROT" title={content.title} step={2} totalSteps={2}>
        <article className={`wizard-card ${styles.result}`}>
          <p className={styles.cardName}>오늘의 카드 · {content.cardName}</p>
          <h2 ref={resultHeadingRef} tabIndex={-1}>{content.today.heading}</h2>
          <p>{content.today.body}</p>
          <p className={styles.guidance}>{content.guidance[0]}</p>
          <small>{content.disclaimer}</small>
        </article>
        <aside aria-label="광고" className={styles.advertisement}>광고 영역</aside>
        <Link className="secondary-button full-button" href="/tarot">
          다른 타로 리딩 살펴보기
        </Link>
      </ReadingShell>
    );
  }

  const selectedSlot = state.status === "result" ? null : state.selectedSlot;
  return (
    <ReadingShell
      eyebrow="FREE DAILY TAROT"
      title="오늘 마음이 가는 카드 한 장을 골라보세요"
      description="로그인이나 크레딧 없이 오늘의 흐름을 가볍게 살펴볼 수 있어요."
      step={1}
      totalSteps={2}
    >
      <div className="wizard-card draw-panel">
        <div className={styles.cards} aria-label="오늘의 카드 선택">
          {Array.from({ length: SLOT_COUNT }, (_, index) => index + 1).map((slot) => (
            <button
              aria-label={`숨은 카드 ${slot}`}
              aria-pressed={selectedSlot === slot}
              className={`tarot-back ${styles.card} ${selectedSlot === slot ? styles.selected : ""}`}
              disabled={state.status === "loading"}
              key={slot}
              onClick={() => setState({ status: "choosing", selectedSlot: slot })}
              type="button"
            >
              <span aria-hidden="true">✦</span>
            </button>
          ))}
        </div>
        {state.status === "error" ? <p className="form-error" role="alert">{state.message}</p> : null}
        <button
          className="primary-button full-button narrow-button"
          disabled={selectedSlot === null || state.status === "loading"}
          onClick={() => selectedSlot !== null && void confirmSelection(
            selectedSlot,
            state.status === "error" ? state.drawId : undefined,
          )}
          type="button"
        >
          {state.status === "loading" ? "오늘의 카드를 확인하고 있어요" : "이 카드로 확인"}
        </button>
      </div>
    </ReadingShell>
  );
}

function millisecondsUntilNextKoreanDay(now = new Date()): number {
  const [year, month, day] = getKoreanDate(now).split("-").map(Number);
  const nextMidnightKst = Date.UTC(year, month - 1, day + 1) - 9 * 60 * 60 * 1000;
  return Math.max(1_000, nextMidnightKst - now.getTime());
}
