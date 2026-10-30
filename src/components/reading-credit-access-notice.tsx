"use client";

import type { ReadingCreditAccess } from "@/domain/reading-credit";

export const INSUFFICIENT_CREDITS_MESSAGE = "크레딧이 부족합니다. 내일 다시 시도해 주세요.";

export function readingCreationErrorMessage(code: string): string | undefined {
  switch (code) {
    case "READING_GENERATION_IN_PROGRESS":
      return "이미 생성 중인 리딩이 있어요. 완료 후 다시 시도해 주세요.";
    case "INSUFFICIENT_READING_CREDITS":
      return INSUFFICIENT_CREDITS_MESSAGE;
    case "READING_DAILY_CAPACITY_REACHED":
      return "오늘은 새 리딩을 더 만들 수 없어요. 내일 다시 시도해 주세요.";
    case "READING_GENERATION_EXPIRED":
      return "리딩 생성 시간이 초과됐어요. 다시 시도해 주세요.";
    default:
      return undefined;
  }
}

export function ReadingCreditAccessNotice({
  access,
  onRetry,
}: {
  access: ReadingCreditAccess;
  onRetry: () => void;
}) {
  if (access.status === "allowed") {
    return <p className="credit-notice">{access.required}크레딧 사용 · 현재 {access.remaining}크레딧</p>;
  }
  if (access.status === "loading") {
    return <p className="credit-notice" aria-live="polite">크레딧을 확인하고 있어요.</p>;
  }
  if (access.status === "generation-in-progress") {
    return <p className="credit-notice" role="alert">이미 생성 중인 리딩이 있어요. 완료 후 다시 시작해 주세요.</p>;
  }
  if (access.status === "insufficient") {
    return (
      <p className="credit-notice" role="alert">{INSUFFICIENT_CREDITS_MESSAGE}</p>
    );
  }
  return (
    <div className="credit-notice" role="alert">
      <p>크레딧을 확인하지 못했어요.</p>
      <button className="secondary-button" onClick={onRetry} type="button">다시 확인</button>
    </div>
  );
}
